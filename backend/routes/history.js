const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getSystemHistory,
    getUserHistory,
    getActivityStatistics,
    exportActivityReport,
    getLoginHistory,
    getAuditTrail
} = require('../controllers/historyController');

router.get('/system', auth, requireManager, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isIn(['login', 'logout', 'create', 'read', 'update', 'delete', 'upload', 'download', 'sign', 'approve', 'reject', 'publish', 'unpublish', 'export', 'import']),
    query('module').optional().isIn(['auth', 'evidence', 'standards', 'criteria', 'experts', 'programs', 'organizations', 'files', 'reports', 'users', 'configuration']),
    query('userId').optional().isMongoId(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('status').optional().isIn(['success', 'failed', 'warning'])
], validation, getSystemHistory);

router.get('/users/:userId', auth, requireManager, [
    param('userId').isMongoId().withMessage('ID người dùng không hợp lệ'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isIn(['login', 'logout', 'create', 'read', 'update', 'delete', 'upload', 'download', 'sign', 'approve', 'reject', 'publish', 'unpublish', 'export', 'import']),
    query('module').optional().isIn(['auth', 'evidence', 'standards', 'criteria', 'experts', 'programs', 'organizations', 'files', 'reports', 'users', 'configuration']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
], validation, getUserHistory);

router.get('/statistics', auth, requireManager, [
    query('period').optional().isIn(['hour', 'day', 'week', 'month']),
    query('groupBy').optional().isIn(['action', 'module', 'user', 'hour', 'day']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
], validation, getActivityStatistics);

router.get('/logins', auth, requireManager, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isMongoId(),
    query('successful').optional().isBoolean(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
], validation, getLoginHistory);

router.get('/audit/:targetType/:targetId', auth, requireManager, [
    param('targetType').isIn(['Evidence', 'Standard', 'Criteria', 'Expert', 'Program', 'Organization', 'File', 'User', 'AssessmentProgram', 'SigningInfo']),
    param('targetId').isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], validation, getAuditTrail);

router.get('/export', auth, requireManager, [
    query('format').optional().isIn(['xlsx', 'csv']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('module').optional().isIn(['auth', 'evidence', 'standards', 'criteria', 'experts', 'programs', 'organizations', 'files', 'reports', 'users', 'configuration']),
    query('action').optional().isIn(['login', 'logout', 'create', 'read', 'update', 'delete', 'upload', 'download', 'sign', 'approve', 'reject', 'publish', 'unpublish', 'export', 'import'])
], validation, exportActivityReport);

module.exports = router;