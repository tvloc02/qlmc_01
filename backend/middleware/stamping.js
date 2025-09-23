const Evidence = require('../models/Evidence');
const File = require('../models/File');

// Check stamping permissions
const checkStampingPermission = (req, res, next) => {
    const userRole = req.user.role;

    // Only admin and manager can perform stamping
    if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin và manager mới có quyền đóng dấu'
        });
    }

    next();
};

// Validate stamping request
const validateStampingRequest = async (req, res, next) => {
    try {
        const { documentId, stampType, position, stampText } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID tài liệu'
            });
        }

        // Check if document exists
        const evidence = await Evidence.findById(documentId).populate('files');
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Tài liệu không tồn tại'
            });
        }

        // Check if document has files
        if (!evidence.files || evidence.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tài liệu chưa có file để đóng dấu'
            });
        }

        // Check if user has access to this document
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền đóng dấu tài liệu này'
            });
        }

        // Validate stamp type
        const validStampTypes = ['official', 'approval', 'reviewed', 'certified', 'custom'];
        if (!stampType || !validStampTypes.includes(stampType)) {
            return res.status(400).json({
                success: false,
                message: `Loại dấu không hợp lệ. Chỉ chấp nhận: ${validStampTypes.join(', ')}`
            });
        }

        // Validate position if provided
        if (position) {
            const { x, y, page } = position;
            if (typeof x !== 'number' || typeof y !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Vị trí đóng dấu không hợp lệ'
                });
            }
            if (page && (typeof page !== 'number' || page < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'Số trang không hợp lệ'
                });
            }
        }

        // Validate stamp text for custom stamps
        if (stampType === 'custom') {
            if (!stampText || stampText.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần nhập nội dung dấu cho loại dấu tùy chỉnh'
                });
            }
            if (stampText.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: 'Nội dung dấu không được quá 200 ký tự'
                });
            }
        }

        // Check if files are suitable for stamping
        const supportedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const unsupportedFiles = evidence.files.filter(file =>
            !supportedMimeTypes.includes(file.mimeType)
        );

        if (unsupportedFiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Một số file không hỗ trợ đóng dấu: ${unsupportedFiles.map(f => f.originalName).join(', ')}`
            });
        }

        req.evidence = evidence;
        next();

    } catch (error) {
        console.error('Validate stamping request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực yêu cầu đóng dấu'
        });
    }
};

// Validate bulk stamping request
const validateBulkStampingRequest = async (req, res, next) => {
    try {
        const { documentIds, stampType, stampText } = req.body;

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách tài liệu không hợp lệ'
            });
        }

        if (documentIds.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đóng dấu quá 20 tài liệu cùng lúc'
            });
        }

        // Check if all documents exist and user has access
        const evidences = await Evidence.find({ _id: { $in: documentIds } })
            .populate('files');

        if (evidences.length !== documentIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số tài liệu không tồn tại'
            });
        }

        // Validate each document
        for (const evidence of evidences) {
            // Check user access
            if (req.user.role !== 'admin' &&
                !req.user.hasStandardAccess(evidence.standardId) &&
                !req.user.hasCriteriaAccess(evidence.criteriaId)) {
                return res.status(403).json({
                    success: false,
                    message: `Không có quyền đóng dấu tài liệu ${evidence.code}`
                });
            }

            // Check if has files
            if (!evidence.files || evidence.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Tài liệu ${evidence.code} chưa có file để đóng dấu`
                });
            }
        }

        // Validate stamp type
        const validStampTypes = ['official', 'approval', 'reviewed', 'certified', 'custom'];
        if (!stampType || !validStampTypes.includes(stampType)) {
            return res.status(400).json({
                success: false,
                message: `Loại dấu không hợp lệ. Chỉ chấp nhận: ${validStampTypes.join(', ')}`
            });
        }

        // Validate stamp text for custom stamps
        if (stampType === 'custom') {
            if (!stampText || stampText.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần nhập nội dung dấu cho loại dấu tùy chỉnh'
                });
            }
        }

        req.evidences = evidences;
        next();

    } catch (error) {
        console.error('Validate bulk stamping request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực yêu cầu đóng dấu hàng loạt'
        });
    }
};

// Rate limiting for stamping operations
const stampingRateLimit = (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute
    const maxRequests = 5; // Max 5 stamping operations per minute

    // In production, this should use Redis or similar
    if (!global.stampingRateLimit) {
        global.stampingRateLimit = new Map();
    }

    const userRequests = global.stampingRateLimit.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < timeWindow);

    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Quá nhiều yêu cầu đóng dấu. Vui lòng thử lại sau 1 phút'
        });
    }

    recentRequests.push(now);
    global.stampingRateLimit.set(userId, recentRequests);

    next();
};

// Check file stamping status
const checkStampingStatus = async (req, res, next) => {
    try {
        const evidence = req.evidence;

        // Check if any files are already stamped
        const stampedFiles = evidence.files.filter(file =>
            file.metadata && file.metadata.stamped === true
        );

        if (stampedFiles.length > 0) {
            // Allow re-stamping but warn user
            req.hasStampedFiles = true;
            req.stampedFileCount = stampedFiles.length;
        }

        next();

    } catch (error) {
        console.error('Check stamping status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi kiểm tra trạng thái đóng dấu'
        });
    }
};

// Validate stamp template
const validateStampTemplate = (req, res, next) => {
    const { stampTemplate } = req.body;

    if (!stampTemplate) {
        return next(); // Use default template
    }

    const { width, height, fontSize, fontFamily, color, borderWidth } = stampTemplate;

    // Validate dimensions
    if (width && (typeof width !== 'number' || width < 50 || width > 500)) {
        return res.status(400).json({
            success: false,
            message: 'Chiều rộng dấu phải từ 50-500 pixels'
        });
    }

    if (height && (typeof height !== 'number' || height < 30 || height > 300)) {
        return res.status(400).json({
            success: false,
            message: 'Chiều cao dấu phải từ 30-300 pixels'
        });
    }

    // Validate font size
    if (fontSize && (typeof fontSize !== 'number' || fontSize < 8 || fontSize > 72)) {
        return res.status(400).json({
            success: false,
            message: 'Kích thước font phải từ 8-72'
        });
    }

    // Validate font family
    const validFonts = ['Arial', 'Times New Roman', 'Helvetica', 'Calibri', 'Verdana'];
    if (fontFamily && !validFonts.includes(fontFamily)) {
        return res.status(400).json({
            success: false,
            message: `Font không hợp lệ. Chỉ chấp nhận: ${validFonts.join(', ')}`
        });
    }

    // Validate color (hex format)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
        return res.status(400).json({
            success: false,
            message: 'Màu sắc phải có định dạng hex (VD: #FF0000)'
        });
    }

    // Validate border width
    if (borderWidth && (typeof borderWidth !== 'number' || borderWidth < 0 || borderWidth > 10)) {
        return res.status(400).json({
            success: false,
            message: 'Độ dày viền phải từ 0-10 pixels'
        });
    }

    next();
};

// Log stamping activity
const logStampingActivity = (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
        // Log the stamping attempt
        const logData = {
            userId: req.user.id,
            documentId: req.body.documentId || req.body.documentIds,
            stampType: req.body.stampType,
            timestamp: new Date(),
            success: res.statusCode < 400,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        // In production, this should be logged to a proper logging system
        console.log('Stamping attempt:', logData);

        originalSend.call(this, data);
    };

    next();
};

// Check stamp preview request
const validateStampPreview = (req, res, next) => {
    const { stampType, stampText, stampTemplate } = req.body;

    if (!stampType) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu loại dấu'
        });
    }

    const validStampTypes = ['official', 'approval', 'reviewed', 'certified', 'custom'];
    if (!validStampTypes.includes(stampType)) {
        return res.status(400).json({
            success: false,
            message: `Loại dấu không hợp lệ. Chỉ chấp nhận: ${validStampTypes.join(', ')}`
        });
    }

    if (stampType === 'custom' && (!stampText || stampText.trim().length === 0)) {
        return res.status(400).json({
            success: false,
            message: 'Cần nhập nội dung dấu cho loại dấu tùy chỉnh'
        });
    }

    next();
};

module.exports = {
    checkStampingPermission,
    validateStampingRequest,
    validateBulkStampingRequest,
    stampingRateLimit,
    checkStampingStatus,
    validateStampTemplate,
    logStampingActivity,
    validateStampPreview
};