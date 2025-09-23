const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getStampTemplates,
    createStampTemplate,
    updateStampTemplate,
    deleteStampTemplate,
    stampDocument,
    bulkStampDocuments,
    getStampHistory,
    validateStamp
} = require('../controllers/stampingController');

const createStampTemplateValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên mẫu con dấu là bắt buộc')
        .isLength({ max: 100 }),
    body('type')
        .isIn(['official', 'approval', 'confidential', 'draft', 'copy'])
        .withMessage('Loại con dấu không hợp lệ'),
    body('template.text')
        .notEmpty()
        .withMessage('Nội dung con dấu là bắt buộc'),
    body('template.font')
        .optional()
        .isLength({ max: 50 }),
    body('template.size')
        .optional()
        .isInt({ min: 10, max: 100 }),
    body('template.color')
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    body('permissions.allowedRoles')
        .optional()
        .isArray(),
    body('permissions.allowedUsers')
        .optional()
        .isArray()
];

const stampDocumentValidation = [
    param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('templateId')
        .notEmpty()
        .withMessage('Mẫu con dấu là bắt buộc')
        .isMongoId(),
    body('position.page')
        .optional()
        .isInt({ min: 1 }),
    body('position.x')
        .optional()
        .isFloat({ min: 0 }),
    body('position.y')
        .optional()
        .isFloat({ min: 0 }),
    body('reason')
        .optional()
        .isLength({ max: 500 })
];

const bulkStampValidation = [
    body('evidenceIds')
        .isArray({ min: 1 })
        .withMessage('Danh sách minh chứng là bắt buộc'),
    body('templateId')
        .notEmpty()
        .isMongoId(),
    body('position')
        .optional()
        .isObject(),
    body('reason')
        .optional()
        .isLength({ max: 500 })
];

router.get('/templates', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['official', 'approval', 'confidential', 'draft', 'copy']),
    query('status').optional().isIn(['active', 'inactive'])
], validation, getStampTemplates);

router.post('/templates', auth, requireManager, createStampTemplateValidation, validation, createStampTemplate);

router.put('/templates/:id', auth, requireManager, [
    param('id').isMongoId(),
    ...createStampTemplateValidation
], validation, updateStampTemplate);

router.delete('/templates/:id', auth, requireManager, [
    param('id').isMongoId()
], validation, deleteStampTemplate);

router.get('/history', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('evidenceId').optional().isMongoId(),
    query('stampedBy').optional().isMongoId(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
], validation, getStampHistory);

router.post('/validate', auth, [
    body('evidenceId').notEmpty().isMongoId(),
    body('stampData').notEmpty().withMessage('Dữ liệu con dấu là bắt buộc')
], validation, validateStamp);

router.post('/:evidenceId/stamp', auth, requireManager, stampDocumentValidation, validation, stampDocument);

router.post('/bulk-stamp', auth, requireManager, bulkStampValidation, validation, bulkStampDocuments);

module.exports = router;