const Evidence = require('../models/Evidence');
const User = require('../models/User');
const SigningInfo = require('../models/SigningInfo');
const History = require('../models/History');

/**
 * Service xử lý quy trình trình ký minh chứng theo đúng workflow
 * Dựa trên quy trình: Chưa trình ký -> Chờ ký duyệt -> Chèn chữ ký (PDF) -> Đang ký -> Hoàn thành/Từ chối
 */

// Bước 1: Khởi tạo trình ký - Chọn người ký
const initiateSigningProcess = async (evidenceId, signers, reason, initiatorId) => {
    try {
        const evidence = await Evidence.findById(evidenceId).populate('files');

        if (!evidence) {
            throw new Error('Minh chứng không tồn tại');
        }

        if (evidence.status !== 'draft') {
            throw new Error('Chỉ có thể trình ký minh chứng ở trạng thái "Chưa trình ký"');
        }

        // Validate signers
        if (!signers || signers.length === 0) {
            throw new Error('Cần ít nhất một người ký');
        }

        // Kiểm tra thứ tự ký
        const orders = signers.map(s => s.order).sort((a, b) => a - b);
        for (let i = 0; i < orders.length; i++) {
            if (orders[i] !== i + 1) {
                throw new Error('Thứ tự ký phải liên tục từ 1');
            }
        }

        // Kiểm tra người ký có tồn tại
        const userIds = signers.map(s => s.userId);
        const users = await User.find({ _id: { $in: userIds } });
        if (users.length !== userIds.length) {
            throw new Error('Có người ký không tồn tại');
        }

        // Tạo signing process
        const signingProcess = {
            signers: signers.map(signer => ({
                userId: signer.userId,
                order: signer.order,
                role: signer.role || 'approver',
                status: 'pending'
            })),
            status: 'pending_signatures', // Chờ chèn chữ ký
            initiatedBy: initiatorId,
            initiatedAt: new Date(),
            reason: reason || '',
            currentStep: 1
        };

        // Cập nhật evidence
        evidence.signingProcess = signingProcess;

        // Kiểm tra xem có file PDF không để quyết định trạng thái tiếp theo
        const hasPdfFile = evidence.files.some(file => file.mimeType === 'application/pdf');

        if (hasPdfFile) {
            evidence.status = 'pending_approval'; // Cần chèn chữ ký
        } else {
            // Không có PDF, chuyển thẳng sang đang ký
            evidence.status = 'in_progress';
            evidence.signingProcess.status = 'in_progress';
        }

        evidence.updatedAt = new Date();
        await evidence.save();

        // Ghi log
        await logSigningActivity(initiatorId, evidenceId, 'initiate_signing', 'success', {
            signersCount: signers.length,
            reason,
            hasPdfFile
        });

        return {
            success: true,
            message: 'Khởi tạo trình ký thành công',
            data: {
                evidenceId,
                status: evidence.status,
                requiresSignatureInsertion: hasPdfFile,
                signers: signers.length
            }
        };

    } catch (error) {
        console.error('Initiate signing process error:', error);
        throw error;
    }
};

// Bước 2: Chèn ảnh chữ ký vào PDF (chỉ với file PDF)
const insertSignatureImages = async (evidenceId, signaturePositions, userId) => {
    try {
        const evidence = await Evidence.findById(evidenceId).populate('files');

        if (!evidence) {
            throw new Error('Minh chứng không tồn tại');
        }

        if (evidence.status !== 'pending_approval') {
            throw new Error('Minh chứng không ở trạng thái chờ chèn chữ ký');
        }

        if (!evidence.signingProcess) {
            throw new Error('Minh chứng chưa được khởi tạo trình ký');
        }

        // Kiểm tra quyền chèn chữ ký (người khởi tạo hoặc admin)
        if (evidence.signingProcess.initiatedBy.toString() !== userId.toString()) {
            // Có thể cho phép admin hoặc người có quyền đặc biệt
            throw new Error('Không có quyền chèn chữ ký cho minh chứng này');
        }

        // Validate PDF files
        const pdfFiles = evidence.files.filter(file => file.mimeType === 'application/pdf');
        if (pdfFiles.length === 0) {
            throw new Error('Không có file PDF để chèn chữ ký');
        }

        // Lưu vị trí chữ ký (trong thực tế sẽ xử lý PDF thực sự)
        evidence.signingProcess.signaturePositions = signaturePositions;
        evidence.signingProcess.insertedAt = new Date();
        evidence.signingProcess.insertedBy = userId;
        evidence.signingProcess.status = 'signatures_inserted';

        // Chuyển sang trạng thái sẵn sàng ký
        evidence.status = 'signatures_inserted';
        evidence.updatedAt = new Date();
        await evidence.save();

        // Ghi log
        await logSigningActivity(userId, evidenceId, 'insert_signatures', 'success', {
            pdfFilesCount: pdfFiles.length,
            signaturePositions: Object.keys(signaturePositions).length
        });

        return {
            success: true,
            message: 'Chèn ảnh chữ ký thành công',
            data: {
                evidenceId,
                status: evidence.status,
                pdfFilesProcessed: pdfFiles.length
            }
        };

    } catch (error) {
        console.error('Insert signature images error:', error);
        throw error;
    }
};

// Bước 3: Ký duyệt minh chứng
const approveEvidence = async (evidenceId, decision, signingInfoId, password, reason, userId) => {
    try {
        const evidence = await Evidence.findById(evidenceId)
            .populate('files')
            .populate('signingProcess.signers.userId');

        if (!evidence) {
            throw new Error('Minh chứng không tồn tại');
        }

        if (!['signatures_inserted', 'in_progress'].includes(evidence.status)) {
            throw new Error('Minh chứng không ở trạng thái có thể ký');
        }

        if (!evidence.signingProcess) {
            throw new Error('Minh chứng chưa có quy trình ký');
        }

        // Tìm người ký hiện tại
        const currentSigner = evidence.signingProcess.signers.find(signer =>
            signer.userId._id.toString() === userId.toString() &&
            signer.status === 'pending'
        );

        if (!currentSigner) {
            throw new Error('Bạn không có quyền ký minh chứng này hoặc đã ký rồi');
        }

        // Kiểm tra thứ tự ký
        const currentStep = evidence.signingProcess.currentStep || 1;
        if (currentSigner.order !== currentStep) {
            throw new Error(`Chưa đến lượt ký của bạn. Hiện tại đang chờ người ký thứ ${currentStep}`);
        }

        if (decision === 'approve') {
            // Xử lý phê duyệt
            if (!signingInfoId) {
                throw new Error('Cần chọn cấu hình chữ ký số');
            }

            const signingInfo = await SigningInfo.findById(signingInfoId);
            if (!signingInfo) {
                throw new Error('Cấu hình chữ ký không tồn tại');
            }

            if (signingInfo.status !== 'active') {
                throw new Error('Cấu hình chữ ký không hoạt động');
            }

            if (signingInfo.isExpired()) {
                throw new Error('Chứng chỉ ký đã hết hạn');
            }

            // Validate password (giả lập)
            if (!password) {
                throw new Error('Cần nhập mật khẩu chữ ký số');
            }

            // Cập nhật trạng thái người ký
            currentSigner.status = 'signed';
            currentSigner.signedAt = new Date();
            currentSigner.signingInfoId = signingInfoId;
            currentSigner.reason = reason || '';

            // Cập nhật usage count
            await signingInfo.incrementUsage();

        } else if (decision === 'reject') {
            // Xử lý từ chối
            if (!reason || !reason.trim()) {
                throw new Error('Cần nhập lý do từ chối');
            }

            currentSigner.status = 'rejected';
            currentSigner.signedAt = new Date();
            currentSigner.reason = reason;

            // Khi có người từ chối, toàn bộ quy trình bị từ chối
            evidence.status = 'rejected';
            evidence.signingProcess.status = 'rejected';
            evidence.rejectedAt = new Date();
            evidence.rejectionReason = reason;

        } else {
            throw new Error('Quyết định không hợp lệ');
        }

        // Kiểm tra xem có còn người nào cần ký không
        if (decision === 'approve') {
            const nextStep = currentStep + 1;
            const nextSigner = evidence.signingProcess.signers.find(s => s.order === nextStep);

            if (nextSigner) {
                // Còn người cần ký
                evidence.status = 'in_progress';
                evidence.signingProcess.status = 'in_progress';
                evidence.signingProcess.currentStep = nextStep;
            } else {
                // Đã ký xong
                evidence.status = 'completed';
                evidence.signingProcess.status = 'completed';
                evidence.completedAt = new Date();
            }
        }

        evidence.updatedAt = new Date();
        await evidence.save();

        // Ghi log
        await logSigningActivity(userId, evidenceId, decision === 'approve' ? 'approve' : 'reject', 'success', {
            signerOrder: currentSigner.order,
            signerRole: currentSigner.role,
            reason: reason || '',
            finalStatus: evidence.status
        });

        const message = decision === 'approve'
            ? (evidence.status === 'completed' ? 'Ký duyệt thành công. Quy trình hoàn tất.' : 'Ký duyệt thành công.')
            : 'Từ chối thành công.';

        return {
            success: true,
            message,
            data: {
                evidenceId,
                status: evidence.status,
                decision,
                isCompleted: evidence.status === 'completed',
                nextSigner: evidence.status === 'in_progress' ? evidence.signingProcess.currentStep : null
            }
        };

    } catch (error) {
        console.error('Approve evidence error:', error);
        throw error;
    }
};

// Cập nhật thông tin trình ký (trước khi ai ký)
const updateSigningProcess = async (evidenceId, signers, reason, userId) => {
    try {
        const evidence = await Evidence.findById(evidenceId);

        if (!evidence) {
            throw new Error('Minh chứng không tồn tại');
        }

        if (!['pending_approval', 'signatures_inserted'].includes(evidence.status)) {
            throw new Error('Không thể cập nhật khi đã có người ký');
        }

        if (!evidence.signingProcess) {
            throw new Error('Minh chứng chưa có quy trình ký');
        }

        // Kiểm tra quyền cập nhật
        if (evidence.signingProcess.initiatedBy.toString() !== userId.toString()) {
            throw new Error('Không có quyền cập nhật quy trình ký này');
        }

        // Kiểm tra đã có ai ký chưa
        const hasSigned = evidence.signingProcess.signers.some(s => s.status === 'signed');
        if (hasSigned) {
            throw new Error('Không thể cập nhật khi đã có người ký');
        }

        // Validate signers mới
        if (!signers || signers.length === 0) {
            throw new Error('Cần ít nhất một người ký');
        }

        const orders = signers.map(s => s.order).sort((a, b) => a - b);
        for (let i = 0; i < orders.length; i++) {
            if (orders[i] !== i + 1) {
                throw new Error('Thứ tự ký phải liên tục từ 1');
            }
        }

        // Cập nhật thông tin
        evidence.signingProcess.signers = signers.map(signer => ({
            userId: signer.userId,
            order: signer.order,
            role: signer.role || 'approver',
            status: 'pending'
        }));

        if (reason !== undefined) {
            evidence.signingProcess.reason = reason;
        }

        evidence.updatedAt = new Date();
        await evidence.save();

        // Ghi log
        await logSigningActivity(userId, evidenceId, 'update_signing', 'success', {
            newSignersCount: signers.length,
            reason
        });

        return {
            success: true,
            message: 'Cập nhật thông tin trình ký thành công',
            data: {
                evidenceId,
                signersCount: signers.length
            }
        };

    } catch (error) {
        console.error('Update signing process error:', error);
        throw error;
    }
};

// Hủy trình ký
const cancelSigningProcess = async (evidenceId, reason, userId, userRole) => {
    try {
        const evidence = await Evidence.findById(evidenceId);

        if (!evidence) {
            throw new Error('Minh chứng không tồn tại');
        }

        if (!evidence.signingProcess) {
            throw new Error('Minh chứng chưa có quy trình ký');
        }

        if (evidence.status === 'completed') {
            throw new Error('Không thể hủy quy trình đã hoàn thành');
        }

        // Kiểm tra quyền hủy (người khởi tạo hoặc admin)
        const canCancel = evidence.signingProcess.initiatedBy.toString() === userId.toString() ||
            userRole === 'admin';

        if (!canCancel) {
            throw new Error('Không có quyền hủy quy trình ký này');
        }

        // Hủy quy trình
        evidence.status = 'draft';
        evidence.signingProcess = null;
        evidence.updatedAt = new Date();
        await evidence.save();

        // Ghi log
        await logSigningActivity(userId, evidenceId, 'cancel_signing', 'success', {
            reason: reason || 'Không có lý do',
            canceledBy: userRole
        });

        return {
            success: true,
            message: 'Hủy trình ký thành công',
            data: {
                evidenceId,
                status: 'draft'
            }
        };

    } catch (error) {
        console.error('Cancel signing process error:', error);
        throw error;
    }
};

// Lấy danh sách minh chứng theo trạng thái workflow
const getEvidencesByWorkflowStatus = async (filters, userId, userRole) => {
    try {
        const {
            status,
            search,
            standardId,
            criteriaId,
            page = 1,
            limit = 10
        } = filters;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        // Access control (nếu không phải admin)
        if (userRole !== 'admin') {
            query.$or = [
                { createdBy: userId },
                { assignedTo: userId },
                { 'signingProcess.signers.userId': userId }
            ];
        }

        const [evidences, total] = await Promise.all([
            Evidence.find(query)
                .populate('files', 'originalName size mimeType')
                .populate('createdBy', 'fullName position')
                .populate('assignedTo', 'fullName position')
                .populate('signingProcess.signers.userId', 'fullName position')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Evidence.countDocuments(query)
        ]);

        // Thêm thông tin computed fields
        const evidencesWithMeta = evidences.map(evidence => {
            const evidenceObj = evidence.toObject();

            evidenceObj.canInitiateSigning = canInitiateSigning(evidence, userId);
            evidenceObj.canUserSign = canUserSign(evidence, userId);
            evidenceObj.canCancelSigning = canCancelSigning(evidence, userId, userRole);
            evidenceObj.canUpdateSigning = canUpdateSigning(evidence, userId, userRole);
            evidenceObj.requiresSignatureInsertion = requiresSignatureInsertion(evidence);
            evidenceObj.nextSigners = getNextSigners(evidence);
            evidenceObj.signingProgress = getSigningProgress(evidence);

            return evidenceObj;
        });

        return {
            success: true,
            data: {
                evidences: evidencesWithMeta,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1
            }
        };

    } catch (error) {
        console.error('Get evidences by workflow status error:', error);
        throw error;
    }
};

// Helper functions
const canInitiateSigning = (evidence, userId) => {
    return evidence.status === 'draft' &&
        (evidence.createdBy._id.toString() === userId.toString() ||
            evidence.assignedTo?._id.toString() === userId.toString());
};

const canUserSign = (evidence, userId) => {
    if (!evidence.signingProcess || !['signatures_inserted', 'in_progress'].includes(evidence.status)) {
        return false;
    }

    const currentStep = evidence.signingProcess.currentStep || 1;
    const currentSigner = evidence.signingProcess.signers.find(s =>
        s.order === currentStep && s.status === 'pending'
    );

    return currentSigner && currentSigner.userId._id.toString() === userId.toString();
};

const canCancelSigning = (evidence, userId, userRole) => {
    if (!evidence.signingProcess || evidence.status === 'completed') {
        return false;
    }

    return evidence.signingProcess.initiatedBy.toString() === userId.toString() ||
        userRole === 'admin';
};

const canUpdateSigning = (evidence, userId, userRole) => {
    if (!evidence.signingProcess ||
        !['pending_approval', 'signatures_inserted'].includes(evidence.status)) {
        return false;
    }

    const hasSigned = evidence.signingProcess.signers.some(s => s.status === 'signed');
    if (hasSigned) return false;

    return evidence.signingProcess.initiatedBy.toString() === userId.toString() ||
        userRole === 'admin';
};

const requiresSignatureInsertion = (evidence) => {
    if (evidence.status !== 'pending_approval') return false;

    return evidence.files.some(file => file.mimeType === 'application/pdf');
};

const getNextSigners = (evidence) => {
    if (!evidence.signingProcess || evidence.status !== 'in_progress') {
        return [];
    }

    const currentStep = evidence.signingProcess.currentStep || 1;
    return evidence.signingProcess.signers
        .filter(s => s.order >= currentStep && s.status === 'pending')
        .sort((a, b) => a.order - b.order);
};

const getSigningProgress = (evidence) => {
    if (!evidence.signingProcess) return null;

    const totalSigners = evidence.signingProcess.signers.length;
    const signedCount = evidence.signingProcess.signers.filter(s => s.status === 'signed').length;

    return {
        totalSigners,
        signedCount,
        percentage: Math.round((signedCount / totalSigners) * 100)
    };
};

// Ghi log activity
const logSigningActivity = async (userId, evidenceId, action, status, details = {}) => {
    try {
        await History.create({
            userId,
            action,
            module: 'evidence_workflow',
            targetType: 'Evidence',
            targetId: evidenceId,
            description: getActionDescription(action, status),
            details,
            status,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Log signing activity error:', error);
    }
};

const getActionDescription = (action, status) => {
    const descriptions = {
        'initiate_signing': status === 'success' ? 'Khởi tạo trình ký thành công' : 'Khởi tạo trình ký thất bại',
        'insert_signatures': status === 'success' ? 'Chèn chữ ký thành công' : 'Chèn chữ ký thất bại',
        'approve': status === 'success' ? 'Ký duyệt thành công' : 'Ký duyệt thất bại',
        'reject': status === 'success' ? 'Từ chối thành công' : 'Từ chối thất bại',
        'update_signing': status === 'success' ? 'Cập nhật trình ký thành công' : 'Cập nhật trình ký thất bại',
        'cancel_signing': status === 'success' ? 'Hủy trình ký thành công' : 'Hủy trình ký thất bại'
    };

    return descriptions[action] || `${action} - ${status}`;
};

module.exports = {
    initiateSigningProcess,
    insertSignatureImages,
    approveEvidence,
    updateSigningProcess,
    cancelSigningProcess,
    getEvidencesByWorkflowStatus
};