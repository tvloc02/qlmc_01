const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getExperts,
    getExpertById,
    createExpert,
    updateExpert,
    deleteExpert,
    assignExpertToProgram,
    getExpertAssignments,
    updateExpertAvailability,
    getExpertStatistics,
    getAvailableExperts,
    bulkAssignExperts
} = require('../controllers/expertController');

const createExpertValidation = [
    body('personnelId')
        .notEmpty()
        .withMessage('ID nhân sự là bắt buộc')
        .isMongoId()
        .withMessage('ID nhân sự không hợp lệ'),
    body('specializations')
        .isArray({ min: 1 })
        .withMessage('Chuyên môn là bắt buộc'),
    body('specializations.*.field')
        .notEmpty()
        .withMessage('Lĩnh vực chuyên môn là bắt buộc'),
    body('specializations.*.level')
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Trình độ chuyên môn không hợp lệ'),
    body('specializations.*.yearsOfExperience')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số năm kinh nghiệm phải lớn hơn 0'),
    body('certifications')
        .optional()
        .isArray()
        .withMessage('Chứng chỉ phải là mảng')
];

const updateExpertValidation = [
    param('id').isMongoId().withMessage('ID chuyên gia không hợp lệ'),
    ...createExpertValidation.filter(rule =>
        !rule.builder.fields.includes('personnelId')
    )
];

const assignExpertValidation = [
    param('id').isMongoId().withMessage('ID chuyên gia không hợp lệ'),
    body('programId')
        .notEmpty()
        .withMessage('ID chương trình là bắt buộc')
        .isMongoId(),
    body('role')
        .isIn(['lead_evaluator', 'evaluator', 'reviewer', 'observer'])
        .withMessage('Vai trò không hợp lệ'),
    body('assignedStandards')
        .optional()
        .isArray()
        .withMessage('Tiêu chuẩn được gán phải là mảng')
];

router.get('/statistics', auth, requireManager, getExpertStatistics);

router.get('/available', auth, [
    query('programId').optional().isMongoId(),
    query('standardIds').optional().custom((value) => {
        if (typeof value === 'string') return true;
        return Array.isArray(value) && value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
    }),
    query('specialization').optional().trim(),
    query('minLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert'])
], validation, getAvailableExperts);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('specialization').optional().trim(),
    query('availability').optional().isIn(['available', 'busy', 'unavailable']),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'expertCode']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getExperts);

router.get('/:id', auth, [param('id').isMongoId()], validation, getExpertById);

router.get('/:id/assignments', auth, [
    param('id').isMongoId(),
    query('status').optional().isIn(['active', 'completed', 'cancelled'])
], validation, getExpertAssignments);

router.post('/', auth, requireManager, createExpertValidation, validation, createExpert);

router.put('/:id', auth, requireManager, updateExpertValidation, validation, updateExpert);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteExpert);

router.post('/:id/assign', auth, requireManager, assignExpertValidation, validation, assignExpertToProgram);

router.patch('/:id/availability', auth, [
    param('id').isMongoId(),
    body('availability').isIn(['available', 'busy', 'unavailable'])
], validation, updateExpertAvailability);

router.post('/bulk-assign', auth, requireManager, [
    body('expertIds').isArray({ min: 1 }),
    body('programId').notEmpty().isMongoId(),
    body('role').isIn(['lead_evaluator', 'evaluator', 'reviewer', 'observer'])
], validation, bulkAssignExperts);

module.exports = router;