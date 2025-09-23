const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// Get all available permissions and modules
const getPermissions = async (req, res) => {
    try {
        const permissions = {
            modules: [
                {
                    key: 'evidence',
                    name: 'Quản lý minh chứng',
                    description: 'Quản lý tài liệu minh chứng'
                },
                {
                    key: 'standards',
                    name: 'Quản lý tiêu chuẩn',
                    description: 'Quản lý các tiêu chuẩn đánh giá'
                },
                {
                    key: 'criteria',
                    name: 'Quản lý tiêu chí',
                    description: 'Quản lý tiêu chí đánh giá'
                },
                {
                    key: 'experts',
                    name: 'Quản lý chuyên gia',
                    description: 'Quản lý chuyên gia đánh giá'
                },
                {
                    key: 'assessment',
                    name: 'Đánh giá minh chứng',
                    description: 'Thực hiện đánh giá minh chứng'
                },
                {
                    key: 'reports',
                    name: 'Báo cáo',
                    description: 'Tạo và xem báo cáo'
                },
                {
                    key: 'documents',
                    name: 'Quản lý tài liệu',
                    description: 'Quản lý tài liệu hệ thống'
                },
                {
                    key: 'workflow',
                    name: 'Quy trình phê duyệt',
                    description: 'Quản lý quy trình phê duyệt'
                },
                {
                    key: 'users',
                    name: 'Quản lý người dùng',
                    description: 'Quản lý người dùng hệ thống'
                },
                {
                    key: 'configuration',
                    name: 'Cấu hình hệ thống',
                    description: 'Cấu hình và thiết lập hệ thống'
                }
            ],
            actions: [
                {
                    key: 'view',
                    name: 'Hiển thị',
                    description: 'Xem thông tin'
                },
                {
                    key: 'create',
                    name: 'Thêm',
                    description: 'Tạo mới'
                },
                {
                    key: 'edit',
                    name: 'Sửa',
                    description: 'Chỉnh sửa'
                },
                {
                    key: 'delete',
                    name: 'Xóa',
                    description: 'Xóa dữ liệu'
                }
            ],
            roles: [
                {
                    key: 'admin',
                    name: 'Quản trị viên',
                    description: 'Toàn quyền hệ thống'
                },
                {
                    key: 'manager',
                    name: 'Quản lý',
                    description: 'Quản lý trong phạm vi'
                },
                {
                    key: 'staff',
                    name: 'Nhân viên',
                    description: 'Nhân viên thường'
                },
                {
                    key: 'expert',
                    name: 'Chuyên gia',
                    description: 'Chuyên gia đánh giá'
                },
                {
                    key: 'guest',
                    name: 'Khách',
                    description: 'Quyền hạn chế'
                }
            ],
            positions: [
                {
                    key: 'giang_vien',
                    name: 'Giảng viên'
                },
                {
                    key: 'truong_khoa',
                    name: 'Trưởng khoa'
                },
                {
                    key: 'pho_truong_khoa',
                    name: 'Phó trưởng khoa'
                },
                {
                    key: 'truong_bo_mon',
                    name: 'Trưởng bộ môn'
                },
                {
                    key: 'pho_truong_bo_mon',
                    name: 'Phó trưởng bộ môn'
                },
                {
                    key: 'chu_nhiem_chuong_trinh',
                    name: 'Chủ nhiệm chương trình'
                },
                {
                    key: 'giam_doc_trung_tam',
                    name: 'Giám đốc trung tâm'
                },
                {
                    key: 'pho_giam_doc',
                    name: 'Phó giám đốc'
                },
                {
                    key: 'thu_ky_khoa',
                    name: 'Thư ký khoa'
                },
                {
                    key: 'chuyen_vien',
                    name: 'Chuyên viên'
                },
                {
                    key: 'nhan_vien',
                    name: 'Nhân viên'
                }
            ]
        };

        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách quyền'
        });
    }
};

// Update user permissions
const updateUserPermissions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { userGroups, individualPermissions } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Validate user groups
        if (userGroups) {
            const groups = await UserGroup.find({
                _id: { $in: userGroups },
                status: 'active'
            });
            if (groups.length !== userGroups.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Một số nhóm người dùng không tồn tại'
                });
            }

            // Check organization level restrictions
            for (const group of groups) {
                if (!group.canUserJoin(user)) {
                    return res.status(400).json({
                        success: false,
                        message: `Người dùng không thể tham gia nhóm ${group.name} do ràng buộc tổ chức`
                    });
                }
            }

            user.userGroups = userGroups;
        }

        // Validate individual permissions
        if (individualPermissions) {
            const validModules = [
                'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
                'kiem_tra', 'dong_dau', 'bao_cao', 'danh_muc_so',
                'cau_hinh', 'du_lieu_don_vi'
            ];

            for (const permission of individualPermissions) {
                if (!validModules.includes(permission.module)) {
                    return res.status(400).json({
                        success: false,
                        message: `Module ${permission.module} không hợp lệ`
                    });
                }
            }

            user.individualPermissions = individualPermissions;
        }

        user.updatedBy = req.user.id;
        await user.save();

        // Populate for response
        await user.populate([
            { path: 'userGroups', select: 'name code permissions' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật quyền người dùng thành công',
            data: {
                userId,
                userGroups: user.userGroups,
                individualPermissions: user.individualPermissions
            }
        });
    } catch (error) {
        console.error('Update user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật quyền người dùng'
        });
    }
};

// Update group permissions
const updateGroupPermissions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { groupId } = req.params;
        const { permissions } = req.body;

        const group = await UserGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Nhóm người dùng không tồn tại'
            });
        }

        // Validate permissions structure
        const validModules = [
            'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
            'kiem_tra', 'dong_dau', 'bao_cao', 'danh_muc_so',
            'cau_hinh', 'du_lieu_don_vi'
        ];

        for (const permission of permissions) {
            if (!validModules.includes(permission.module)) {
                return res.status(400).json({
                    success: false,
                    message: `Module ${permission.module} không hợp lệ`
                });
            }

            // Validate actions
            const validActions = ['view', 'create', 'edit', 'delete'];
            const actions = permission.actions || {};

            for (const action of Object.keys(actions)) {
                if (!validActions.includes(action)) {
                    return res.status(400).json({
                        success: false,
                        message: `Action ${action} không hợp lệ`
                    });
                }
            }
        }

        group.permissions = permissions;
        group.updatedBy = req.user.id;
        await group.save();

        res.json({
            success: true,
            message: 'Cập nhật quyền nhóm thành công',
            data: {
                groupId,
                permissions: group.permissions
            }
        });
    } catch (error) {
        console.error('Update group permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật quyền nhóm'
        });
    }
};

// Get permission matrix
const getPermissionMatrix = async (req, res) => {
    try {
        const {
            organizationLevel,
            facultyId,
            departmentId,
            module,
            role
        } = req.query;

        let query = { status: 'active' };

        if (organizationLevel) query.organizationLevel = organizationLevel;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;

        const userGroups = await UserGroup.find(query)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .select('name code permissions organizationLevel facultyId departmentId')
            .sort({ name: 1 });

        const modules = [
            'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
            'kiem_tra', 'dong_dau', 'bao_cao', 'danh_muc_so',
            'cau_hinh', 'du_lieu_don_vi'
        ];

        const actions = ['view', 'create', 'edit', 'delete'];

        let matrix = {};

        if (module && userGroups.length > 0) {
            // Specific module matrix
            matrix[module] = {};
            userGroups.forEach(group => {
                const permission = group.permissions.find(p => p.module === module);
                matrix[module][group.code] = {
                    groupName: group.name,
                    organizationLevel: group.organizationLevel,
                    faculty: group.facultyId?.name,
                    department: group.departmentId?.name,
                    actions: permission ? permission.actions : {
                        view: false, create: false, edit: false, delete: false
                    }
                };
            });
        } else {
            // Full matrix
            modules.forEach(mod => {
                matrix[mod] = {};
                userGroups.forEach(group => {
                    const permission = group.permissions.find(p => p.module === mod);
                    matrix[mod][group.code] = {
                        groupName: group.name,
                        organizationLevel: group.organizationLevel,
                        faculty: group.facultyId?.name,
                        department: group.departmentId?.name,
                        actions: permission ? permission.actions : {
                            view: false, create: false, edit: false, delete: false
                        }
                    };
                });
            });
        }

        res.json({
            success: true,
            data: {
                matrix,
                modules,
                actions,
                groups: userGroups.map(g => ({
                    code: g.code,
                    name: g.name,
                    organizationLevel: g.organizationLevel,
                    faculty: g.facultyId?.name,
                    department: g.departmentId?.name
                }))
            }
        });
    } catch (error) {
        console.error('Get permission matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy ma trận quyền'
        });
    }
};

// Get effective permissions for a user
const getUserEffectivePermissions = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('userGroups', 'name code permissions')
            .select('individualPermissions userGroups role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        let effectivePermissions = {};

        // Calculate from groups
        if (user.userGroups && user.userGroups.length > 0) {
            user.userGroups.forEach(group => {
                if (group.permissions) {
                    group.permissions.forEach(perm => {
                        if (!effectivePermissions[perm.module]) {
                            effectivePermissions[perm.module] = {
                                view: false,
                                create: false,
                                edit: false,
                                delete: false,
                                source: []
                            };
                        }

                        Object.keys(perm.actions).forEach(action => {
                            if (perm.actions[action]) {
                                effectivePermissions[perm.module][action] = true;
                                effectivePermissions[perm.module].source.push({
                                    type: 'group',
                                    name: group.name,
                                    action
                                });
                            }
                        });
                    });
                }
            });
        }

        // Override with individual permissions
        if (user.individualPermissions && user.individualPermissions.length > 0) {
            user.individualPermissions.forEach(perm => {
                if (!effectivePermissions[perm.module]) {
                    effectivePermissions[perm.module] = {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                        source: []
                    };
                }

                Object.keys(perm.actions).forEach(action => {
                    effectivePermissions[perm.module][action] = perm.actions[action];

                    // Update source
                    effectivePermissions[perm.module].source =
                        effectivePermissions[perm.module].source.filter(s => s.action !== action);

                    if (perm.actions[action]) {
                        effectivePermissions[perm.module].source.push({
                            type: 'individual',
                            name: 'Individual Permission',
                            action
                        });
                    }
                });
            });
        }

        res.json({
            success: true,
            data: {
                userId,
                role: user.role,
                effectivePermissions,
                summary: {
                    totalModules: Object.keys(effectivePermissions).length,
                    totalPermissions: Object.values(effectivePermissions).reduce((sum, module) => {
                        return sum + Object.values(module).filter(v => v === true).length;
                    }, 0)
                }
            }
        });

    } catch (error) {
        console.error('Get user effective permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy quyền hiệu lực của người dùng'
        });
    }
};

// Copy permissions between groups
const copyGroupPermissions = async (req, res) => {
    try {
        const { sourceGroupId, targetGroupIds } = req.body;

        if (!Array.isArray(targetGroupIds) || targetGroupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách nhóm đích không hợp lệ'
            });
        }

        const sourceGroup = await UserGroup.findById(sourceGroupId);
        if (!sourceGroup) {
            return res.status(404).json({
                success: false,
                message: 'Nhóm nguồn không tồn tại'
            });
        }

        const targetGroups = await UserGroup.find({
            _id: { $in: targetGroupIds },
            status: 'active'
        });

        if (targetGroups.length !== targetGroupIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số nhóm đích không tồn tại'
            });
        }

        // Copy permissions
        await UserGroup.updateMany(
            { _id: { $in: targetGroupIds } },
            {
                $set: {
                    permissions: sourceGroup.permissions,
                    updatedBy: req.user.id,
                    updatedAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: `Sao chép quyền thành công cho ${targetGroups.length} nhóm`,
            data: {
                sourceGroup: sourceGroup.name,
                targetGroups: targetGroups.map(g => g.name),
                permissionsCopied: sourceGroup.permissions.length
            }
        });

    } catch (error) {
        console.error('Copy group permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi sao chép quyền nhóm'
        });
    }
};

// Get permission templates
const getPermissionTemplates = async (req, res) => {
    try {
        const templates = {
            'admin_template': {
                name: 'Admin - Toàn quyền',
                description: 'Template cho quản trị viên',
                permissions: [
                    'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
                    'kiem_tra', 'dong_dau', 'bao_cao', 'danh_muc_so',
                    'cau_hinh', 'du_lieu_don_vi'
                ].map(module => ({
                    module,
                    actions: { view: true, create: true, edit: true, delete: true }
                }))
            },
            'manager_template': {
                name: 'Manager - Quản lý',
                description: 'Template cho quản lý cấp trung',
                permissions: [
                    { module: 'so_trinh_ky', actions: { view: true, create: true, edit: true, delete: false } },
                    { module: 'so_ky_duyet', actions: { view: true, create: true, edit: true, delete: false } },
                    { module: 'tra_cuu_so', actions: { view: true, create: false, edit: false, delete: false } },
                    { module: 'so_da_ban_hanh', actions: { view: true, create: false, edit: false, delete: false } },
                    { module: 'kiem_tra', actions: { view: true, create: true, edit: true, delete: false } },
                    { module: 'dong_dau', actions: { view: true, create: true, edit: false, delete: false } },
                    { module: 'bao_cao', actions: { view: true, create: true, edit: true, delete: false } },
                    { module: 'danh_muc_so', actions: { view: true, create: false, edit: false, delete: false } }
                ]
            },
            'staff_template': {
                name: 'Staff - Nhân viên',
                description: 'Template cho nhân viên thường',
                permissions: [
                    { module: 'so_trinh_ky', actions: { view: true, create: true, edit: true, delete: false } },
                    { module: 'tra_cuu_so', actions: { view: true, create: false, edit: false, delete: false } },
                    { module: 'so_da_ban_hanh', actions: { view: true, create: false, edit: false, delete: false } },
                    { module: 'bao_cao', actions: { view: true, create: false, edit: false, delete: false } }
                ]
            },
            'viewer_template': {
                name: 'Viewer - Chỉ xem',
                description: 'Template cho người chỉ xem',
                permissions: [
                    'so_trinh_ky', 'so_ky_duyet', 'tra_cuu_so', 'so_da_ban_hanh',
                    'kiem_tra', 'bao_cao', 'danh_muc_so'
                ].map(module => ({
                    module,
                    actions: { view: true, create: false, edit: false, delete: false }
                }))
            }
        };

        res.json({
            success: true,
            data: templates
        });

    } catch (error) {
        console.error('Get permission templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy template phân quyền'
        });
    }
};

// Apply permission template to group
const applyPermissionTemplate = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { templateName } = req.body;

        const group = await UserGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Nhóm không tồn tại'
            });
        }

        // Get templates
        const templatesResponse = await getPermissionTemplates(req, res);
        const templates = templatesResponse.data || {};

        if (!templates[templateName]) {
            return res.status(400).json({
                success: false,
                message: 'Template không tồn tại'
            });
        }

        group.permissions = templates[templateName].permissions;
        group.updatedBy = req.user.id;
        await group.save();

        res.json({
            success: true,
            message: `Áp dụng template ${templates[templateName].name} thành công`,
            data: {
                groupName: group.name,
                templateName: templates[templateName].name,
                permissionsCount: group.permissions.length
            }
        });

    } catch (error) {
        console.error('Apply permission template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi áp dụng template phân quyền'
        });
    }
};

// Legacy functions for backward compatibility
const createRole = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Chức năng này đã được thay thế bằng UserGroup'
    });
};

const updateRole = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Chức năng này đã được thay thế bằng UserGroup'
    });
};

const deleteRole = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Chức năng này đã được thay thế bằng UserGroup'
    });
};

const assignRole = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Chức năng này đã được thay thế bằng UserGroup membership'
    });
};

const revokeRole = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Chức năng này đã được thay thế bằng UserGroup membership'
    });
};

module.exports = {
    getPermissions,
    updateUserPermissions,
    updateGroupPermissions,
    getPermissionMatrix,
    getUserEffectivePermissions,
    copyGroupPermissions,
    getPermissionTemplates,
    applyPermissionTemplate,
    // Legacy exports
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    revokeRole
};