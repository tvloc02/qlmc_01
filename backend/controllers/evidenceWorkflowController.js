const { validationResult } = require('express-validator');
const evidenceWorkflowService = require('../services/evidenceWorkflowService');

/**
 * Controller xử lý quy trình trình ký minh chứng
 * Theo workflow: Draft -> Pending Approval -> Signatures Inserted -> In Progress -> Completed/Rejected
 */

// Lấy danh sách minh chứng theo trạng thái workflow
const getEvidencesByWorkflowStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const filters = {
            status: req.query.status,
            search: req.query.search,
            standardId: req.query.standardId,
            criteriaId: req.query.criteriaId,
            page: req.query.page || 1,
            limit: req.query.limit || 10
        };

        const result = await evidenceWorkflowService.getEvidencesByWorkflowStatus(
            filters,
            req.user.id,
            req.user.role
        );

        res.json(result);

    } catch (error) {
        console.error('Get evidences by workflow status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách minh chứng'
        });
    }
};

// Bước 1: Khởi tạo trình ký - Chọn người ký
const initiateSigningProcess = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { signers, reason } = req.body;

        // Validate signers
        if (!signers || !Array.isArray(signers) || signers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cần ít nhất một người ký'
            });
        }

        // Validate each signer
        for (const signer of signers) {
            if (!signer.userId || !signer.order) {
                return res.status(400).json({
                    success: false,
                    message: 'Thông tin người ký không đầy đủ'
                });
            }
        }

        // Check for duplicate orders
        const orders = signers.map(s => s.order);
        if (new Set(orders).size !== orders.length) {
            return res.status(400).json({
                success: false,
                message: 'Thứ tự ký không được trùng lặp'
            });
        }

        const result = await evidenceWorkflowService.initiateSigningProcess(
            evidenceId,
            signers,
            reason,
            req.user.id
        );

        res.json(result);

    } catch (error) {
        console.error('Initiate signing process error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi khởi tạo trình ký'
        });
    }
};

// Bước 2: Chèn ảnh chữ ký vào PDF
const insertSignatureImages = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { signaturePositions } = req.body;

        // Validate signature positions
        if (!signaturePositions || typeof signaturePositions !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Vị trí chữ ký không hợp lệ'
            });
        }

        const result = await evidenceWorkflowService.insertSignatureImages(
            evidenceId,
            signaturePositions,
            req.user.id
        );

        res.json(result);

    } catch (error) {
        console.error('Insert signature images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi chèn ảnh chữ ký'
        });
    }
};

// Bước 3: Ký duyệt minh chứng (approve/reject)
const approveEvidence = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { decision, signingInfoId, password, reason } = req.body;

        // Validate decision
        if (!['approve', 'reject'].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: 'Quyết định phải là approve hoặc reject'
            });
        }

        // Validate required fields for approval
        if (decision === 'approve') {
            if (!signingInfoId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần chọn cấu hình chữ ký số'
                });
            }
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần nhập mật khẩu chữ ký số'
                });
            }
        }

        // Validate required fields for rejection
        if (decision === 'reject') {
            if (!reason || !reason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần nhập lý do từ chối'
                });
            }
        }

        const result = await evidenceWorkflowService.approveEvidence(
            evidenceId,
            decision,
            signingInfoId,
            password,
            reason,
            req.user.id
        );

        res.json(result);

    } catch (error) {
        console.error('Approve evidence error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xử lý ký duyệt'
        });
    }
};

// Cập nhật thông tin trình ký (trước khi có ai ký)
const updateSigningProcess = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { signers, reason } = req.body;

        // Validate signers
        if (!signers || !Array.isArray(signers) || signers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cần ít nhất một người ký'
            });
        }

        // Validate each signer
        for (const signer of signers) {
            if (!signer.userId || !signer.order) {
                return res.status(400).json({
                    success: false,
                    message: 'Thông tin người ký không đầy đủ'
                });
            }
        }

        // Check for duplicate orders
        const orders = signers.map(s => s.order);
        if (new Set(orders).size !== orders.length) {
            return res.status(400).json({
                success: false,
                message: 'Thứ tự ký không được trùng lặp'
            });
        }

        const result = await evidenceWorkflowService.updateSigningProcess(
            evidenceId,
            signers,
            reason,
            req.user.id
        );

        res.json(result);

    } catch (error) {
        console.error('Update signing process error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật trình ký'
        });
    }
};

// Hủy trình ký
const cancelSigningProcess = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { reason } = req.body;

        const result = await evidenceWorkflowService.cancelSigningProcess(
            evidenceId,
            reason,
            req.user.id,
            req.user.role
        );

        res.json(result);

    } catch (error) {
        console.error('Cancel signing process error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi hủy trình ký'
        });
    }
};

// Lấy chi tiết minh chứng trong workflow
const getEvidenceWorkflowDetail = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const userId = req.user.id;

        const Evidence = require('../models/Evidence');

        const evidence = await Evidence.findById(evidenceId)
            .populate('files')
            .populate('createdBy', 'fullName position email')
            .populate('assignedTo', 'fullName position email')
            .populate('signingProcess.signers.userId', 'fullName position email')
            .populate('signingProcess.signers.signingInfoId', 'name')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        // Check access permissions
        const hasAccess = evidence.createdBy._id.toString() === userId.toString() ||
            evidence.assignedTo?._id.toString() === userId.toString() ||
            evidence.signingProcess?.signers?.some(s => s.userId._id.toString() === userId.toString()) ||
            req.user.role === 'admin';

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập minh chứng này'
            });
        }

        // Add computed fields from service
        const evidenceWorkflowService = require('../services/evidenceWorkflowService');
        const evidenceData = evidence.toObject();

        // Sử dụng helper functions từ service (cần export chúng)
        evidenceData.canInitiateSigning = evidence.status === 'draft' &&
            (evidence.createdBy._id.toString() === userId.toString() ||
                evidence.assignedTo?._id.toString() === userId.toString());

        evidenceData.canUserSign = evidence.signingProcess &&
            ['signatures_inserted', 'in_progress'].includes(evidence.status) &&
            evidence.signingProcess.signers.some(s =>
                s.userId._id.toString() === userId.toString() &&
                s.status === 'pending' &&
                s.order === (evidence.signingProcess.currentStep || 1)
            );

        evidenceData.canCancelSigning = evidence.signingProcess &&
            evidence.status !== 'completed' &&
            (evidence.signingProcess.initiatedBy.toString() === userId.toString() ||
                req.user.role === 'admin');

        evidenceData.canUpdateSigning = evidence.signingProcess &&
            ['pending_approval', 'signatures_inserted'].includes(evidence.status) &&
            !evidence.signingProcess.signers.some(s => s.status === 'signed') &&
            (evidence.signingProcess.initiatedBy.toString() === userId.toString() ||
                req.user.role === 'admin');

        evidenceData.requiresSignatureInsertion = evidence.status === 'pending_approval' &&
            evidence.files.some(file => file.mimeType === 'application/pdf');

        evidenceData.nextSigners = evidence.signingProcess && evidence.status === 'in_progress' ?
            evidence.signingProcess.signers
                .filter(s => s.order >= (evidence.signingProcess.currentStep || 1) && s.status === 'pending')
                .sort((a, b) => a.order - b.order) : [];

        evidenceData.signingProgress = evidence.signingProcess ? {
            totalSigners: evidence.signingProcess.signers.length,
            signedCount: evidence.signingProcess.signers.filter(s => s.status === 'signed').length,
            percentage: Math.round((evidence.signingProcess.signers.filter(s => s.status === 'signed').length / evidence.signingProcess.signers.length) * 100)
        } : null;

        evidenceData.isOverdue = false; // Có thể implement logic kiểm tra quá hạn

        res.json({
            success: true,
            data: evidenceData
        });

    } catch (error) {
        console.error('Get evidence workflow detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết minh chứng'
        });
    }
};

// Lấy thống kê workflow
const getWorkflowStatistics = async (req, res) => {
    try {
        const { dateFrom, dateTo, standardId, criteriaId } = req.query;
        const userId = req.user.id;

        const Evidence = require('../models/Evidence');

        // Build match query
        let matchQuery = {};

        if (dateFrom || dateTo) {
            matchQuery.createdAt = {};
            if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
            if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
        }

        if (standardId) matchQuery.standardId = mongoose.Types.ObjectId(standardId);
        if (criteriaId) matchQuery.criteriaId = mongoose.Types.ObjectId(criteriaId);

        // Access control
        if (req.user.role !== 'admin') {
            matchQuery.$or = [
                { createdBy: mongoose.Types.ObjectId(userId) },
                { assignedTo: mongoose.Types.ObjectId(userId) },
                { 'signingProcess.signers.userId': mongoose.Types.ObjectId(userId) }
            ];
        }

        const statistics = await Evidence.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgProcessingTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
                                { $subtract: ['$completedAt', '$createdAt'] },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        // Format statistics
        const formattedStats = {
            byStatus: {},
            total: 0,
            avgProcessingTime: 0
        };

        let totalProcessingTime = 0;
        let completedCount = 0;

        statistics.forEach(stat => {
            formattedStats.byStatus[stat._id] = {
                count: stat.count,
                avgProcessingTime: stat.avgProcessingTime
            };
            formattedStats.total += stat.count;

            if (stat.avgProcessingTime) {
                totalProcessingTime += stat.avgProcessingTime * stat.count;
                completedCount += stat.count;
            }
        });

        formattedStats.avgProcessingTime = completedCount > 0
            ? Math.round(totalProcessingTime / completedCount / (1000 * 60 * 60 * 24)) // days
            : 0;

        res.json({
            success: true,
            data: formattedStats
        });

    } catch (error) {
        console.error('Get workflow statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê workflow'
        });
    }
};

// Lấy danh sách cần ký duyệt của user hiện tại
const getPendingApproval = async (req, res) => {
    try {
        const userId = req.user.id;
        const Evidence = require('../models/Evidence');
        const mongoose = require('mongoose');

        const pendingEvidences = await Evidence.find({
            status: { $in: ['signatures_inserted', 'in_progress'] },
            'signingProcess.signers': {
                $elemMatch: {
                    userId: mongoose.Types.ObjectId(userId),
                    status: 'pending'
                }
            }
        })
            .populate('files', 'originalName size mimeType')
            .populate('createdBy', 'fullName position')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('signingProcess.signers.userId', 'fullName position')
            .sort({ 'signingProcess.initiatedAt': 1 }); // Ưu tiên cũ trước

        // Filter only evidences where user is the current signer
        const currentUserPending = pendingEvidences.filter(evidence => {
            const currentStep = evidence.signingProcess.currentStep || 1;
            const currentSigner = evidence.signingProcess.signers.find(s =>
                s.order === currentStep && s.status === 'pending'
            );
            return currentSigner && currentSigner.userId._id.toString() === userId.toString();
        });

        res.json({
            success: true,
            data: {
                evidences: currentUserPending,
                count: currentUserPending.length
            }
        });

    } catch (error) {
        console.error('Get pending approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách cần ký duyệt'
        });
    }
};

// Lấy lịch sử trình ký của một minh chứng
const getSigningHistory = async (req, res) => {
    try {
        const { evidenceId } = req.params;

        const History = require('../models/History');

        const history = await History.find({
            targetType: 'Evidence',
            targetId: evidenceId,
            module: 'evidence_workflow'
        })
            .populate('userId', 'fullName position')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Get signing history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử ký duyệt'
        });
    }
};

module.exports = {
    getEvidencesByWorkflowStatus,
    initiateSigningProcess,
    insertSignatureImages,
    approveEvidence,
    updateSigningProcess,
    cancelSigningProcess,
    getEvidenceWorkflowDetail,
    getWorkflowStatistics,
    getPendingApproval,
    getSigningHistory
};