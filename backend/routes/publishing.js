const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager, requireAdmin } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getPublishingQueue,
    publishEvidence,
    bulkPublishEvidences,
    unpublishEvidence,
    getPublishingHistory,
    createPublishingWorkflow,
    approvePublication,
    rejectPublication,
    getPublishingStatistics
} = require('../controllers/publishingController');

const publishEvidenceValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('version')
        .optional()
        .isLength({ max: 10 }),
    body('publishNotes')
        .optional()
        .isLength({ max: 1000 }),
    body('visibility')
        .isIn(['public', 'internal', 'restricted'])
        .withMessage('Phạm vi công khai không hợp lệ'),
    body('expiryDate')
        .optional()
        .isISO8601(),
    body('tags')
        .optional()
        .isArray()
];

const bulkPublishValidation = [
    body('evidenceIds')
        .isArray({ min: 1 })
        .withMessage('Danh sách minh chứng là bắt buộc'),
    body('publishSettings')
        .isObject()
        .withMessage('Cài đặt xuất bản là bắt buộc'),
    body('publishSettings.visibility')
        .isIn(['public', 'internal', 'restricted']),
    body('publishSettings.version')
        .optional()
        .isLength({ max: 10 }),
    body('publishSettings.publishNotes')
        .optional()
        .isLength({ max: 1000 })
];

const workflowValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên quy trình là bắt buộc')
        .isLength({ max: 100 }),
    body('steps')
        .isArray({ min: 1 })
        .withMessage('Các bước quy trình là bắt buộc'),
    body('steps.*.name')
        .notEmpty()
        .withMessage('Tên bước là bắt buộc'),
    body('steps.*.approvers')
        .isArray({ min: 1 })
        .withMessage('Người phê duyệt là bắt buộc'),
    body('autoPublish')
        .optional()
        .isBoolean()
];

const approvalValidation = [
    param('publicationId').isMongoId(),
    body('decision')
        .isIn(['approve', 'reject'])
        .withMessage('Quyết định không hợp lệ'),
    body('comments')
        .optional()
        .isLength({ max: 1000 }),
    body('conditions')
        .optional()
        .isArray()
];

router.get('/queue', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'published']),
    query('programId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('submittedBy').optional().isMongoId()
], validation, getPublishingQueue);

router.get('/history', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('evidenceId').optional().isMongoId(),
    query('publishedBy').optional().isMongoId(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('version').optional().trim()
], validation, getPublishingHistory);

router.get('/statistics', auth, requireManager, [
    query('period').optional().isIn(['day', 'week', 'month', 'year']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId()
], validation, getPublishingStatistics);

router.post('/workflows', auth, requireAdmin, workflowValidation, validation, createPublishingWorkflow);

router.post('/:evidenceId/publish', auth, requireManager, publishEvidenceValidation, validation, publishEvidence);

router.post('/bulk-publish', auth, requireManager, bulkPublishValidation, validation, bulkPublishEvidences);

router.post('/:evidenceId/unpublish', auth, requireManager, [
    param('evidenceId').isMongoId(),
    body('reason').notEmpty().withMessage('Lý do hủy xuất bản là bắt buộc')
], validation, unpublishEvidence);

router.post('/publications/:publicationId/approve', auth, requireManager, approvalValidation, validation, approvePublication);

router.post('/publications/:publicationId/reject', auth, requireManager, approvalValidation, validation, rejectPublication);

module.exports = router;