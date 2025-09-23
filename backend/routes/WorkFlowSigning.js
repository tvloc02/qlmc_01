const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getEvidencesByWorkflowStatus,
    initiateSigningProcess,
    insertSignatureImages,
    approveEvidence,
    cancelSigningProcess,
    updateSigningProcess
} = require('../controllers/evidenceWorkflowController');

// Validation rules
const initiateSigningValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('signers')
        .isArray({ min: 1 })
        .withMessage('Cần ít nhất một người ký'),
    body('signers.*.userId')
        .isMongoId()
        .withMessage('ID người ký không hợp lệ'),
    body('signers.*.order')
        .isInt({ min: 1 })
        .withMessage('Thứ tự ký phải là số nguyên dương'),
    body('signers.*.role')
        .isIn(['reviewer', 'approver'])
        .withMessage('Vai trò người ký không hợp lệ'),
    body('reason')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Lý do trình ký không được quá 1000 ký tự')
];

const insertSignatureValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('signaturePositions')
        .isObject()
        .withMessage('Vị trí chữ ký phải là object')
];

const approveEvidenceValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('decision')
        .isIn(['approve', 'reject'])
        .withMessage('Quyết định phải là approve hoặc reject'),
    body('signingInfoId')
        .if(body('decision').equals('approve'))
        .isMongoId()
        .withMessage('Cấu hình ký số là bắt buộc khi phê duyệt'),
    body('password')
        .if(body('decision').equals('approve'))
        .notEmpty()
        .withMessage('Mật khẩu là bắt buộc khi phê duyệt'),
    body('reason')
        .if(body('decision').equals('reject'))
        .notEmpty()
        .withMessage('Lý do từ chối là bắt buộc')
        .isLength({ max: 1000 })
        .withMessage('Lý do không được quá 1000 ký tự'),
    body('reason')
        .if(body('decision').equals('approve'))
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được quá 1000 ký tự')
];

const updateSigningValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('signers')
        .isArray({ min: 1 })
        .withMessage('Cần ít nhất một người ký'),
    body('signers.*.userId')
        .isMongoId()
        .withMessage('ID người ký không hợp lệ'),
    body('signers.*.order')
        .isInt({ min: 1 })
        .withMessage('Thứ tự ký phải là số nguyên dương'),
    body('reason')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Lý do không được quá 1000 ký tự')
];

const cancelSigningValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('reason')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Lý do hủy không được quá 1000 ký tự')
];

// Routes

// Lấy danh sách minh chứng theo trạng thái workflow
router.get('/workflow', auth, [
    query('status')
        .optional()
        .isIn(['draft', 'pending_approval', 'in_progress', 'completed', 'rejected'])
        .withMessage('Trạng thái không hợp lệ'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit phải từ 1 đến 100'),
    query('search')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Từ khóa tìm kiếm không được quá 200 ký tự'),
    query('standardId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ')
], validation, getEvidencesByWorkflowStatus);

// Khởi tạo trình ký - Bước 1: Chọn người ký
router.post('/:evidenceId/signing/initiate',
    auth,
    initiateSigningValidation,
    validation,
    initiateSigningProcess
);

// Chèn ảnh chữ ký vào PDF - Bước 2 (chỉ với PDF)
router.post('/:evidenceId/signing/insert-signatures',
    auth,
    insertSignatureValidation,
    validation,
    insertSignatureImages
);

// Ký duyệt minh chứng (cho người được chỉ định)
router.post('/:evidenceId/signing/approve',
    auth,
    approveEvidenceValidation,
    validation,
    approveEvidence
);

// Cập nhật thông tin trình ký (trước khi ai ký)
router.put('/:evidenceId/signing/update',
    auth,
    updateSigningValidation,
    validation,
    updateSigningProcess
);

// Hủy trình ký
router.post('/:evidenceId/signing/cancel',
    auth,
    cancelSigningValidation,
    validation,
    cancelSigningProcess
);

// Lấy chi tiết một minh chứng trong workflow
router.get('/:evidenceId/workflow-detail', auth, [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, async (req, res) => {
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

        // Add computed fields
        const evidenceData = evidence.toObject();
        evidenceData.canInitiateSigning = evidence.canInitiateSigning(userId);
        evidenceData.canUserSign = evidence.canUserSign(userId);
        evidenceData.canCancelSigning = evidence.canCancelSigning(userId, req.user.role);
        evidenceData.canUpdateSigning = evidence.canUpdateSigning(userId, req.user.role);
        evidenceData.nextSigners = evidence.getNextSigners();
        evidenceData.signingProgress = evidence.getSigningProgress();
        evidenceData.requiresSignatureInsertion = evidence.requiresSignatureInsertion();
        evidenceData.isOverdue = evidence.isOverdue();

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
});

// Lấy thống kê workflow
router.get('/workflow/statistics', auth, [
    query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),
    query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Ngày kết thúc không hợp lệ'),
    query('standardId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ')
], validation, async (req, res) => {
    try {
        const { dateFrom, dateTo, standardId, criteriaId } = req.query;
        const userId = req.user.id;

        const Evidence = require('../models/Evidence');

        const options = {
            userId,
            userRole: req.user.role,
            dateFrom,
            dateTo,
            standardId,
            criteriaId
        };

        const statistics = await Evidence.getStatistics(options);

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
});

// Lấy danh sách cần ký duyệt của user hiện tại
router.get('/pending-approval', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const Evidence = require('../models/Evidence');

        const pendingEvidences = await Evidence.getPendingApproval(userId);

        res.json({
            success: true,
            data: {
                evidences: pendingEvidences,
                count: pendingEvidences.length
            }
        });

    } catch (error) {
        console.error('Get pending approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách cần ký duyệt'
        });
    }
});

// Lấy lịch sử trình ký của một minh chứng
router.get('/:evidenceId/signing/history', auth, [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, async (req, res) => {
    try {
        const { evidenceId } = req.params;

        const History = require('../models/History');

        const history = await History.find({
            targetType: 'Evidence',
            targetId: evidenceId,
            action: { $in: ['evidence_approve', 'evidence_reject', 'evidence_cancel', 'evidence_initiate'] }
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
});

module.exports = router;