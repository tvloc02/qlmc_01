const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    advancedSearch,
    quickSearch,
    searchByCode,
    searchByContent,
    getRecentSearches,
    saveSearch,
    exportSearchResults
} = require('../controllers/evidenceLookupController');

const advancedSearchValidation = [
    body('keyword').optional().trim().escape(),
    body('evidenceCode').optional().trim(),
    body('programId').optional().isMongoId(),
    body('organizationId').optional().isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('documentType').optional().isIn(['Quyết định', 'Thông tư', 'Nghị định', 'Luật', 'Báo cáo', 'Kế hoạch', 'Khác']),
    body('documentNumber').optional().trim(),
    body('issuingAgency').optional().trim(),
    body('dateFrom').optional().isISO8601(),
    body('dateTo').optional().isISO8601(),
    body('status').optional().isIn(['active', 'inactive', 'pending', 'archived']),
    body('hasFiles').optional().isBoolean(),
    body('tags').optional().isArray(),
    body('createdBy').optional().isMongoId(),
    body('sortBy').optional().isIn(['relevance', 'date', 'name', 'code']),
    body('sortOrder').optional().isIn(['asc', 'desc']),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 })
];

const quickSearchValidation = [
    query('q')
        .notEmpty()
        .withMessage('Từ khóa tìm kiếm là bắt buộc')
        .trim()
        .escape(),
    query('type')
        .optional()
        .isIn(['all', 'name', 'code', 'content', 'files'])
        .withMessage('Loại tìm kiếm không hợp lệ'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit phải từ 1-50')
];

const saveSearchValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên tìm kiếm là bắt buộc')
        .isLength({ max: 100 })
        .withMessage('Tên không được quá 100 ký tự'),
    body('searchParams')
        .notEmpty()
        .withMessage('Tham số tìm kiếm là bắt buộc')
        .isObject()
        .withMessage('Tham số tìm kiếm phải là object'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự')
];

router.post('/advanced', auth, advancedSearchValidation, validation, advancedSearch);

router.get('/quick', auth, quickSearchValidation, validation, quickSearch);

router.get('/by-code/:code', auth, [
    param('code')
        .notEmpty()
        .withMessage('Mã minh chứng là bắt buộc')
        .matches(/^H\d+\.\d{2}\.\d{2}\.\d{2}$/)
        .withMessage('Mã minh chứng không đúng format')
], validation, searchByCode);

router.post('/content', auth, [
    body('keyword')
        .notEmpty()
        .withMessage('Từ khóa là bắt buộc')
        .trim()
        .escape(),
    body('fileTypes')
        .optional()
        .isArray()
        .withMessage('Loại file phải là mảng'),
    body('programId').optional().isMongoId(),
    body('standardId').optional().isMongoId(),
    body('limit').optional().isInt({ min: 1, max: 100 })
], validation, searchByContent);

router.get('/recent', auth, getRecentSearches);

router.post('/save', auth, saveSearchValidation, validation, saveSearch);

router.post('/export', auth, [
    body('searchParams').notEmpty().isObject(),
    body('format').optional().isIn(['xlsx', 'csv', 'pdf']),
    body('includeFiles').optional().isBoolean()
], validation, exportSearchResults);

module.exports = router;