const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập. Vui lòng đăng nhập'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

            const user = await User.findById(decoded.userId)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code')
                .populate('userGroups', 'name code permissions signingPermissions')
                .populate('positions.department', 'name code')
                .select('-password -resetPasswordToken -resetPasswordExpires');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ. Người dùng không tồn tại'
                });
            }

            if (user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
                });
            }

            const effectivePermissions = calculateEffectivePermissions(user);

            req.user = {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                facultyId: user.facultyId,
                departmentId: user.departmentId,
                positions: user.positions,
                activePositions: user.activePositions,
                mainPosition: user.mainPosition,
                userGroups: user.userGroups,
                hasDigitalSignature: user.hasDigitalSignature,
                canSignDocuments: user.canSignDocuments(),
                effectivePermissions,
                hasPermission: (module, action) => checkPermission(effectivePermissions, module, action),
                hasAnyPermission: (module) => hasAnyModulePermission(effectivePermissions, module),
                canAccessModule: (module) => canAccessModule(effectivePermissions, module),
                isInFaculty: (facultyId) => user.facultyId && user.facultyId._id.toString() === facultyId,
                isInDepartment: (departmentId) => user.departmentId && user.departmentId._id.toString() === departmentId,
                hasPosition: (position) => user.activePositions.some(p => p.title === position)
            };

            next();

        } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống xác thực'
        });
    }
};

const calculateEffectivePermissions = (user) => {
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

    return effectivePermissions;
};

const checkPermission = (permissions, module, action) => {
    return permissions[module] && permissions[module][action] === true;
};

const hasAnyModulePermission = (permissions, module) => {
    if (!permissions[module]) return false;
    return Object.values(permissions[module]).some(Boolean);
};

const canAccessModule = (permissions, module) => {
    return permissions[module] && permissions[module].view === true;
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Vai trò ${req.user.role} không có quyền truy cập tài nguyên này`
            });
        }

        next();
    };
};

const requirePermission = (module, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.hasPermission(module, action)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền ${action} trong module ${module}`
            });
        }

        next();
    };
};

const requireModuleAccess = (module) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.canAccessModule(module)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền truy cập module ${module}`
            });
        }

        next();
    };
};

const requirePosition = (...positions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        const hasRequiredPosition = positions.some(position => req.user.hasPosition(position));

        if (!hasRequiredPosition) {
            return res.status(403).json({
                success: false,
                message: `Chức vụ của bạn không có quyền thực hiện thao tác này`
            });
        }

        next();
    };
};

const requireFacultyAccess = (req, res, next) => {
    try {
        const { facultyId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.isInFaculty(facultyId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập khoa này'
            });
        }

        next();
    } catch (error) {
        console.error('Faculty access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
};

const requireDepartmentAccess = (req, res, next) => {
    try {
        const { departmentId } = req.params;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.isInDepartment(departmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập bộ môn này'
            });
        }

        next();
    } catch (error) {
        console.error('Department access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống kiểm tra quyền truy cập'
        });
    }
};

const requireSigningPermission = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Không có quyền truy cập'
        });
    }

    if (!req.user.canSignDocuments) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền ký tài liệu'
        });
    }

    const hasSigningPermission = req.user.userGroups.some(group =>
        group.signingPermissions && group.signingPermissions.canSign
    );

    if (!hasSigningPermission) {
        return res.status(403).json({
            success: false,
            message: 'Nhóm của bạn không có quyền ký tài liệu'
        });
    }

    next();
};

const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
                const user = await User.findById(decoded.userId)
                    .populate('facultyId', 'name code')
                    .populate('departmentId', 'name code')
                    .populate('userGroups', 'name code permissions')
                    .select('-password -resetPasswordToken -resetPasswordExpires');

                if (user && user.status === 'active') {
                    const effectivePermissions = calculateEffectivePermissions(user);

                    req.user = {
                        id: user._id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        effectivePermissions,
                        hasPermission: (module, action) => checkPermission(effectivePermissions, module, action)
                    };
                }
            } catch (tokenError) {
                console.log('Optional auth: Invalid token, continuing without user');
            }
        }

        next();
    } catch (error) {
        next();
    }
};

const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        const userRequests = requests.get(userId) || [];

        const recentRequests = userRequests.filter(time => time > windowStart);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau'
            });
        }

        recentRequests.push(now);
        requests.set(userId, recentRequests);

        if (Math.random() < 0.01) {
            for (const [userId, times] of requests.entries()) {
                const filtered = times.filter(time => time > windowStart);
                if (filtered.length === 0) {
                    requests.delete(userId);
                } else {
                    requests.set(userId, filtered);
                }
            }
        }

        next();
    };
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
    }
    next();
};

const requireManagerOrAdmin = (req, res, next) => {
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin hoặc manager mới có quyền truy cập'
        });
    }
    next();
};

const requireOwnershipOrAdmin = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        const resourceUserId = req.params[userIdField] || req.body[userIdField];

        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Bạn chỉ có thể truy cập tài nguyên của chính mình'
        });
    };
};

module.exports = {
    protect,
    authorize,
    requirePermission,
    requireModuleAccess,
    requirePosition,
    requireFacultyAccess,
    requireDepartmentAccess,
    requireSigningPermission,
    optionalAuth,
    userRateLimit,
    requireAdmin,
    requireManagerOrAdmin,
    requireOwnershipOrAdmin,
    checkStandardAccess: requireModuleAccess,
    checkCriteriaAccess: requireModuleAccess
};