const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const UserGroup = require('../models/UserGroup');

const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
            facultyId,
            departmentId,
            position,
            hasSignature,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Basic filters
        if (role) query.role = role;
        if (status) query.status = status;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;

        // Position filter
        if (position) {
            query['positions.title'] = position;
            query['positions.isActive'] = true;
        }

        // Digital signature filter
        if (hasSignature !== undefined) {
            query['digitalSignature.isActive'] = hasSignature === 'true';
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code type')
                .populate('userGroups', 'name code')
                .populate('positions.department', 'name code')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                users,
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
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách người dùng'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate('facultyId', 'name code description')
            .populate('departmentId', 'name code type description')
            .populate('userGroups', 'name code description permissions')
            .populate('positions.department', 'name code')
            .populate('createdBy', 'fullName email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
};

const createUser = async (req, res) => {
    try {
        const {
            email,
            fullName,
            phoneNumber,
            facultyId,
            departmentId,
            role,
            positions,
            academicLevel,
            specializations,
            userGroups,
            individualPermissions
        } = req.body;

        // Validate email
        const cleanEmail = email.replace('@cmc.edu.vn', '').toLowerCase();
        const existingUser = await User.findByEmailOrUsername(cleanEmail);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại trong hệ thống'
            });
        }

        // Validate faculty
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(400).json({
                success: false,
                message: 'Khoa không tồn tại'
            });
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
            if (department.facultyId.toString() !== facultyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn không thuộc khoa được chọn'
                });
            }
        }

        // Validate user groups
        if (userGroups && userGroups.length > 0) {
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
        }

        const defaultPassword = User.generateDefaultPassword(cleanEmail);

        // Prepare positions data
        const positionsData = positions && positions.length > 0 ?
            positions.map(pos => ({
                ...pos,
                startDate: pos.startDate || new Date(),
                isActive: pos.isActive !== false
            })) :
            [{
                title: 'giang_vien',
                department: departmentId,
                isMain: true,
                isActive: true,
                startDate: new Date()
            }];

        const user = new User({
            email: cleanEmail,
            fullName: fullName.trim(),
            password: defaultPassword,
            phoneNumber: phoneNumber?.trim(),
            facultyId,
            departmentId,
            role: role || 'staff',
            positions: positionsData,
            academicLevel: academicLevel || 'cu_nhan',
            specializations: specializations || [],
            userGroups: userGroups || [],
            individualPermissions: individualPermissions || [],
            status: 'active',
            createdBy: req.user.id
        });

        await user.save();

        // Populate for response
        await user.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'userGroups', select: 'name code' },
            { path: 'positions.department', select: 'name code' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: {
                user,
                defaultPassword
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo người dùng'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
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

        // Update basic fields
        const allowedFields = [
            'fullName', 'phoneNumber', 'role', 'facultyId', 'departmentId',
            'academicLevel', 'specializations', 'status', 'userGroups',
            'individualPermissions', 'preferences'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });

        // Update positions if provided
        if (updateData.positions) {
            user.positions = updateData.positions.map(pos => ({
                ...pos,
                startDate: pos.startDate || user.positions.find(p => p._id?.equals(pos._id))?.startDate || new Date(),
                isActive: pos.isActive !== false
            }));
        }

        user.updatedBy = req.user.id;
        await user.save();

        // Populate for response
        await user.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'userGroups', select: 'name code' },
            { path: 'positions.department', select: 'name code' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: user
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật người dùng'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Check if user has signed documents
        if (user.digitalSignature && user.digitalSignature.usageStats.totalSigned > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa người dùng đã ký tài liệu'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa người dùng'
        });
    }
};

const addPosition = async (req, res) => {
    try {
        const { id } = req.params;
        const positionData = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Validate department if provided
        if (positionData.department) {
            const department = await Department.findById(positionData.department);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn không tồn tại'
                });
            }
        }

        user.addPosition({
            ...positionData,
            startDate: positionData.startDate || new Date(),
            isActive: true
        });

        await user.save();

        res.json({
            success: true,
            message: 'Thêm chức vụ thành công',
            data: user.positions
        });

    } catch (error) {
        console.error('Add position error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm chức vụ'
        });
    }
};

const removePosition = async (req, res) => {
    try {
        const { id, positionId } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        user.removePosition(positionId);
        await user.save();

        res.json({
            success: true,
            message: 'Xóa chức vụ thành công'
        });

    } catch (error) {
        console.error('Remove position error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa chức vụ'
        });
    }
};

const updateDigitalSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            signatureImage,
            certificate,
            settings
        } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Initialize digital signature if not exists
        if (!user.digitalSignature) {
            user.digitalSignature = {
                usageStats: { totalSigned: 0 },
                isActive: false
            };
        }

        // Update signature image
        if (signatureImage) {
            user.digitalSignature.signatureImage = signatureImage;
        }

        // Update certificate
        if (certificate) {
            user.digitalSignature.certificate = {
                ...user.digitalSignature.certificate,
                ...certificate
            };
        }

        // Update settings
        if (settings) {
            user.digitalSignature.settings = {
                ...user.digitalSignature.settings,
                ...settings
            };
        }

        // Activate signature if image and certificate are provided
        if (user.digitalSignature.signatureImage && user.digitalSignature.certificate) {
            user.digitalSignature.isActive = true;
        }

        user.updatedBy = req.user.id;
        await user.save();

        res.json({
            success: true,
            message: 'Cập nhật chữ ký số thành công',
            data: user.digitalSignature
        });

    } catch (error) {
        console.error('Update digital signature error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật chữ ký số'
        });
    }
};

const getUserStatistics = async (req, res) => {
    try {
        const { facultyId, departmentId } = req.query;

        let matchStage = { status: { $in: ['active', 'inactive'] } };
        if (facultyId) matchStage.facultyId = mongoose.Types.ObjectId(facultyId);
        if (departmentId) matchStage.departmentId = mongoose.Types.ObjectId(departmentId);

        const stats = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    usersWithSignature: {
                        $sum: { $cond: [{ $eq: ['$digitalSignature.isActive', true] }, 1, 0] }
                    },
                    adminUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                    },
                    managerUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] }
                    },
                    staffUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] }
                    },
                    expertUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'expert'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Position statistics
        const positionStats = await User.aggregate([
            { $match: matchStage },
            { $unwind: '$positions' },
            { $match: { 'positions.isActive': true } },
            {
                $group: {
                    _id: '$positions.title',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const result = stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            usersWithSignature: 0,
            adminUsers: 0,
            managerUsers: 0,
            staffUsers: 0,
            expertUsers: 0
        };

        result.positionStats = positionStats;

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê người dùng'
        });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const newPassword = User.generateDefaultPassword(user.email);
        user.password = newPassword;
        user.updatedBy = req.user.id;
        await user.save();

        res.json({
            success: true,
            message: 'Reset mật khẩu thành công',
            data: {
                newPassword
            }
        });

    } catch (error) {
        console.error('Reset user password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi reset mật khẩu'
        });
    }
};

const updateUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { userGroups, individualPermissions } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
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
            user.userGroups = userGroups;
        }

        if (individualPermissions) {
            user.individualPermissions = individualPermissions;
        }

        user.updatedBy = req.user.id;
        await user.save();

        await user.populate('userGroups', 'name code');

        res.json({
            success: true,
            message: 'Cập nhật quyền truy cập thành công',
            data: {
                userGroups: user.userGroups,
                individualPermissions: user.individualPermissions
            }
        });

    } catch (error) {
        console.error('Update user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật quyền truy cập'
        });
    }
};

const searchUsers = async (req, res) => {
    try {
        const {
            keyword,
            facultyId,
            departmentId,
            position,
            hasSignature,
            limit = 20
        } = req.query;

        if (!keyword || keyword.trim().length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        let query = {
            status: 'active',
            $or: [
                { fullName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phoneNumber: { $regex: keyword, $options: 'i' } }
            ]
        };

        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;
        if (hasSignature !== undefined) {
            query['digitalSignature.isActive'] = hasSignature === 'true';
        }
        if (position) {
            query['positions.title'] = position;
            query['positions.isActive'] = true;
        }

        const users = await User.find(query)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .select('fullName email phoneNumber role facultyId departmentId positions digitalSignature.isActive')
            .limit(parseInt(limit))
            .sort({ fullName: 1 });

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm người dùng'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    addPosition,
    removePosition,
    updateDigitalSignature,
    getUserStatistics,
    resetUserPassword,
    updateUserPermissions,
    searchUsers
};