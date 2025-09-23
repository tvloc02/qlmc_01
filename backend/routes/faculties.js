const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getFaculties,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getFacultyStatistics
} = require('../controllers/facultyController');

const createFacultyValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên khoa là bắt buộc')
        .isLength({ max: 200 }),
    body('code')
        .notEmpty()
        .withMessage('Mã khoa là bắt buộc')
        .isLength({ max: 10 })
        .matches(/^[A-Z0-9\-_]+$/),
    body('description')
        .optional()
        .isLength({ max: 1000 }),
    body('dean')
        .optional()
        .isMongoId(),
    body('viceDeans')
        .optional()
        .isArray(),
    body('establishedDate')
        .optional()
        .isISO8601(),
    body('contactInfo.email')
        .optional()
        .isEmail(),
    body('contactInfo.phone')
        .optional()
        .matches(/^[\d\s\-\+\(\)]+$/),
    body('contactInfo.address')
        .optional()
        .isLength({ max: 500 }),
    body('contactInfo.website')
        .optional()
        .isURL()
];

const updateFacultyValidation = [
    param('id').isMongoId().withMessage('ID khoa không hợp lệ'),
    ...createFacultyValidation.filter(rule =>
        !rule.builder.fields.includes('code')
    )
];

router.get('/statistics', auth, requireManager, getFacultyStatistics);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('status').optional().isIn(['active', 'inactive']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getFaculties);

router.get('/:id', auth, [param('id').isMongoId()], validation, getFacultyById);

router.post('/', auth, requireAdmin, createFacultyValidation, validation, createFaculty);

router.put('/:id', auth, requireAdmin, updateFacultyValidation, validation, updateFaculty);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteFaculty);

module.exports = router;