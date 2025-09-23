const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// ✅ Fixed: Import correct middleware name
const { protect } = require('../middleware/auth');

// ✅ Fixed: Add register function to imports
const {
    login,
    logout,
    register, // ✅ Added: This function exists in fixed authController
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile
} = require('../controllers/authController');

// ✅ Fixed: Create validation middleware inline instead of external dependency
const validation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Validation rules
const validateLogin = [
    body('email')
        .notEmpty()
        .withMessage('Email là bắt buộc')
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail()
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu là bắt buộc')
        .isLength({ min: 1 })
        .withMessage('Mật khẩu không được để trống')
];

const validateRegister = [
    body('email')
        .notEmpty()
        .withMessage('Email là bắt buộc')
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail()
        .trim(),
    body('fullName')
        .notEmpty()
        .withMessage('Họ tên là bắt buộc')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải có từ 2 đến 100 ký tự'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('role')
        .optional()
        .isIn(['admin', 'manager', 'staff', 'expert'])
        .withMessage('Vai trò không hợp lệ')
];

const validateForgotPassword = [
    body('email')
        .notEmpty()
        .withMessage('Email là bắt buộc')
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail()
        .trim()
];

const validateResetPassword = [
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
        .optional({ nullable: false, checkFalsy: true })
];

const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
            }
            return true;
        })
];

const validateUpdateProfile = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải có từ 2 đến 100 ký tự'),
    body('phoneNumber')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại phải có 10-11 chữ số'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Tên phòng ban không được quá 200 ký tự'),
    body('position')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Chức vụ không được quá 100 ký tự')
];

// =====================================
// PUBLIC ROUTES (No authentication required)
// =====================================

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', validateLogin, validation, login);

/**
 * @route   POST /api/auth/register
 * @desc    User registration
 * @access  Public
 */
router.post('/register', validateRegister, validation, register);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', validateForgotPassword, validation, forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', validateResetPassword, validation, resetPassword);

// =====================================
// PROTECTED ROUTES (Authentication required)
// =====================================

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', protect, validateChangePassword, validation, changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, validateUpdateProfile, validation, updateProfile);

// =====================================
// HEALTH CHECK ROUTE
// =====================================

/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth routes
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes are working',
        timestamp: new Date().toISOString(),
        routes: {
            public: ['POST /login', 'POST /register', 'POST /forgot-password', 'POST /reset-password/:token'],
            protected: ['POST /logout', 'GET /me', 'PUT /profile', 'PUT /change-password']
        }
    });
});

// =====================================
// ERROR HANDLING FOR MISSING FUNCTIONS
// =====================================

// Check if all required functions exist
const requiredFunctions = [
    'login', 'logout', 'register', 'forgotPassword',
    'resetPassword', 'changePassword', 'getCurrentUser', 'updateProfile'
];

const authController = require('../controllers/authController');
const missingFunctions = requiredFunctions.filter(func => typeof authController[func] !== 'function');

if (missingFunctions.length > 0) {
    console.error('❌ Missing functions in authController:', missingFunctions);
    console.error('Available functions:', Object.keys(authController).filter(key => typeof authController[key] === 'function'));

    // Create placeholder routes for missing functions to prevent crashes
    missingFunctions.forEach(funcName => {
        const routePath = `/${funcName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        router.all(routePath, (req, res) => {
            res.status(501).json({
                success: false,
                message: `Function ${funcName} is not implemented yet`,
                error: 'NOT_IMPLEMENTED'
            });
        });
    });
} else {
    console.log('✅ All required authController functions are available');
}

// Thêm vào cuối file auth.js (routes)

/**
 * @route   GET /api/auth/debug-users
 * @desc    Debug: Show all users (REMOVE IN PRODUCTION)
 * @access  Public
 */
router.get('/debug-users', async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({})
            .select('email fullName role status password') // Bao gồm cả password hash để debug
            .limit(10);

        res.json({
            success: true,
            count: users.length,
            data: users.map(user => ({
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                hasPassword: !!user.password,
                passwordLength: user.password ? user.password.length : 0,
                passwordHash: user.password ? user.password.substring(0, 20) + '...' : null
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;