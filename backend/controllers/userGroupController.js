const UserGroup = require('../models/UserGroup');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

const getUserGroups = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            organizationLevel,
            facultyId,
            departmentId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (organizationLevel) query.organizationLevel = organizationLevel;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [userGroups, total] = await Promise.all([
            UserGroup.find(query)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            UserGroup.countDocuments(query)
        ]);

        // Get member count for each group
        const groupsWithMemberCount = await Promise.all(
            userGroups.map(async (group) => {
                const memberCount = await User.countDocuments({
                    userGroups: group._id,
                    status: 'active'
                });
                return {
                    ...group.toObject(),
                    memberCount
                };
            })
        );

        res.json({
            success: true,
            data: {
                userGroups: groupsWithMemberCount,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhóm người dùng'
        });
    }
};

const getAllUserGroups = async (req, res) => {
    try {
        const { organizationLevel, facultyId, departmentId } = req.query;

        let query = { status: 'active' };
        if (organizationLevel) query.organizationLevel = organizationLevel;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;

        const userGroups = await UserGroup.find(query)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .select('name code description organizationLevel facultyId departmentId')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: userGroups
        });

    } catch (error) {
        console.error('Get all user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhóm người dùng'
        });
    }
};

const getUserGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        const userGroup = await UserGroup.findById(id)
            .populate('facultyId', 'name code description')
            .populate('departmentId', 'name code type description')
            .populate('createdBy', 'fullName email');

        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Get members of this group
        const members = await User.find({
            userGroups: id,
            status: 'active'
        })
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .select('fullName email role facultyId departmentId positions');

        res.json({
            success: true,
            data: {
                ...userGroup.toObject(),
                members
            }
        });

    } catch (error) {
        console.error('Get user group by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhóm người dùng'
        });
    }
};

const createUserGroup = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            organizationLevel,
            facultyId,
            departmentId,
            permissions,
            signingPermissions,
            priority,
            notificationSettings,
            autoAssignmentRules,
            tags
        } = req.body;

        // Check if code already exists
        const existingGroup = await UserGroup.findOne({ code: code.toUpperCase() });
        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: `Mã nhóm ${code} đã tồn tại`
            });
        }

        // Validate faculty if provided
        if (facultyId) {
            const faculty = await Faculty.findById(facultyId);
            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Khoa không tồn tại'
                });
            }
        }

        // Validate department if provided
        if (departmentId) {
            const department = await Department.findById(departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn không tồn tại'
                });
            }
        }

        // Validate permissions structure
        if (permissions && Array.isArray(permissions)) {
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
            }
        }

        const userGroup = new UserGroup({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            description: description?.trim(),
            organizationLevel: organizationLevel || 'university',
            facultyId: facultyId || null,
            departmentId: departmentId || null,
            permissions: permissions || [],
            signingPermissions: signingPermissions || {
                canSign: false,
                canStamp: false,
                allowedDocumentTypes: [],
                approvalLevel: 1
            },
            priority: priority || 1,
            notificationSettings: notificationSettings || {
                emailNotifications: true,
                systemNotifications: true,
                events: []
            },
            autoAssignmentRules: autoAssignmentRules || [],
            tags: tags || [],
            createdBy: req.user.id
        });

        await userGroup.save();

        await userGroup.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo nhóm người dùng thành công',
            data: userGroup
        });

    } catch (error) {
        console.error('Create user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhóm người dùng'
        });
    }
};

const updateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check code uniqueness if being updated
        if (updateData.code && updateData.code.toUpperCase() !== userGroup.code) {
            const existingGroup = await UserGroup.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingGroup) {
                return res.status(400).json({
                    success: false,
                    message: `Mã nhóm ${updateData.code} đã tồn tại`
                });
            }
        }

        // Validate faculty if being updated
        if (updateData.facultyId) {
            const faculty = await Faculty.findById(updateData.facultyId);
            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Khoa không tồn tại'
                });
            }
        }

        // Validate department if being updated
        if (updateData.departmentId) {
            const department = await Department.findById(updateData.departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn không tồn tại'
                });
            }
        }

        // Update fields
        const allowedFields = [
            'name', 'code', 'description', 'organizationLevel',
            'facultyId', 'departmentId', 'permissions', 'signingPermissions',
            'priority', 'notificationSettings', 'autoAssignmentRules', 'tags', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'code') {
                    userGroup[field] = updateData[field].toUpperCase();
                } else {
                    userGroup[field] = updateData[field];
                }
            }
        });

        userGroup.updatedBy = req.user.id;
        await userGroup.save();

        await userGroup.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật nhóm người dùng thành công',
            data: userGroup
        });

    } catch (error) {
        console.error('Update user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật nhóm người dùng'
        });
    }
};

const deleteUserGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check if group has members
        const memberCount = await User.countDocuments({ userGroups: id });
        if (memberCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa nhóm đang có thành viên. Vui lòng chuyển thành viên sang nhóm khác trước.'
            });
        }

        await UserGroup.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa nhóm người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa nhóm người dùng'
        });
    }
};

const addMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Check if users exist and can join this group
        const users = await User.find({
            _id: { $in: userIds },
            status: 'active'
        });

        if (users.length !== userIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số người dùng không tồn tại hoặc không hoạt động'
            });
        }

        // Check organization level restrictions
        const invalidUsers = [];
        for (const user of users) {
            if (!userGroup.canUserJoin(user)) {
                invalidUsers.push(user.fullName);
            }
        }

        if (invalidUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Những người dùng sau không thể tham gia nhóm do ràng buộc tổ chức: ${invalidUsers.join(', ')}`
            });
        }

        // Add group to users
        await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { userGroups: id } }
        );

        // Update group statistics
        await userGroup.updateStatistics();

        res.json({
            success: true,
            message: `Thêm ${users.length} thành viên vào nhóm thành công`
        });

    } catch (error) {
        console.error('Add members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm thành viên'
        });
    }
};

const removeMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Remove group from users
        await User.updateMany(
            { _id: { $in: userIds } },
            { $pull: { userGroups: id } }
        );

        // Update group statistics
        await userGroup.updateStatistics();

        res.json({
            success: true,
            message: `Loại bỏ ${userIds.length} thành viên khỏi nhóm thành công`
        });

    } catch (error) {
        console.error('Remove members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi loại bỏ thành viên'
        });
    }
};

const getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            page = 1,
            limit = 20,
            search,
            position,
            facultyId
        } = req.query;

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { userGroups: id };

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Position filter
        if (position) {
            query['positions.title'] = position;
            query['positions.isActive'] = true;
        }

        // Faculty filter
        if (facultyId) {
            query.facultyId = facultyId;
        }

        const [members, total] = await Promise.all([
            User.find(query)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code')
                .populate('positions.department', 'name code')
                .select('fullName email role status lastLogin facultyId departmentId positions digitalSignature.isActive')
                .sort({ fullName: 1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                groupInfo: {
                    name: userGroup.name,
                    code: userGroup.code,
                    organizationLevel: userGroup.organizationLevel
                },
                members,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách thành viên'
        });
    }
};

const getPermissionMatrix = async (req, res) => {
    try {
        const { organizationLevel, facultyId, departmentId } = req.query;

        let query = { status: 'active' };
        if (organizationLevel) query.organizationLevel = organizationLevel;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;

        const matrix = await UserGroup.getPermissionMatrix();

        res.json({
            success: true,
            data: matrix
        });

    } catch (error) {
        console.error('Get permission matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy ma trận phân quyền'
        });
    }
};

const updateGroupPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions phải là một mảng'
            });
        }

        const userGroup = await UserGroup.findById(id);
        if (!userGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm người dùng'
            });
        }

        // Validate permissions
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
        }

        userGroup.permissions = permissions;
        userGroup.updatedBy = req.user.id;
        await userGroup.save();

        res.json({
            success: true,
            message: 'Cập nhật quyền nhóm thành công',
            data: {
                groupId: id,
                permissions: userGroup.permissions
            }
        });

    } catch (error) {
        console.error('Update group permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật quyền nhóm'
        });
    }
};

const copyGroupPermissions = async (req, res) => {
    try {
        const { sourceId, targetIds } = req.body;

        if (!Array.isArray(targetIds) || targetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách nhóm đích không hợp lệ'
            });
        }

        const sourceGroup = await UserGroup.findById(sourceId);
        if (!sourceGroup) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm nguồn'
            });
        }

        const targetGroups = await UserGroup.find({
            _id: { $in: targetIds },
            status: 'active'
        });

        if (targetGroups.length !== targetIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số nhóm đích không tồn tại'
            });
        }

        // Copy permissions
        await UserGroup.updateMany(
            { _id: { $in: targetIds } },
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
            message: `Sao chép quyền thành công cho ${targetGroups.length} nhóm`
        });

    } catch (error) {
        console.error('Copy group permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi sao chép quyền nhóm'
        });
    }
};

const getGroupStatistics = async (req, res) => {
    try {
        const { organizationLevel, facultyId, departmentId } = req.query;

        let matchStage = { status: 'active' };
        if (organizationLevel) matchStage.organizationLevel = organizationLevel;
        if (facultyId) matchStage.facultyId = mongoose.Types.ObjectId(facultyId);
        if (departmentId) matchStage.departmentId = mongoose.Types.ObjectId(departmentId);

        const stats = await UserGroup.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalGroups: { $sum: 1 },
                    groupsByLevel: {
                        $push: '$organizationLevel'
                    },
                    groupsWithSigning: {
                        $sum: { $cond: [{ $eq: ['$signingPermissions.canSign', true] }, 1, 0] }
                    },
                    averagePermissions: {
                        $avg: { $size: '$permissions' }
                    }
                }
            }
        ]);

        // Organization level breakdown
        const levelStats = await UserGroup.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$organizationLevel',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = stats[0] || {
            totalGroups: 0,
            groupsWithSigning: 0,
            averagePermissions: 0
        };

        result.levelStats = levelStats;

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get group statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê nhóm'
        });
    }
};

module.exports = {
    getUserGroups,
    getAllUserGroups,
    getUserGroupById,
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    addMembers,
    removeMembers,
    getGroupMembers,
    getPermissionMatrix,
    updateGroupPermissions,
    copyGroupPermissions,
    getGroupStatistics
};