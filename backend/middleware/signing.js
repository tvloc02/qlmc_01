const SigningInfo = require('../models/SigningInfo');
const Evidence = require('../models/Evidence');

// Check if user has signing permissions
const checkSigningPermission = async (req, res, next) => {
    try {
        const { signingInfoId } = req.body;
        const userId = req.user.id;

        if (!signingInfoId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin cấu hình ký'
            });
        }

        const signingInfo = await SigningInfo.findById(signingInfoId);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        if (signingInfo.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Cấu hình ký không hoạt động'
            });
        }

        // Check certificate expiry
        if (signingInfo.isExpired()) {
            return res.status(403).json({
                success: false,
                message: 'Chứng chỉ ký đã hết hạn'
            });
        }

        // Check user permissions
        const hasPermission = checkUserSigningPermission(userId, req.user.role, signingInfo);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền sử dụng cấu hình ký này'
            });
        }

        req.signingInfo = signingInfo;
        next();

    } catch (error) {
        console.error('Check signing permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi kiểm tra quyền ký'
        });
    }
};

// Validate signing request
const validateSigningRequest = async (req, res, next) => {
    try {
        const { documentId, password, reason } = req.body;
        const signingInfo = req.signingInfo;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID tài liệu'
            });
        }

        // Check if document exists and user has access
        const evidence = await Evidence.findById(documentId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Tài liệu không tồn tại'
            });
        }

        // Check user access to evidence
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền ký tài liệu này'
            });
        }

        // Check if document can be signed
        if (evidence.status === 'signed') {
            return res.status(400).json({
                success: false,
                message: 'Tài liệu đã được ký'
            });
        }

        if (evidence.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tài liệu chưa có file để ký'
            });
        }

        // Validate password if required
        if (signingInfo.security.requirePassword && !password) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập mật khẩu ký'
            });
        }

        // Validate reason length
        if (reason && reason.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Lý do ký không được quá 500 ký tự'
            });
        }

        req.evidence = evidence;
        next();

    } catch (error) {
        console.error('Validate signing request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực yêu cầu ký'
        });
    }
};

// Check bulk signing request
const validateBulkSigningRequest = async (req, res, next) => {
    try {
        const { documentIds, signingInfoId, password } = req.body;

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách tài liệu không hợp lệ'
            });
        }

        if (documentIds.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Không thể ký quá 50 tài liệu cùng lúc'
            });
        }

        // Check if all documents exist and user has access
        const evidences = await Evidence.find({ _id: { $in: documentIds } });

        if (evidences.length !== documentIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số tài liệu không tồn tại'
            });
        }

        // Check access to all evidences
        for (const evidence of evidences) {
            if (req.user.role !== 'admin' &&
                !req.user.hasStandardAccess(evidence.standardId) &&
                !req.user.hasCriteriaAccess(evidence.criteriaId)) {
                return res.status(403).json({
                    success: false,
                    message: `Không có quyền ký tài liệu ${evidence.code}`
                });
            }

            if (evidence.status === 'signed') {
                return res.status(400).json({
                    success: false,
                    message: `Tài liệu ${evidence.code} đã được ký`
                });
            }

            if (evidence.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Tài liệu ${evidence.code} chưa có file để ký`
                });
            }
        }

        req.evidences = evidences;
        next();

    } catch (error) {
        console.error('Validate bulk signing request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực yêu cầu ký hàng loạt'
        });
    }
};

// Rate limiting for signing operations
const signingRateLimit = (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute
    const maxRequests = 10; // Max 10 signing operations per minute

    // In production, this should use Redis or similar
    if (!global.signingRateLimit) {
        global.signingRateLimit = new Map();
    }

    const userRequests = global.signingRateLimit.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < timeWindow);

    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Quá nhiều yêu cầu ký. Vui lòng thử lại sau 1 phút'
        });
    }

    recentRequests.push(now);
    global.signingRateLimit.set(userId, recentRequests);

    next();
};

// Log signing attempt
const logSigningAttempt = (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
        // Log the signing attempt
        const logData = {
            userId: req.user.id,
            documentId: req.body.documentId || req.body.documentIds,
            signingInfoId: req.body.signingInfoId,
            timestamp: new Date(),
            success: res.statusCode < 400,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        // In production, this should be logged to a proper logging system
        console.log('Signing attempt:', logData);

        originalSend.call(this, data);
    };

    next();
};

// Validate OTP if required
const validateOTP = async (req, res, next) => {
    try {
        const { otpCode } = req.body;
        const signingInfo = req.signingInfo;

        if (!signingInfo.security.requireOTP) {
            return next();
        }

        if (!otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập mã OTP'
            });
        }

        // Validate OTP code
        const isValidOTP = await validateOTPCode(req.user.id, otpCode);
        if (!isValidOTP) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
            });
        }

        next();

    } catch (error) {
        console.error('Validate OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực OTP'
        });
    }
};

// Helper function to check user signing permission
const checkUserSigningPermission = (userId, userRole, signingInfo) => {
    // Check if user is in allowed users list
    if (signingInfo.permissions.allowedUsers.length > 0) {
        if (!signingInfo.permissions.allowedUsers.some(id => id.toString() === userId.toString())) {
            return false;
        }
    }

    // Check if user role is allowed
    if (signingInfo.permissions.allowedRoles.length > 0) {
        if (!signingInfo.permissions.allowedRoles.includes(userRole)) {
            return false;
        }
    }

    return true;
};

// Helper function to validate OTP code
const validateOTPCode = async (userId, otpCode) => {
    try {
        // In production, this would check against stored OTP in Redis/Database
        // For demo purposes, accept any 6-digit code
        return /^\d{6}$/.test(otpCode);
    } catch (error) {
        console.error('Validate OTP code error:', error);
        return false;
    }
};

module.exports = {
    checkSigningPermission,
    validateSigningRequest,
    validateBulkSigningRequest,
    signingRateLimit,
    logSigningAttempt,
    validateOTP
};