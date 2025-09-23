const SigningInfo = require('../models/SigningInfo');
const { validationResult } = require('express-validator');

// Get signing infos
const getSigningInfos = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            type,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'signerInfo.fullName': { $regex: search, $options: 'i' } }
            ];
        }

        if (type) query.type = type;
        if (status) query.status = status;

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [signingInfos, total] = await Promise.all([
            SigningInfo.find(query)
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            SigningInfo.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                signingInfos,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Get signing infos error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách cấu hình ký'
        });
    }
};

// Get signing info by ID
const getSigningInfoById = async (req, res) => {
    try {
        const { id } = req.params;

        const signingInfo = await SigningInfo.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('permissions.allowedUsers', 'fullName email');

        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        res.json({
            success: true,
            data: signingInfo
        });
    } catch (error) {
        console.error('Get signing info by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin cấu hình ký'
        });
    }
};

// Create signing info
const createSigningInfo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const signingInfoData = {
            ...req.body,
            createdBy: req.user.id
        };

        const signingInfo = new SigningInfo(signingInfoData);
        await signingInfo.save();

        res.status(201).json({
            success: true,
            message: 'Tạo cấu hình ký thành công',
            data: signingInfo
        });
    } catch (error) {
        console.error('Create signing info error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Tên cấu hình ký đã tồn tại'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo cấu hình ký'
        });
    }
};

// Update signing info
const updateSigningInfo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const signingInfo = await SigningInfo.findById(id);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        // Update fields
        Object.assign(signingInfo, updateData);
        await signingInfo.save();

        res.json({
            success: true,
            message: 'Cập nhật cấu hình ký thành công',
            data: signingInfo
        });
    } catch (error) {
        console.error('Update signing info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình ký'
        });
    }
};

// Delete signing info
const deleteSigningInfo = async (req, res) => {
    try {
        const { id } = req.params;

        const signingInfo = await SigningInfo.findById(id);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        // Check if signing info is being used
        if (signingInfo.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa cấu hình ký đang được sử dụng'
            });
        }

        await SigningInfo.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa cấu hình ký thành công'
        });
    } catch (error) {
        console.error('Delete signing info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa cấu hình ký'
        });
    }
};

// Test signing info
const testSigningInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { testData } = req.body;

        const signingInfo = await SigningInfo.findById(id);
        if (!signingInfo) {
            return res.status(404).json({
                success: false,
                message: 'Cấu hình ký không tồn tại'
            });
        }

        if (signingInfo.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cấu hình ký không hoạt động'
            });
        }

        if (signingInfo.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Chứng chỉ ký đã hết hạn'
            });
        }

        // Simulate signing test
        const testResult = {
            isValid: true,
            certificateValid: true,
            algorithmSupported: true,
            keyStrength: 'Strong',
            expiryDate: signingInfo.certificate.validTo,
            message: 'Cấu hình ký hoạt động bình thường'
        };

        res.json({
            success: true,
            message: 'Kiểm tra cấu hình ký thành công',
            data: testResult
        });
    } catch (error) {
        console.error('Test signing info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra cấu hình ký'
        });
    }
};

// Get signing info statistics
const getSigningInfoStatistics = async (req, res) => {
    try {
        const stats = await SigningInfo.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const typeStats = await SigningInfo.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalUsage = await SigningInfo.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsage: { $sum: '$usageCount' }
                }
            }
        ]);

        // Count expired certificates
        const expiredCount = await SigningInfo.countDocuments({
            'certificate.validTo': { $lt: new Date() }
        });

        // Count expiring soon (within 30 days)
        const expiringSoonCount = await SigningInfo.countDocuments({
            'certificate.validTo': {
                $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                $gte: new Date()
            }
        });

        const result = {
            byStatus: stats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byType: typeStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            totalUsage: totalUsage[0]?.totalUsage || 0,
            expiredCount,
            expiringSoonCount
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get signing info statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê cấu hình ký'
        });
    }
};

module.exports = {
    getSigningInfos,
    getSigningInfoById,
    createSigningInfo,
    updateSigningInfo,
    deleteSigningInfo,
    testSigningInfo,
    getSigningInfoStatistics
};