const Evidence = require('../models/Evidence');
const File = require('../models/File');
const SigningInfo = require('../models/SigningInfo');
const User = require('../models/User');


const getEvidencesByWorkflowStatus = async (req, res) => {
    try {
        const {
            status = 'draft', // draft, pending_approval, in_progress, completed, rejected
            page = 1,
            limit = 20,
            search,
            standardId,
            criteriaId
        } = req.query;
        const userId = req.user.id;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query based on user permissions and status
        let query = { status };

        // Access control
        if (req.user.role !== 'admin') {
            query.$or = [
                { createdBy: userId },
                { assignedTo: userId },
                { 'signingProcess.signers.userId': userId }
            ];
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        const [evidences, total] = await Promise.all([
            Evidence.find(query)
                .populate('files')
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

        res.json({
            success: true,
            data: {
                evidences,
                pagination: {
                    current: pageNum,
                    total: Math.ceil(total / limitNum),
                    count: total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get evidences by workflow status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách minh chứng'
        });
    }
};

// Bước 1: Trình ký - Chọn người ký duyệt
const initiateSigningProcess = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { signers, reason } = req.body;
        const userId = req.user.id;

        const evidence = await Evidence.findById(evidenceId)
            .populate('files');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Kiểm tra quyền trình ký
        if (evidence.createdBy.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền trình ký minh chứng này'
            });
        }

        // Kiểm tra trạng thái
        if (evidence.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Minh chứng không ở trạng thái có thể trình ký'
            });
        }

        // Validate signers
        if (!signers || signers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cần ít nhất một người ký duyệt'
            });
        }

        // Validate signers exist
        const signerIds = signers.map(s => s.userId);
        const validSigners = await User.find({ _id: { $in: signerIds } });
        if (validSigners.length !== signerIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số người ký không tồn tại'
            });
        }

        // Setup signing process
        evidence.signingProcess = {
            signers: signers.map((signer, index) => ({
                userId: signer.userId,
                order: signer.order || (index + 1),
                role: signer.role || 'approver',
                status: 'pending',
                canSignParallel: signer.canSignParallel || false,
                addedAt: new Date()
            })),
            currentStep: 1,
            status: 'pending_signatures',
            initiatedBy: userId,
            initiatedAt: new Date(),
            reason
        };

        evidence.status = 'pending_approval';
        evidence.updatedBy = userId;
        await evidence.save();

        // Check if any files are PDF - if yes, go to signature insertion step
        const hasPdfFiles = evidence.files.some(file => file.mimeType === 'application/pdf');

        res.json({
            success: true,
            message: 'Khởi tạo quy trình ký thành công',
            data: {
                evidenceId: evidence._id,
                status: evidence.status,
                signingProcess: evidence.signingProcess,
                nextStep: hasPdfFiles ? 'insert_signatures' : 'notify_signers',
                hasPdfFiles
            }
        });

    } catch (error) {
        console.error('Initiate signing process error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khởi tạo quy trình ký'
        });
    }
};

// Bước 2: Chèn ảnh chữ ký (chỉ dành cho file PDF)
const insertSignatureImages = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { signaturePositions } = req.body; // { fileId: [{ signerId, page, x, y, width, height }] }
        const userId = req.user.id;

        const evidence = await Evidence.findById(evidenceId)
            .populate('files')
            .populate('signingProcess.signers.userId', 'fullName digitalSignature');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Kiểm tra quyền
        if (evidence.createdBy.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thao tác với minh chứng này'
            });
        }

        if (evidence.status !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Minh chứng không ở trạng thái có thể chèn chữ ký'
            });
        }

        // Validate signature positions
        for (const [fileId, positions] of Object.entries(signaturePositions)) {
            const file = evidence.files.find(f => f._id.toString() === fileId);
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: `File ${fileId} không tồn tại`
                });
            }

            if (file.mimeType !== 'application/pdf') {
                return res.status(400).json({
                    success: false,
                    message: `File ${file.originalName} không phải PDF, không thể chèn chữ ký`
                });
            }

            // Validate positions
            for (const pos of positions) {
                const signer = evidence.signingProcess.signers.find(s =>
                    s.userId._id.toString() === pos.signerId
                );
                if (!signer) {
                    return res.status(400).json({
                        success: false,
                        message: `Người ký ${pos.signerId} không có trong danh sách`
                    });
                }
            }
        }

        // Store signature positions metadata
        evidence.signaturePositions = signaturePositions;
        evidence.signingProcess.status = 'signatures_inserted';
        evidence.status = 'in_progress';

        // Thực tế sẽ tích hợp với PDF processing library để chèn signature placeholders
        // Ở đây chỉ lưu metadata

        await evidence.save();

        // Notify first signers
        await notifyNextSigners(evidence);

        res.json({
            success: true,
            message: 'Chèn vị trí chữ ký thành công. Minh chứng đã sẵn sàng để ký duyệt.',
            data: {
                evidenceId: evidence._id,
                status: evidence.status,
                nextSigners: getNextSigners(evidence)
            }
        });

    } catch (error) {
        console.error('Insert signature images error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chèn ảnh chữ ký'
        });
    }
};

// Ký duyệt minh chứng (dành cho người được chỉ định)
const approveEvidence = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { signingInfoId, password, reason, decision } = req.body; // decision: 'approve' | 'reject'
        const userId = req.user.id;

        const evidence = await Evidence.findById(evidenceId)
            .populate('files')
            .populate('signingProcess.signers.userId', 'fullName position');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Kiểm tra người ký có trong danh sách không
        const signerInfo = evidence.signingProcess.signers.find(
            s => s.userId._id.toString() === userId.toString()
        );

        if (!signerInfo) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền ký duyệt minh chứng này'
            });
        }

        if (signerInfo.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã xử lý minh chứng này rồi'
            });
        }

        // Kiểm tra thứ tự ký
        if (!canUserSignNow(evidence, userId)) {
            return res.status(400).json({
                success: false,
                message: 'Chưa đến lượt ký duyệt của bạn'
            });
        }

        if (decision === 'reject') {
            // Từ chối ký duyệt
            signerInfo.status = 'rejected';
            signerInfo.signedAt = new Date();
            signerInfo.reason = reason;

            evidence.status = 'rejected';
            evidence.signingProcess.status = 'rejected';
            evidence.rejectedAt = new Date();
            evidence.rejectedBy = userId;
            evidence.rejectionReason = reason;

        } else {
            // Phê duyệt
            if (!signingInfoId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần chọn cấu hình chữ ký số'
                });
            }

            // Validate signing info
            const signingInfo = await SigningInfo.findById(signingInfoId);
            if (!signingInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Cấu hình chữ ký không tồn tại'
                });
            }

            // Check permissions and password
            if (signingInfo.security.requirePassword && !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần nhập mật khẩu chữ ký số'
                });
            }

            // Perform digital signing
            const signingResult = await performDigitalSigning(
                evidence,
                userId,
                signingInfo,
                { password, reason }
            );

            if (!signingResult.success) {
                return res.status(500).json({
                    success: false,
                    message: signingResult.message || 'Lỗi khi ký số'
                });
            }

            // Update signer status
            signerInfo.status = 'signed';
            signerInfo.signedAt = new Date();
            signerInfo.reason = reason;
            signerInfo.signingInfoId = signingInfoId;
            signerInfo.signature = signingResult.signature;

            // Check if all required signers have signed
            const allSigned = evidence.signingProcess.signers
                .filter(s => s.status !== 'rejected')
                .every(s => s.status === 'signed');

            if (allSigned) {
                evidence.status = 'completed';
                evidence.signingProcess.status = 'completed';
                evidence.completedAt = new Date();
            }
        }

        evidence.updatedBy = userId;
        await evidence.save();

        // Update signing info usage
        if (decision === 'approve' && signingInfoId) {
            await SigningInfo.findByIdAndUpdate(signingInfoId, {
                $inc: { usageCount: 1 },
                lastUsed: new Date()
            });
        }

        // Notify next signers if not completed/rejected
        if (evidence.status === 'in_progress') {
            await notifyNextSigners(evidence);
        }

        // Log activity
        await logSigningActivity(userId, evidenceId, decision, {
            signingInfoId,
            reason,
            status: evidence.status
        });

        res.json({
            success: true,
            message: decision === 'approve' ? 'Ký duyệt thành công' : 'Từ chối thành công',
            data: {
                evidenceId: evidence._id,
                status: evidence.status,
                signingProcess: evidence.signingProcess,
                isCompleted: evidence.status === 'completed',
                nextSigners: evidence.status === 'in_progress' ? getNextSigners(evidence) : []
            }
        });

    } catch (error) {
        console.error('Approve evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi ký duyệt minh chứng'
        });
    }
};

// Hủy trình ký (người tạo có thể hủy)
const cancelSigningProcess = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const evidence = await Evidence.findById(evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Kiểm tra quyền hủy
        if (evidence.createdBy.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền hủy trình ký'
            });
        }

        if (!['pending_approval', 'in_progress'].includes(evidence.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy trình ký ở trạng thái hiện tại'
            });
        }

        // Reset to draft status
        evidence.status = 'draft';
        evidence.signingProcess = null;
        evidence.signaturePositions = null;
        evidence.cancelledAt = new Date();
        evidence.cancelledBy = userId;
        evidence.cancellationReason = reason;
        evidence.updatedBy = userId;

        await evidence.save();

        // Log activity
        await logSigningActivity(userId, evidenceId, 'cancel', { reason });

        res.json({
            success: true,
            message: 'Hủy trình ký thành công',
            data: {
                evidenceId: evidence._id,
                status: evidence.status
            }
        });

    } catch (error) {
        console.error('Cancel signing process error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy trình ký'
        });
    }
};

// Cập nhật thông tin trình ký (trước khi bắt đầu ký)
const updateSigningProcess = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { signers, reason } = req.body;
        const userId = req.user.id;

        const evidence = await Evidence.findById(evidenceId);

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Kiểm tra quyền
        if (evidence.createdBy.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật trình ký'
            });
        }

        // Chỉ cho phép cập nhật khi chưa có ai ký
        const hasAnySigned = evidence.signingProcess?.signers?.some(s => s.status === 'signed');
        if (hasAnySigned) {
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật khi đã có người ký duyệt'
            });
        }

        if (!['pending_approval', 'in_progress'].includes(evidence.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật ở trạng thái hiện tại'
            });
        }

        // Update signers
        evidence.signingProcess.signers = signers.map((signer, index) => ({
            userId: signer.userId,
            order: signer.order || (index + 1),
            role: signer.role || 'approver',
            status: 'pending',
            canSignParallel: signer.canSignParallel || false,
            addedAt: new Date()
        }));

        evidence.signingProcess.reason = reason;
        evidence.signingProcess.updatedAt = new Date();
        evidence.updatedBy = userId;

        await evidence.save();

        res.json({
            success: true,
            message: 'Cập nhật thông tin trình ký thành công',
            data: {
                evidenceId: evidence._id,
                signingProcess: evidence.signingProcess
            }
        });

    } catch (error) {
        console.error('Update signing process error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin trình ký'
        });
    }
};

// Helper functions
const canUserSignNow = (evidence, userId) => {
    const signers = evidence.signingProcess.signers;
    const userSigner = signers.find(s => s.userId._id.toString() === userId.toString());

    if (!userSigner) return false;

    // Check if all previous order signers have signed
    const earlierSigners = signers.filter(s => s.order < userSigner.order);
    const allEarlierSigned = earlierSigners.every(s => s.status === 'signed');

    return allEarlierSigned;
};

const getNextSigners = (evidence) => {
    return evidence.signingProcess.signers.filter(s =>
        s.status === 'pending' && canUserSignNow(evidence, s.userId._id)
    );
};

const notifyNextSigners = async (evidence) => {
    const nextSigners = getNextSigners(evidence);
    // Implementation for sending notifications
    for (const signer of nextSigners) {
        console.log(`Notify signer ${signer.userId.fullName} for evidence ${evidence._id}`);
        // Send email/SMS notification
    }
};

const performDigitalSigning = async (evidence, userId, signingInfo, params) => {
    try {
        // Implementation of actual digital signing
        // This would integrate with actual digital signature library

        const signature = `signature_${Date.now()}_${userId}`;

        return {
            success: true,
            signature,
            timestamp: new Date()
        };
    } catch (error) {
        return {
            success: false,
            message: 'Lỗi khi thực hiện ký số'
        };
    }
};

const logSigningActivity = async (userId, evidenceId, action, details) => {
    try {
        const History = require('../models/History');

        await History.create({
            userId,
            action: `evidence_${action}`,
            module: 'evidence_workflow',
            targetType: 'Evidence',
            targetId: evidenceId,
            description: getActionDescription(action),
            details,
            status: 'success'
        });
    } catch (error) {
        console.error('Log signing activity error:', error);
    }
};

const getActionDescription = (action) => {
    const descriptions = {
        'approve': 'Ký duyệt minh chứng',
        'reject': 'Từ chối minh chứng',
        'cancel': 'Hủy trình ký',
        'initiate': 'Khởi tạo trình ký'
    };
    return descriptions[action] || 'Thao tác trên minh chứng';
};

module.exports = {
    getEvidencesByWorkflowStatus,
    initiateSigningProcess,
    insertSignatureImages,
    approveEvidence,
    cancelSigningProcess,
    updateSigningProcess
};