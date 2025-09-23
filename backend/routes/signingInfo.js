const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getSigningInfos,
    getSigningInfoById,
    createSigningInfo,
    updateSigningInfo,
    deleteSigningInfo,
    testSigningInfo,
    getSigningInfoStatistics
} = require('../controllers/signingInfoController');

const createSigningInfoValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên cấu hình ký là bắt buộc')
        .isLength({ max: 100 }),
    body('type')
        .isIn(['individual', 'organizational'])
        .withMessage('Loại cấu hình không hợp lệ'),
    body('certificate.issuer')
        .notEmpty()
        .withMessage('Tổ chức cấp chứng chỉ là bắt buộc'),
    body('certificate.validFrom')
        .notEmpty()
        .withMessage('Ngày hiệu lực là bắt buộc')
        .isISO8601(),
    body('certificate.validTo')
        .notEmpty()
        .withMessage('Ngày hết hạn là bắt buộc')
        .isISO8601()
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.certificate?.validFrom)) {
                throw new Error('Ngày hết hạn phải sau ngày hiệu lực');
            }
            return true;
        }),
    body('signerInfo.fullName')
        .notEmpty()
        .withMessage('Tên người ký là bắt buộc'),
    body('signerInfo.position')
        .optional()
        .isLength({ max: 100 }),
    body('signerInfo.organization')
        .optional()
        .isLength({ max: 200 }),
    body('signerInfo.email')
        .optional()
        .isEmail(),
    body('template.position.x')
        .optional()
        .isFloat({ min: 0 }),
    body('template.position.y')
        .optional()
        .isFloat({ min: 0 }),
    body('permissions.allowedUsers')
        .optional()
        .isArray(),
    body('permissions.allowedRoles')
        .optional()
        .isArray()
];

const updateSigningInfoValidation = [
    param('id').isMongoId().withMessage('ID cấu hình ký không hợp lệ'),
    ...createSigningInfoValidation
];

router.get('/statistics', auth, requireManager, getSigningInfoStatistics);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('type').optional().isIn(['individual', 'organizational']),
    query('status').optional().isIn(['active', 'inactive', 'expired', 'revoked']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'validTo']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getSigningInfos);

router.get('/:id', auth, [param('id').isMongoId()], validation, getSigningInfoById);

router.post('/', auth, requireAdmin, createSigningInfoValidation, validation, createSigningInfo);

router.put('/:id', auth, requireAdmin, updateSigningInfoValidation, validation, updateSigningInfo);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteSigningInfo);

router.post('/:id/test', auth, requireManager, [
    param('id').isMongoId(),
    body('testData').optional().isObject()
], validation, testSigningInfo);

module.exports = router;