const History = require('../models/History');
const User = require('../models/User');

/**
 * History and activity tracking service
 */

// Log user activity
const logActivity = async (activityData) => {
    try {
        const {
            userId,
            action,
            module,
            targetType,
            targetId,
            description,
            details = {},
            ipAddress,
            userAgent,
            sessionId,
            status = 'success'
        } = activityData;

        const history = new History({
            userId,
            action,
            module,
            targetType,
            targetId,
            description,
            details,
            ipAddress,
            userAgent,
            sessionId,
            status
        });

        await history.save();
        return history;

    } catch (error) {
        console.error('Log activity error:', error);
        throw error;
    }
};

// Get user activity history
const getUserActivityHistory = async (userId, options = {}) => {
    try {
        const {
            startDate,
            endDate,
            action,
            module,
            status,
            limit = 50,
            skip = 0,
            sortOrder = 'desc'
        } = options;

        let query = { userId };

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Filter by action
        if (action) {
            if (Array.isArray(action)) {
                query.action = { $in: action };
            } else {
                query.action = action;
            }
        }

        // Filter by module
        if (module) {
            if (Array.isArray(module)) {
                query.module = { $in: module };
            } else {
                query.module = module;
            }
        }

        // Filter by status
        if (status) query.status = status;

        const [history, total] = await Promise.all([
            History.find(query)
                .sort({ timestamp: sortOrder === 'desc' ? -1 : 1 })
                .limit(limit)
                .skip(skip)
                .populate('userId', 'fullName email'),
            History.countDocuments(query)
        ]);

        return {
            success: true,
            data: {
                history,
                total,
                hasMore: skip + limit < total
            }
        };

    } catch (error) {
        console.error('Get user activity history error:', error);
        throw error;
    }
};

// Get system activity history
const getSystemActivityHistory = async (options = {}) => {
    try {
        const {
            startDate,
            endDate,
            action,
            module,
            userId,
            status,
            limit = 100,
            skip = 0,
            sortOrder = 'desc'
        } = options;

        let query = {};

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Filter by user
        if (userId) query.userId = userId;

        // Filter by action
        if (action) {
            if (Array.isArray(action)) {
                query.action = { $in: action };
            } else {
                query.action = action;
            }
        }

        // Filter by module
        if (module) {
            if (Array.isArray(module)) {
                query.module = { $in: module };
            } else {
                query.module = module;
            }
        }

        // Filter by status
        if (status) query.status = status;

        const [history, total] = await Promise.all([
            History.find(query)
                .sort({ timestamp: sortOrder === 'desc' ? -1 : 1 })
                .limit(limit)
                .skip(skip)
                .populate('userId', 'fullName email'),
            History.countDocuments(query)
        ]);

        return {
            success: true,
            data: {
                history,
                total,
                hasMore: skip + limit < total
            }
        };

    } catch (error) {
        console.error('Get system activity history error:', error);
        throw error;
    }
};

// Get activity statistics
const getActivityStatistics = async (options = {}) => {
    try {
        const {
            startDate,
            endDate,
            userId,
            groupBy = 'day'
        } = options;

        let matchStage = {};

        // Date range filter
        if (startDate || endDate) {
            matchStage.timestamp = {};
            if (startDate) matchStage.timestamp.$gte = new Date(startDate);
            if (endDate) matchStage.timestamp.$lte = new Date(endDate);
        }

        // Filter by user
        if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);

        // Group by time period
        let groupStage;
        switch (groupBy) {
            case 'hour':
                groupStage = {
                    $group: {
                        _id: {
                            year: { $year: '$timestamp' },
                            month: { $month: '$timestamp' },
                            day: { $dayOfMonth: '$timestamp' },
                            hour: { $hour: '$timestamp' }
                        },
                        count: { $sum: 1 },
                        actions: { $addToSet: '$action' },
                        modules: { $addToSet: '$module' },
                        users: { $addToSet: '$userId' }
                    }
                };
                break;
            case 'month':
                groupStage = {
                    $group: {
                        _id: {
                            year: { $year: '$timestamp' },
                            month: { $month: '$timestamp' }
                        },
                        count: { $sum: 1 },
                        actions: { $addToSet: '$action' },
                        modules: { $addToSet: '$module' },
                        users: { $addToSet: '$userId' }
                    }
                };
                break;
            default: // day
                groupStage = {
                    $group: {
                        _id: {
                            year: { $year: '$timestamp' },
                            month: { $month: '$timestamp' },
                            day: { $dayOfMonth: '$timestamp' }
                        },
                        count: { $sum: 1 },
                        actions: { $addToSet: '$action' },
                        modules: { $addToSet: '$module' },
                        users: { $addToSet: '$userId' }
                    }
                };
        }

        const stats = await History.aggregate([
            { $match: matchStage },
            groupStage,
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
        ]);

        // Get overall statistics
        const overallStats = await History.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalActivities: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    actionBreakdown: {
                        $push: {
                            action: '$action',
                            module: '$module',
                            status: '$status'
                        }
                    }
                }
            }
        ]);

        // Count by action
        const actionStats = await History.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Count by module
        const moduleStats = await History.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$module',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const result = {
            timeSeriesData: stats,
            overall: overallStats[0] || { totalActivities: 0, uniqueUsers: [], actionBreakdown: [] },
            byAction: actionStats,
            byModule: moduleStats
        };

        // Calculate unique user count
        if (result.overall.uniqueUsers) {
            result.overall.uniqueUserCount = result.overall.uniqueUsers.length;
            delete result.overall.uniqueUsers; // Remove array for cleaner response
        }

        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Get activity statistics error:', error);
        throw error;
    }
};

// Get user activity summary
const getUserActivitySummary = async (userId, days = 30) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const summary = await History.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalActivities: { $sum: 1 },
                    actionBreakdown: {
                        $push: {
                            action: '$action',
                            module: '$module'
                        }
                    },
                    lastActivity: { $max: '$timestamp' },
                    firstActivity: { $min: '$timestamp' }
                }
            }
        ]);

        // Count by action
        const actionCounts = await History.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Recent activities
        const recentActivities = await History.find({
            userId,
            timestamp: { $gte: startDate }
        })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('action module description timestamp status');

        return {
            success: true,
            data: {
                summary: summary[0] || { totalActivities: 0, actionBreakdown: [] },
                actionCounts,
                recentActivities,
                period: `${days} ngày qua`
            }
        };

    } catch (error) {
        console.error('Get user activity summary error:', error);
        throw error;
    }
};

// Get most active users
const getMostActiveUsers = async (options = {}) => {
    try {
        const {
            startDate,
            endDate,
            limit = 10,
            action,
            module
        } = options;

        let matchStage = {};

        // Date range filter
        if (startDate || endDate) {
            matchStage.timestamp = {};
            if (startDate) matchStage.timestamp.$gte = new Date(startDate);
            if (endDate) matchStage.timestamp.$lte = new Date(endDate);
        }

        // Filter by action
        if (action) matchStage.action = action;

        // Filter by module
        if (module) matchStage.module = module;

        const activeUsers = await History.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$userId',
                    activityCount: { $sum: 1 },
                    lastActivity: { $max: '$timestamp' },
                    actions: { $addToSet: '$action' },
                    modules: { $addToSet: '$module' }
                }
            },
            { $sort: { activityCount: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    activityCount: 1,
                    lastActivity: 1,
                    actions: 1,
                    modules: 1,
                    'user.fullName': 1,
                    'user.email': 1,
                    'user.role': 1
                }
            }
        ]);

        return {
            success: true,
            data: activeUsers
        };

    } catch (error) {
        console.error('Get most active users error:', error);
        throw error;
    }
};

// Search activity history
const searchActivityHistory = async (searchParams) => {
    try {
        const {
            keyword,
            userId,
            action,
            module,
            startDate,
            endDate,
            limit = 50,
            skip = 0
        } = searchParams;

        let query = {};

        // Keyword search in description
        if (keyword) {
            query.description = { $regex: keyword, $options: 'i' };
        }

        // User filter
        if (userId) query.userId = userId;

        // Action filter
        if (action) query.action = action;

        // Module filter
        if (module) query.module = module;

        // Date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const [results, total] = await Promise.all([
            History.find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .populate('userId', 'fullName email'),
            History.countDocuments(query)
        ]);

        return {
            success: true,
            data: {
                results,
                total,
                hasMore: skip + limit < total
            }
        };

    } catch (error) {
        console.error('Search activity history error:', error);
        throw error;
    }
};

// Clean old history records
const cleanOldHistory = async (daysToKeep = 365) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await History.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        console.log(`Cleaned ${result.deletedCount} old history records`);

        return {
            success: true,
            deletedCount: result.deletedCount,
            cutoffDate
        };

    } catch (error) {
        console.error('Clean old history error:', error);
        throw error;
    }
};

// Export activity history
const exportActivityHistory = async (exportOptions) => {
    try {
        const {
            format = 'xlsx',
            startDate,
            endDate,
            userId,
            action,
            module
        } = exportOptions;

        // Build query
        let query = {};
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (module) query.module = module;

        // Get data
        const history = await History.find(query)
            .populate('userId', 'fullName email')
            .sort({ timestamp: -1 })
            .limit(10000); // Limit for performance

        // Prepare export data
        const exportData = history.map(record => ({
            'Thời gian': formatDateTime(record.timestamp),
            'Người dùng': record.userId?.fullName || 'Unknown',
            'Email': record.userId?.email || '',
            'Hành động': record.action,
            'Module': record.module,
            'Mô tả': record.description,
            'Trạng thái': record.status,
            'IP Address': record.ipAddress || '',
            'User Agent': record.userAgent || ''
        }));

        if (format === 'xlsx') {
            const XLSX = require('xlsx');
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử hoạt động');

            return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        } else {
            // CSV format
            const csvHeaders = Object.keys(exportData[0] || {});
            const csvContent = [
                csvHeaders.join(','),
                ...exportData.map(row =>
                    csvHeaders.map(header => {
                        const value = row[header] || '';
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            return Buffer.from('\ufeff' + csvContent, 'utf8');
        }

    } catch (error) {
        console.error('Export activity history error:', error);
        throw error;
    }
};

// Helper functions
const formatDateTime = (date) => {
    return new Date(date).toLocaleString('vi-VN');
};

module.exports = {
    logActivity,
    getUserActivityHistory,
    getSystemActivityHistory,
    getActivityStatistics,
    getUserActivitySummary,
    getMostActiveUsers,
    searchActivityHistory,
    cleanOldHistory,
    exportActivityHistory
};