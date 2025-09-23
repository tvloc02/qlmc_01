const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const UserGroup = require('../models/UserGroup');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        console.log('🔑 LOGIN DEBUG:');
        console.log('Input email:', email);
        console.log('Remember me:', rememberMe);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        const user = await User.findByEmailOrUsername(email);

        console.log('Found user:', user ? user.email : 'NOT FOUND');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        console.log('User details:', {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            hasPassword: !!user.password
        });

        const isPasswordValid = await user.comparePassword(password);
        console.log('Password verification:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const tokenExpiry = rememberMe ? '30d' : '1d';
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: tokenExpiry }
        );

        await user.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'userGroups', select: 'name code permissions' },
            { path: 'positions.department', select: 'name code' }
        ]);

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        console.log('✅ Login successful for:', user.email);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse,
                tokenExpiry: rememberMe ? '30 ngày' : '1 ngày'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng nhập'
        });
    }
};

const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng xuất'
        });
    }
};

const register = async (req, res) => {
    try {
        const {
            email,
            fullName,
            password,
            phoneNumber,
            facultyId,
            departmentId,
            role = 'staff',
            positions
        } = req.body;

        if (!email || !fullName || !password || !facultyId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        const existingUser = await User.findByEmailOrUsername(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        const Faculty = require('../models/Faculty');
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(400).json({
                success: false,
                message: 'Khoa không tồn tại'
            });
        }

        if (departmentId) {
            const Department = require('../models/Department');
            const department = await Department.findById(departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn không tồn tại'
                });
            }
        }

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
            email: email.toLowerCase().trim(),
            fullName: fullName.trim(),
            password,
            phoneNumber: phoneNumber?.trim(),
            facultyId,
            departmentId,
            role,
            positions: positionsData,
            status: 'pending'
        });

        await user.save();

        const token = generateToken(user._id);

        await user.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'positions.department', select: 'name code' }
        ]);

        const userResponse = user.toObject();

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công. Tài khoản đang chờ kích hoạt.',
            data: {
                token,
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng ký'
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const user = await User.findByEmailOrUsername(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        console.log('🔗 Password Reset URL:', resetUrl);
        console.log('📧 Send this URL to:', user.email);

        res.json({
            success: true,
            message: 'Hướng dẫn thay đổi mật khẩu đã được gửi về email của bạn',
            ...(process.env.NODE_ENV === 'development' && { resetUrl })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xử lý quên mật khẩu'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi reset mật khẩu'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thay đổi mật khẩu'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .populate('userGroups', 'name code permissions signingPermissions')
            .populate('positions.department', 'name code')
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        let effectivePermissions = {};

        if (user.userGroups && user.userGroups.length > 0) {
            user.userGroups.forEach(group => {
                if (group.permissions) {
                    group.permissions.forEach(perm => {
                        if (!effectivePermissions[perm.module]) {
                            effectivePermissions[perm.module] = {
                                view: false,
                                create: false,
                                edit: false,
                                delete: false
                            };
                        }

                        Object.keys(perm.actions).forEach(action => {
                            if (perm.actions[action]) {
                                effectivePermissions[perm.module][action] = true;
                            }
                        });
                    });
                }
            });
        }

        if (user.individualPermissions && user.individualPermissions.length > 0) {
            user.individualPermissions.forEach(perm => {
                if (!effectivePermissions[perm.module]) {
                    effectivePermissions[perm.module] = {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false
                    };
                }

                Object.keys(perm.actions).forEach(action => {
                    effectivePermissions[perm.module][action] = perm.actions[action];
                });
            });
        }

        const userResponse = user.toObject();
        userResponse.effectivePermissions = effectivePermissions;

        res.json({
            success: true,
            data: userResponse
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullName,
            phoneNumber,
            specializations,
            preferences
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (fullName) user.fullName = fullName.trim();
        if (phoneNumber) user.phoneNumber = phoneNumber.trim();
        if (specializations) user.specializations = specializations;
        if (preferences) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }

        await user.save();

        const updatedUser = user.toObject();

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật thông tin'
        });
    }
};

const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token không được cung cấp'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
            const user = await User.findById(decoded.userId)
                .select('-password -resetPasswordToken -resetPasswordExpires');

            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ'
                });
            }

            res.json({
                success: true,
                message: 'Token hợp lệ',
                data: { user }
            });

        } catch (tokenError) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực token'
        });
    }
};

const resetAdminPassword = async (req, res) => {
    try {
        console.log('🔧 Resetting admin password...');

        const admin = await User.findByEmailOrUsername('admin@cmc.edu.vn');
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        console.log('Found admin:', admin.email);

        admin.password = 'admin123';
        await admin.save();

        console.log('✅ Admin password reset to: admin123');

        res.json({
            success: true,
            message: 'Admin password reset successfully',
            data: {
                email: admin.email,
                newPassword: 'admin123'
            }
        });

    } catch (error) {
        console.error('Reset admin password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting admin password'
        });
    }
};

module.exports = {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile,
    verifyToken,
    resetAdminPassword
};