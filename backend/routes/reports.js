const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getDashboardStatistics,
    getEvidenceReport,
    getExpertReport,
    getSystemUsageReport,
    getComplianceReport,
    getProgressReport,
    exportReport,
    scheduleReport,
    getScheduledReports
} = require('../controllers/reportController');

const reportQueryValidation = [
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('format').optional().isIn(['json', 'xlsx', 'csv', 'pdf'])
];

const scheduleReportValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên báo cáo là bắt buộc')
        .isLength({ max: 100 }),
    body('type')
        .isIn(['evidence', 'expert', 'usage', 'compliance', 'progress'])
        .withMessage('Loại báo cáo không hợp lệ'),
    body('schedule')
        .isIn(['daily', 'weekly', 'monthly', 'quarterly'])
        .withMessage('Lịch trình không hợp lệ'),
    body('recipients')
        .isArray({ min: 1 })
        .withMessage('Danh sách người nhận là bắt buộc'),
    body('parameters')
        .optional()
        .isObject()
];

router.get('/dashboard', auth, reportQueryValidation, validation, getDashboardStatistics);

router.get('/evidence', auth, requireManager, reportQueryValidation, validation, getEvidenceReport);

router.get('/experts', auth, requireManager, reportQueryValidation, validation, getExpertReport);

router.get('/usage', auth, requireManager, [
    ...reportQueryValidation,
    query('groupBy').optional().isIn(['day', 'week', 'month', 'user', 'action'])
], validation, getSystemUsageReport);

router.get('/compliance', auth, requireManager, reportQueryValidation, validation, getComplianceReport);

router.get('/progress', auth, requireManager, [
    ...reportQueryValidation,
    query('assessmentProgramId').optional().isMongoId()
], validation, getProgressReport);

router.post('/export', auth, requireManager, [
    body('reportType').isIn(['evidence', 'expert', 'usage', 'compliance', 'progress']),
    body('format').isIn(['xlsx', 'csv', 'pdf']),
    body('parameters').optional().isObject(),
    body('includeCharts').optional().isBoolean()
], validation, exportReport);

router.get('/scheduled', auth, requireManager, getScheduledReports);

router.post('/schedule', auth, requireManager, scheduleReportValidation, validation, scheduleReport);

module.exports = router;