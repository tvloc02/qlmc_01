const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getPersonnel,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    getPersonnelByFaculty,
    getPersonnelStatistics,
    promoteToExpert
} = require('../controllers/personnelController');

const createPersonnelValidation = [
    body('fullName')
        .notEmpty()
        .withMessage('Họ và tên là bắt buộc')
        .isLength({ max: 100 }),
    body('employeeId')
        .notEmpty()
        .withMessage('Mã nhân viên là bắt buộc')
        .isLength({ max: 20 }),
    body('email')
        .notEmpty()
        .withMessage('Email là bắt buộc')
        .isEmail(),
    body('phoneNumber')
        .optional()
        .matches(/^[0-9]{10,11}$/),
    body('position')
        .isIn(['lecturer', 'senior_lecturer', 'associate_professor', 'professor', 'dean', 'vice_dean', 'head_of_department', 'staff'])
        .withMessage('Chức vụ không hợp lệ'),
    body('facultyId')
        .notEmpty()
        .withMessage('Khoa là bắt buộc')
        .isMongoId(),
    body('departmentId')
        .optional()
        .isMongoId(),
    body('qualifications')
        .optional()
        .isArray(),
    body('specializations')
        .optional()
        .isArray(),
    body('workingYears')
        .optional()
        .isInt({ min: 0 }),
    body('dateOfBirth')
        .optional()
        .isISO8601(),
    body('dateJoined')
        .optional()
        .isISO8601()
];

const updatePersonnelValidation = [
    param('id').isMongoId().withMessage('ID nhân sự không hợp lệ'),
    ...createPersonnelValidation.filter(rule =>
        !rule.builder.fields.includes('employeeId')
    )
];

router.get('/statistics', auth, requireManager, [
    query('facultyId').optional().isMongoId(),
    query('departmentId').optional().isMongoId(),
    query('position').optional().isIn(['lecturer', 'senior_lecturer', 'associate_professor', 'professor', 'dean', 'vice_dean', 'head_of_department', 'staff'])
], validation, getPersonnelStatistics);

router.get('/by-faculty/:facultyId', auth, [
    param('facultyId').isMongoId(),
    query('departmentId').optional().isMongoId(),
    query('position').optional().isIn(['lecturer', 'senior_lecturer', 'associate_professor', 'professor', 'dean', 'vice_dean', 'head_of_department', 'staff'])
], validation, getPersonnelByFaculty);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('facultyId').optional().isMongoId(),
    query('departmentId').optional().isMongoId(),
    query('position').optional().isIn(['lecturer', 'senior_lecturer', 'associate_professor', 'professor', 'dean', 'vice_dean', 'head_of_department', 'staff']),
    query('status').optional().isIn(['active', 'inactive', 'retired']),
    query('isExpert').optional().isBoolean(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fullName', 'employeeId']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getPersonnel);

router.get('/:id', auth, [param('id').isMongoId()], validation, getPersonnelById);

router.post('/', auth, requireAdmin, createPersonnelValidation, validation, createPersonnel);

router.put('/:id', auth, requireAdmin, updatePersonnelValidation, validation, updatePersonnel);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deletePersonnel);

router.post('/:id/promote-to-expert', auth, requireAdmin, [
    param('id').isMongoId(),
    body('specializations').isArray({ min: 1 }),
    body('certifications').optional().isArray()
], validation, promoteToExpert);

module.exports = router;