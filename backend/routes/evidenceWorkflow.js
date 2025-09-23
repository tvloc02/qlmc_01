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
    updateSigningProcess,
    cancelSigningProcess,
    getEvidenceWorkflowDetail,
    getWorkflowStatistics,
    getPendingApproval,
    getSigningHistory
} = require('../controllers/evidenceWorkflowController');

// Validation rules cho các API

// Validation cho khởi tạo trình ký
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

// Validation cho chèn chữ ký
const insertSignatureValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('signaturePositions')
        .isObject()
        .withMessage('Vị trí chữ ký phải là object')
];

// Validation cho ký duyệt
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

// Validation cho cập nhật trình ký
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

// Validation cho hủy trình ký
const cancelSigningValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('reason')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Lý do hủy không được quá 1000 ký tự')
];

// Validation cho query parameters
const workflowQueryValidation = [
    query('status')
        .optional()
        .isIn(['draft', 'pending_approval', 'signatures_inserted', 'in_progress', 'completed', 'rejected'])
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
];

// Validation cho thống kê
const statisticsValidation = [
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
];

// ===== ROUTES =====

// Lấy danh sách minh chứng theo trạng thái workflow
router.get('/workflow',
    auth,
    workflowQueryValidation,
    validation,
    getEvidencesByWorkflowStatus
);

// Lấy chi tiết một minh chứng trong workflow
router.get('/:evidenceId/workflow-detail',
    auth,
    [param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')],
    validation,
    getEvidenceWorkflowDetail
);

// Lấy thống kê workflow
router.get('/workflow/statistics',
    auth,
    statisticsValidation,
    validation,
    getWorkflowStatistics
);

// Lấy danh sách cần ký duyệt của user hiện tại
router.get('/pending-approval',
    auth,
    getPendingApproval
);

// Lấy lịch sử trình ký của một minh chứng
router.get('/:evidenceId/signing/history',
    auth,
    [param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')],
    validation,
    getSigningHistory
);

// ===== WORKFLOW ACTIONS =====

// Bước 1: Khởi tạo trình ký - Chọn người ký
router.post('/:evidenceId/signing/initiate',
    auth,
    initiateSigningValidation,
    validation,
    initiateSigningProcess
);

// Bước 2: Chèn ảnh chữ ký vào PDF (chỉ với PDF)
router.post('/:evidenceId/signing/insert-signatures',
    auth,
    insertSignatureValidation,
    validation,
    insertSignatureImages
);

// Bước 3: Ký duyệt minh chứng (cho người được chỉ định)
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

// ===== BULK OPERATIONS =====

// Ký duyệt hàng loạt (cho nhiều minh chứng cùng lúc)
router.post('/bulk-approve',
    auth,
    [
        body('evidenceIds')
            .isArray({ min: 1, max: 20 })
            .withMessage('Cần từ 1 đến 20 minh chứng'),
        body('evidenceIds.*')
            .isMongoId()
            .withMessage('ID minh chứng không hợp lệ'),
        body('signingInfoId')
            .isMongoId()
            .withMessage('Cấu hình ký số không hợp lệ'),
        body('password')
            .notEmpty()
            .withMessage('Mật khẩu là bắt buộc'),
        body('reason')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Ghi chú không được quá 1000 ký tự')
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceIds, signingInfoId, password, reason } = req.body;
            const userId = req.user.id;

            const evidenceWorkflowService = require('../services/evidenceWorkflowService');
            const results = {
                success: [],
                failed: [],
                total: evidenceIds.length
            };

            for (const evidenceId of evidenceIds) {
                try {
                    const result = await evidenceWorkflowService.approveEvidence(
                        evidenceId,
                        'approve',
                        signingInfoId,
                        password,
                        reason,
                        userId
                    );
                    results.success.push({
                        evidenceId,
                        ...result.data
                    });
                } catch (error) {
                    results.failed.push({
                        evidenceId,
                        error: error.message
                    });
                }
            }

            const message = `Ký duyệt thành công ${results.success.length}/${results.total} minh chứng`;

            res.json({
                success: true,
                message,
                data: results
            });

        } catch (error) {
            console.error('Bulk approve error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi ký duyệt hàng loạt'
            });
        }
    }
);

// ===== HELPER ENDPOINTS =====

// Lấy danh sách người dùng có thể ký (cho dropdown)
router.get('/available-signers',
    auth,
    [
        query('role')
            .optional()
            .isIn(['reviewer', 'approver'])
            .withMessage('Vai trò không hợp lệ'),
        query('departmentId')
            .optional()
            .isMongoId()
            .withMessage('ID phòng ban không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { role, departmentId } = req.query;
            const User = require('../models/User');

            let query = {
                status: 'active',
                role: { $in: ['manager', 'admin', 'reviewer', 'approver'] }
            };

            if (role) {
                query.role = role;
            }

            if (departmentId) {
                query.departmentId = departmentId;
            }

            const users = await User.find(query)
                .select('fullName position email role departmentId')
                .populate('departmentId', 'name')
                .sort({ fullName: 1 });

            res.json({
                success: true,
                data: users
            });

        } catch (error) {
            console.error('Get available signers error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách người ký'
            });
        }
    }
);

// Lấy danh sách cấu hình chữ ký số khả dụng
router.get('/available-signing-configs',
    auth,
    async (req, res) => {
        try {
            const SigningInfo = require('../models/SigningInfo');
            const userId = req.user.id;
            const userRole = req.user.role;

            let query = { status: 'active' };

            // Filter by user permissions
            if (userRole !== 'admin') {
                query.$or = [
                    { 'permissions.allowedUsers': userId },
                    { 'permissions.allowedRoles': userRole },
                    {
                        'permissions.allowedUsers': { $size: 0 },
                        'permissions.allowedRoles': { $size: 0 }
                    }
                ];
            }

            const signingConfigs = await SigningInfo.find(query)
                .select('name type signerInfo.fullName certificate.validTo')
                .sort({ name: 1 });

            // Filter out expired certificates
            const validConfigs = signingConfigs.filter(config => !config.isExpired());

            res.json({
                success: true,
                data: validConfigs
            });

        } catch (error) {
            console.error('Get available signing configs error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách cấu hình ký'
            });
        }
    }
);

// Validate minh chứng có thể trình ký
router.post('/:evidenceId/validate-for-signing',
    auth,
    [param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const Evidence = require('../models/Evidence');

            const evidence = await Evidence.findById(evidenceId)
                .populate('files', 'originalName mimeType size');

            if (!evidence) {
                return res.status(404).json({
                    success: false,
                    message: 'Minh chứng không tồn tại'
                });
            }

            const validationResult = {
                canInitiate: evidence.status === 'draft',
                hasFiles: evidence.files.length > 0,
                hasPdfFiles: evidence.files.some(f => f.mimeType === 'application/pdf'),
                status: evidence.status,
                issues: []
            };

            if (!validationResult.canInitiate) {
                validationResult.issues.push('Chỉ có thể trình ký minh chứng ở trạng thái "Chưa trình ký"');
            }

            if (!validationResult.hasFiles) {
                validationResult.issues.push('Minh chứng chưa có file đính kèm');
            }

            validationResult.isValid = validationResult.issues.length === 0;

            res.json({
                success: true,
                data: validationResult
            });

        } catch (error) {
            console.error('Validate for signing error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra minh chứng'
            });
        }
    }
);

module.exports = router;