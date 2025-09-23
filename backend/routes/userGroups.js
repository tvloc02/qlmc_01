const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getUserGroups,
    getUserGroupById,
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    addUsersToGroup,
    removeUsersFromGroup,
    getUserGroupMembers
} = require('../controllers/userGroupController');

const createUserGroupValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên nhóm người dùng là bắt buộc')
        .isLength({ max: 100 }),
    body('code')
        .notEmpty()
        .withMessage('Mã nhóm là bắt buộc')
        .isLength({ max: 20 })
        .matches(/^[A-Z0-9\-_]+$/),
    body('description')
        .optional()
        .isLength({ max: 500 }),
    body('permissions')
        .isArray()
        .withMessage('Quyền hạn là bắt buộc'),
    body('permissions.*.module')
        .isIn(['evidence', 'standards', 'criteria', 'experts', 'reports', 'users', 'configuration']),
    body('permissions.*.actions')
        .isArray()
];

const updateUserGroupValidation = [
    param('id').isMongoId().withMessage('ID nhóm không hợp lệ'),
    ...createUserGroupValidation.filter(rule =>
        !rule.builder.fields.includes('code')
    )
];

const manageUsersValidation = [
    param('id').isMongoId(),
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('Danh sách người dùng là bắt buộc')
        .custom((value) => {
            return value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
        })
];

router.get('/', auth, requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('status').optional().isIn(['active', 'inactive']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getUserGroups);

router.get('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, getUserGroupById);

router.get('/:id/members', auth, requireAdmin, [
    param('id').isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], validation, getUserGroupMembers);

router.post('/', auth, requireAdmin, createUserGroupValidation, validation, createUserGroup);

router.put('/:id', auth, requireAdmin, updateUserGroupValidation, validation, updateUserGroup);

router.delete('/:id', auth, requireAdmin, [param('id').isMongoId()], validation, deleteUserGroup);

router.post('/:id/users', auth, requireAdmin, manageUsersValidation, validation, addUsersToGroup);

router.delete('/:id/users', auth, requireAdmin, manageUsersValidation, validation, removeUsersFromGroup);

module.exports = router;