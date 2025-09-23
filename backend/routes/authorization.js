const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getPermissions,
    updateUserPermissions,
    updateGroupPermissions,
    getPermissionMatrix,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    revokeRole
} = require('../controllers/authorizationController');

const updateUserPermissionsValidation = [
    param('userId').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('standardAccess')
        .optional()
        .isArray()
        .withMessage('Quyền tiêu chuẩn phải là mảng'),
    body('criteriaAccess')
        .optional()
        .isArray()
        .withMessage('Quyền tiêu chí phải là mảng'),
    body('permissions')
        .optional()
        .isObject()
        .withMessage('Quyền hạn phải là object')
];

const updateGroupPermissionsValidation = [
    param('groupId').isMongoId().withMessage('ID nhóm không hợp lệ'),
    body('permissions')
        .isArray()
        .withMessage('Quyền hạn là bắt buộc'),
    body('permissions.*.module')
        .isIn(['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration']),
    body('permissions.*.actions')
        .isArray()
];

const createRoleValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên vai trò là bắt buộc')
        .isLength({ max: 50 }),
    body('code')
        .notEmpty()
        .withMessage('Mã vai trò là bắt buộc')
        .isLength({ max: 20 })
        .matches(/^[A-Z0-9\-_]+$/),
    body('description')
        .optional()
        .isLength({ max: 500 }),
    body('permissions')
        .isArray()
        .withMessage('Quyền hạn là bắt buộc'),
    body('level')
        .optional()
        .isInt({ min: 1, max: 10 })
];

const assignRoleValidation = [
    body('userId')
        .notEmpty()
        .withMessage('ID người dùng là bắt buộc')
        .isMongoId(),
    body('roleId')
        .notEmpty()
        .withMessage('ID vai trò là bắt buộc')
        .isMongoId(),
    body('scope')
        .optional()
        .isObject(),
    body('expiryDate')
        .optional()
        .isISO8601()
];

router.get('/permissions', auth, requireAdmin, getPermissions);

router.get('/matrix', auth, requireAdmin, [
    query('module').optional().isIn(['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration']),
    query('role').optional().isIn(['admin', 'manager', 'staff', 'expert'])
], validation, getPermissionMatrix);

router.put('/users/:userId/permissions', auth, requireAdmin, updateUserPermissionsValidation, validation, updateUserPermissions);

router.put('/groups/:groupId/permissions', auth, requireAdmin, updateGroupPermissionsValidation, validation, updateGroupPermissions);

router.post('/roles', auth, requireAdmin, createRoleValidation, validation, createRole);

router.put('/roles/:id', auth, requireAdmin, [
    param('id').isMongoId(),
    ...createRoleValidation.filter(rule => !rule.builder.fields.includes('code'))
], validation, updateRole);

router.delete('/roles/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteRole);

router.post('/assign-role', auth, requireAdmin, assignRoleValidation, validation, assignRole);

router.post('/revoke-role', auth, requireAdmin, [
    body('userId').notEmpty().isMongoId(),
    body('roleId').notEmpty().isMongoId()
], validation, revokeRole);

module.exports = router;