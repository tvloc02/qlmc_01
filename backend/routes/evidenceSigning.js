const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getSigningQueue,
    signEvidence,
    bulkSignEvidences,
    getSigningHistory,
    validateSignature,
    getSigningCertificate
} = require('../controllers/evidenceSigningController');

const signEvidenceValidation = [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('signingInfoId')
        .notEmpty()
        .withMessage('Thông tin ký là bắt buộc')
        .isMongoId()
        .withMessage('ID thông tin ký không hợp lệ'),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu ký là bắt buộc'),
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Lý do ký không được quá 500 ký tự'),
    body('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Địa điểm ký không được quá 200 ký tự')
];

const bulkSignValidation = [
    body('evidenceIds')
        .isArray({ min: 1 })
        .withMessage('Danh sách minh chứng là bắt buộc')
        .custom((value) => {
            return value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
        })
        .withMessage('Danh sách chứa ID không hợp lệ'),
    body('signingInfoId')
        .notEmpty()
        .withMessage('Thông tin ký là bắt buộc')
        .isMongoId(),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu ký là bắt buộc'),
    body('reason')
        .optional()
        .isLength({ max: 500 })
];

router.get('/queue', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'signed', 'rejected'])
], validation, getSigningQueue);

router.get('/history', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('signedBy').optional().isMongoId(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
], validation, getSigningHistory);

router.get('/certificate/:id', auth, [
    param('id').isMongoId().withMessage('ID chứng chỉ không hợp lệ')
], validation, getSigningCertificate);

router.post('/validate', auth, [
    body('evidenceId').notEmpty().isMongoId(),
    body('signature').notEmpty().withMessage('Chữ ký là bắt buộc')
], validation, validateSignature);

router.post('/:id/sign', auth, requireManager, signEvidenceValidation, validation, signEvidence);

router.post('/bulk-sign', auth, requireManager, bulkSignValidation, validation, bulkSignEvidences);

module.exports = router;