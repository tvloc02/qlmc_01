const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getAssessmentPrograms,
    getAssessmentProgramById,
    createAssessmentProgram,
    updateAssessmentProgram,
    deleteAssessmentProgram,
    updateProgress,
    getStatistics,
    assignExperts,
    updateMilestone,
    generateReport
} = require('../controllers/assessmentProgramController');

const createAssessmentProgramValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên chương trình đánh giá là bắt buộc')
        .isLength({ max: 300 }),
    body('code')
        .notEmpty()
        .withMessage('Mã chương trình đánh giá là bắt buộc')
        .isLength({ max: 20 }),
    body('programId')
        .notEmpty()
        .withMessage('Chương trình gốc là bắt buộc')
        .isMongoId(),
    body('organizationId')
        .notEmpty()
        .withMessage('Tổ chức đánh giá là bắt buộc')
        .isMongoId(),
    body('academicYear')
        .notEmpty()
        .withMessage('Năm học là bắt buộc')
        .matches(/^\d{4}-\d{4}$/),
    body('assessmentType')
        .isIn(['self_assessment', 'internal_review', 'external_review', 'accreditation'])
        .withMessage('Loại đánh giá không hợp lệ'),
    body('timeline.startDate')
        .notEmpty()
        .withMessage('Ngày bắt đầu là bắt buộc')
        .isISO8601(),
    body('timeline.endDate')
        .notEmpty()
        .withMessage('Ngày kết thúc là bắt buộc')
        .isISO8601()
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.timeline?.startDate)) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }
            return true;
        }),
    body('timeline.milestones')
        .optional()
        .isArray(),
    body('assessmentCriteria')
        .optional()
        .isArray()
];

const updateAssessmentProgramValidation = [
    param('id').isMongoId().withMessage('ID chương trình đánh giá không hợp lệ'),
    ...createAssessmentProgramValidation.filter(rule =>
        !rule.builder.fields.includes('code') &&
        !rule.builder.fields.includes('programId') &&
        !rule.builder.fields.includes('organizationId')
    )
];

const assignExpertsValidation = [
    param('id').isMongoId(),
    body('assignments')
        .isArray({ min: 1 })
        .withMessage('Danh sách phân công là bắt buộc'),
    body('assignments.*.expertId')
        .notEmpty()
        .isMongoId(),
    body('assignments.*.role')
        .isIn(['lead_evaluator', 'evaluator', 'reviewer', 'observer']),
    body('assignments.*.assignedStandards')
        .optional()
        .isArray()
];

router.get('/statistics', auth, requireManager, [
    query('academicYear').optional().matches(/^\d{4}-\d{4}$/),
    query('organizationId').optional().isMongoId(),
    query('status').optional().isIn(['planning', 'active', 'review', 'completed', 'cancelled', 'suspended'])
], validation, getStatistics);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('academicYear').optional().matches(/^\d{4}-\d{4}$/),
    query('assessmentType').optional().isIn(['self_assessment', 'internal_review', 'external_review', 'accreditation']),
    query('status').optional().isIn(['planning', 'active', 'review', 'completed', 'cancelled', 'suspended']),
    query('organizationId').optional().isMongoId(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'startDate', 'endDate']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getAssessmentPrograms);

router.get('/:id', auth, [param('id').isMongoId()], validation, getAssessmentProgramById);

router.post('/', auth, requireManager, createAssessmentProgramValidation, validation, createAssessmentProgram);

router.put('/:id', auth, requireManager, updateAssessmentProgramValidation, validation, updateAssessmentProgram);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteAssessmentProgram);

router.post('/:id/assign-experts', auth, requireManager, assignExpertsValidation, validation, assignExperts);

router.patch('/:id/progress', auth, [param('id').isMongoId()], validation, updateProgress);

router.patch('/:id/milestone/:milestoneId', auth, [
    param('id').isMongoId(),
    param('milestoneId').isMongoId(),
    body('status').isIn(['pending', 'in_progress', 'completed', 'overdue'])
], validation, updateMilestone);

router.get('/:id/report', auth, [
    param('id').isMongoId(),
    query('format').optional().isIn(['pdf', 'xlsx', 'docx'])
], validation, generateReport);

module.exports = router;