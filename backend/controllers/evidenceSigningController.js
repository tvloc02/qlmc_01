const signingService = require('../services/signingService');
const SigningInfo = require('../models/SigningInfo');

const signDocument = async (req, res) => {
    try {
        const { documentId, signingInfoId, password, reason } = req.body;
        const userId = req.user.id;

        const result = await signingService.signDocument(
            documentId,
            signingInfoId,
            userId,
            password,
            reason
        );

        res.json(result);

    } catch (error) {
        console.error('Sign document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi ký tài liệu'
        });
    }
};

const bulkSignDocuments = async (req, res) => {
    try {
        const { documentIds, signingInfoId, password, reason } = req.body;
        const userId = req.user.id;

        const result = await signingService.bulkSignDocuments(
            documentIds,
            signingInfoId,
            userId,
            password,
            reason
        );

        res.json(result);

    } catch (error) {
        console.error('Bulk sign documents error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi ký hàng loạt tài liệu'
        });
    }
};

const verifySignature = async (req, res) => {
    try {
        const { fileId } = req.params;

        const result = await signingService.verifySignature(fileId);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Verify signature error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực chữ ký'
        });
    }
};

const getSigningHistory = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            page = 1,
            limit = 50
        } = req.query;

        const userId = req.params.userId || req.user.id;

        // Check permissions
        if (userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem lịch sử ký của người dùng khác'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const history = await signingService.getSigningHistory(userId, {
            startDate,
            endDate,
            status,
            limit: limitNum,
            skip
        });

        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    current: pageNum,
                    total: history.length,
                    hasNext: history.length === limitNum,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get signing history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy lịch sử ký'
        });
    }
};

const getAvailableSigningConfigs = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = { status: 'active' };

        // Filter by user permissions
        if (userRole !== 'admin') {
            query.$or = [
                { 'permissions.allowedUsers': userId },
                { 'permissions.allowedRoles': userRole },
                { 'permissions.allowedUsers': { $size: 0 }, 'permissions.allowedRoles': { $size: 0 } }
            ];
        }

        const signingConfigs = await SigningInfo.find(query)
            .select('name type signerInfo.fullName certificate.validTo')
            .sort({ name: 1 });

        // Filter out expired certificates
        const validConfigs = signingConfigs.filter(config => !config.isExpired());

        res.json({
            success: true,
            data: validConfigs
        });

    } catch (error) {
        console.error('Get available signing configs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách cấu hình ký'
        });
    }
};

const previewSignature = async (req, res) => {
    try {
        const { signingInfoId } = req.body;

        const signingInfo = await SigningInfo.findById(signingInfoId);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        // Check permissions
        if (!signingService.canUserSign(req.user.id, signingInfo)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền sử dụng cấu hình ký này'
            });
        }

        // Generate preview
        const preview = {
            signerName: signingInfo.signerInfo.fullName,
            position: signingInfo.signerInfo.position,
            organization: signingInfo.signerInfo.organization,
            certificateIssuer: signingInfo.certificate.issuer,
            validFrom: signingInfo.certificate.validFrom,
            validTo: signingInfo.certificate.validTo,
            template: signingInfo.template
        };

        res.json({
            success: true,
            data: preview
        });

    } catch (error) {
        console.error('Preview signature error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xem trước chữ ký'
        });
    }
};

const getSigningStatistics = async (req, res) => {
    try {
        // Only admin and manager can view statistics
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem thống kê ký'
            });
        }

        const { startDate, endDate, userId } = req.query;

        let matchQuery = {};
        if (startDate || endDate) {
            matchQuery.timestamp = {};
            if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
            if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
        }
        if (userId) matchQuery.userId = mongoose.Types.ObjectId(userId);

        const History = require('../models/History');

        const stats = await History.aggregate([
            {
                $match: {
                    action: 'sign',
                    module: 'evidence',
                    ...matchQuery
                }
            },
            {
                $group: {
                    _id: null,
                    totalSigning: { $sum: 1 },
                    successfulSigning: {
                        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                    },
                    failedSigning: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            }
        ]);

        const result = stats[0] || {
            totalSigning: 0,
            successfulSigning: 0,
            failedSigning: 0,
            uniqueUsers: []
        };

        result.uniqueUserCount = result.uniqueUsers ? result.uniqueUsers.length : 0;
        delete result.uniqueUsers;

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get signing statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê ký'
        });
    }
};

const validateSigningRequest = async (req, res) => {
    try {
        const { documentId, signingInfoId } = req.body;

        // Validate document
        const Evidence = require('../models/Evidence');
        const evidence = await Evidence.findById(documentId).populate('files');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Tài liệu không tồn tại'
            });
        }

        if (evidence.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tài liệu chưa có file để ký'
            });
        }

        // Validate signing config
        const signingInfo = await SigningInfo.findById(signingInfoId);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        if (signingInfo.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Chứng chỉ ký đã hết hạn'
            });
        }

        // Check permissions
        if (!signingService.canUserSign(req.user.id, signingInfo)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền sử dụng cấu hình ký này'
            });
        }

        res.json({
            success: true,
            message: 'Yêu cầu ký hợp lệ',
            data: {
                documentCode: evidence.code,
                documentName: evidence.name,
                fileCount: evidence.files.length,
                signerName: signingInfo.signerInfo.fullName,
                requirePassword: signingInfo.security.requirePassword,
                requireOTP: signingInfo.security.requireOTP
            }
        });

    } catch (error) {
        console.error('Validate signing request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xác thực yêu cầu ký'
        });
    }
};

module.exports = {
    signDocument,
    bulkSignDocuments,
    verifySignature,
    getSigningHistory,
    getAvailableSigningConfigs,
    previewSignature,
    getSigningStatistics,
    validateSigningRequest
};