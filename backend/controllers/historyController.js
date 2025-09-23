const historyService = require('../services/historyService');

const getUserHistory = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            action,
            module,
            status,
            page = 1,
            limit = 50
        } = req.query;

        const userId = req.params.userId || req.user.id;

        // Check permissions - users can only view their own history unless admin/manager
        if (userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem lịch sử của người dùng khác'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const result = await historyService.getUserActivityHistory(userId, {
            startDate,
            endDate,
            action: action ? action.split(',') : undefined,
            module: module ? module.split(',') : undefined,
            status,
            limit: limitNum,
            skip
        });

        res.json({
            success: true,
            data: {
                ...result.data,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(result.data.total / limitNum),
                    total: result.data.total,
                    hasNext: result.data.hasMore,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy lịch sử người dùng'
        });
    }
};

const getSystemHistory = async (req, res) => {
    try {
        // Only admin and manager can view system history
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem lịch sử hệ thống'
            });
        }

        const {
            startDate,
            endDate,
            action,
            module,
            userId,
            status,
            page = 1,
            limit = 100
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const result = await historyService.getSystemActivityHistory({
            startDate,
            endDate,
            action: action ? action.split(',') : undefined,
            module: module ? module.split(',') : undefined,
            userId,
            status,
            limit: limitNum,
            skip
        });

        res.json({
            success: true,
            data: {
                ...result.data,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(result.data.total / limitNum),
                    total: result.data.total,
                    hasNext: result.data.hasMore,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get system history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy lịch sử hệ thống'
        });
    }
};

const getActivityStatistics = async (req, res) => {
    try {
        // Only admin and manager can view statistics
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem thống kê hoạt động'
            });
        }

        const {
            startDate,
            endDate,
            userId,
            groupBy = 'day'
        } = req.query;

        const result = await historyService.getActivityStatistics({
            startDate,
            endDate,
            userId,
            groupBy
        });

        res.json(result);

    } catch (error) {
        console.error('Get activity statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê hoạt động'
        });
    }
};

const getUserActivitySummary = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const userId = req.params.userId || req.user.id;

        // Check permissions
        if (userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem tóm tắt hoạt động của người dùng khác'
            });
        }

        const result = await historyService.getUserActivitySummary(userId, parseInt(days));

        res.json(result);

    } catch (error) {
        console.error('Get user activity summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy tóm tắt hoạt động'
        });
    }
};

const getMostActiveUsers = async (req, res) => {
    try {
        // Only admin and manager can view this
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem danh sách người dùng tích cực'
            });
        }

        const {
            startDate,
            endDate,
            limit = 10,
            action,
            module
        } = req.query;

        const result = await historyService.getMostActiveUsers({
            startDate,
            endDate,
            limit: parseInt(limit),
            action,
            module
        });

        res.json(result);

    } catch (error) {
        console.error('Get most active users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách người dùng tích cực'
        });
    }
};

const searchHistory = async (req, res) => {
    try {
        const {
            keyword,
            userId,
            action,
            module,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        // Check permissions for searching other users' history
        if (userId && userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tìm kiếm lịch sử của người dùng khác'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const result = await historyService.searchActivityHistory({
            keyword,
            userId: userId || (req.user.role === 'staff' ? req.user.id : undefined),
            action,
            module,
            startDate,
            endDate,
            limit: limitNum,
            skip
        });

        res.json({
            success: true,
            data: {
                ...result.data,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(result.data.total / limitNum),
                    total: result.data.total,
                    hasNext: result.data.hasMore,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Search history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm lịch sử'
        });
    }
};

const exportHistory = async (req, res) => {
    try {
        // Only admin and manager can export
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xuất lịch sử'
            });
        }

        const {
            format = 'xlsx',
            startDate,
            endDate,
            userId,
            action,
            module
        } = req.query;

        const data = await historyService.exportActivityHistory({
            format,
            startDate,
            endDate,
            userId,
            action,
            module
        });

        const filename = `activity_history_${Date.now()}.${format}`;

        if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else {
            res.setHeader('Content-Type', 'text/csv');
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error) {
        console.error('Export history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xuất lịch sử'
        });
    }
};

const logActivity = async (req, res) => {
    try {
        const {
            action,
            module,
            targetType,
            targetId,
            description,
            details
        } = req.body;

        const activityData = {
            userId: req.user.id,
            action,
            module,
            targetType,
            targetId,
            description,
            details,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };

        const result = await historyService.logActivity(activityData);

        res.status(201).json({
            success: true,
            message: 'Ghi log hoạt động thành công',
            data: result
        });

    } catch (error) {
        console.error('Log activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi ghi log hoạt động'
        });
    }
};

const cleanOldHistory = async (req, res) => {
    try {
        // Only admin can clean history
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền dọn dẹp lịch sử'
            });
        }

        const { daysToKeep = 365 } = req.body;

        const result = await historyService.cleanOldHistory(parseInt(daysToKeep));

        res.json({
            success: true,
            message: `Đã dọn dẹp ${result.deletedCount} bản ghi lịch sử cũ`,
            data: result
        });

    } catch (error) {
        console.error('Clean old history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi dọn dẹp lịch sử'
        });
    }
};

module.exports = {
    getUserHistory,
    getSystemHistory,
    getActivityStatistics,
    getUserActivitySummary,
    getMostActiveUsers,
    searchHistory,
    exportHistory,
    logActivity,
    cleanOldHistory
};