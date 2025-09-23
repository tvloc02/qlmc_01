const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentsByFaculty,
    getDepartmentStatistics
} = require('../controllers/departmentController');

const createDepartmentValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên bộ môn/ngành là bắt buộc')
        .isLength({ max: 200 }),
    body('code')
        .notEmpty()
        .withMessage('Mã bộ môn/ngành là bắt buộc')
        .isLength({ max: 15 })
        .matches(/^[A-Z0-9\-_]+$/),
    body('type')
        .isIn(['department', 'major', 'program'])
        .withMessage('Loại không hợp lệ'),
    body('facultyId')
        .notEmpty()
        .withMessage('Khoa là bắt buộc')
        .isMongoId(),
    body('head')
        .optional()
        .isMongoId(),
    body('description')
        .optional()
        .isLength({ max: 1000 }),
    body('trainingLevel')
        .optional()
        .isArray()
];

const updateDepartmentValidation = [
    param('id').isMongoId().withMessage('ID bộ môn/ngành không hợp lệ'),
    ...createDepartmentValidation.filter(rule =>
        !rule.builder.fields.includes('code')
    )
];

router.get('/statistics', auth, requireManager, [
    query('facultyId').optional().isMongoId(),
    query('type').optional().isIn(['department', 'major', 'program'])
], validation, getDepartmentStatistics);

router.get('/by-faculty/:facultyId', auth, [
    param('facultyId').isMongoId().withMessage('ID khoa không hợp lệ'),
    query('type').optional().isIn(['department', 'major', 'program'])
], validation, getDepartmentsByFaculty);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('facultyId').optional().isMongoId(),
    query('type').optional().isIn(['department', 'major', 'program']),
    query('status').optional().isIn(['active', 'inactive']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getDepartments);

router.get('/:id', auth, [param('id').isMongoId()], validation, getDepartmentById);

router.post('/', auth, requireAdmin, createDepartmentValidation, validation, createDepartment);

router.put('/:id', auth, requireAdmin, updateDepartmentValidation, validation, updateDepartment);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteDepartment);

module.exports = router;