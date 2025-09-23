const Evidence = require('../models/Evidence');
const { Program, Organization, Standard, Criteria } = require('../models/Program');
const Expert = require('../models/Expert');
const User = require('../models/User');
const History = require('../models/History');
const exportService = require('../services/exportService');

const getDashboardStats = async (req, res) => {
    try {
        const { programId, organizationId, timeRange = '30' } = req.query;

        let matchQuery = {};
        if (programId) matchQuery.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) matchQuery.organizationId = mongoose.Types.ObjectId(organizationId);

        // Get date range
        const daysAgo = parseInt(timeRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Evidence statistics
        const evidenceStats = await Evidence.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalEvidences: { $sum: 1 },
                    activeEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    recentEvidences: {
                        $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] }
                    },
                    totalFiles: { $sum: { $size: '$files' } }
                }
            }
        ]);

        // Evidence by standard
        const evidenceByStandard = await Evidence.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'standards',
                    localField: 'standardId',
                    foreignField: '_id',
                    as: 'standard'
                }
            },
            { $unwind: '$standard' },
            {
                $group: {
                    _id: '$standardId',
                    standardName: { $first: '$standard.name' },
                    standardCode: { $first: '$standard.code' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { 'standardCode': 1 } }
        ]);

        // Recent activities
        let activityQuery = {};
        if (req.user.role !== 'admin') {
            activityQuery.userId = req.user.id;
        }
        activityQuery.timestamp = { $gte: startDate };

        const recentActivities = await History.find(activityQuery)
            .populate('userId', 'fullName')
            .sort({ timestamp: -1 })
            .limit(10);

        // User statistics (admin only)
        let userStats = null;
        if (req.user.role === 'admin') {
            userStats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        activeUsers: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        recentLogins: {
                            $sum: { $cond: [{ $gte: ['$lastLogin', startDate] }, 1, 0] }
                        }
                    }
                }
            ]);
        }

        res.json({
            success: true,
            data: {
                evidence: evidenceStats[0] || {
                    totalEvidences: 0,
                    activeEvidences: 0,
                    recentEvidences: 0,
                    totalFiles: 0
                },
                evidenceByStandard,
                recentActivities,
                users: userStats ? userStats[0] : null,
                timeRange: `${daysAgo} ngày qua`
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê dashboard'
        });
    }
};

const getEvidenceReport = async (req, res) => {
    try {
        const {
            programId,
            organizationId,
            standardId,
            criteriaId,
            startDate,
            endDate,
            groupBy = 'standard'
        } = req.query;

        let matchQuery = {};
        if (programId) matchQuery.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) matchQuery.organizationId = mongoose.Types.ObjectId(organizationId);
        if (standardId) matchQuery.standardId = mongoose.Types.ObjectId(standardId);
        if (criteriaId) matchQuery.criteriaId = mongoose.Types.ObjectId(criteriaId);

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        let groupStage;
        let lookupStage;

        switch (groupBy) {
            case 'criteria':
                groupStage = {
                    $group: {
                        _id: '$criteriaId',
                        count: { $sum: 1 },
                        fileCount: { $sum: { $size: '$files' } },
                        statuses: { $push: '$status' }
                    }
                };
                lookupStage = {
                    $lookup: {
                        from: 'criterias',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'criteria'
                    }
                };
                break;
            case 'documentType':
                groupStage = {
                    $group: {
                        _id: '$documentType',
                        count: { $sum: 1 },
                        fileCount: { $sum: { $size: '$files' } }
                    }
                };
                break;
            case 'month':
                groupStage = {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        fileCount: { $sum: { $size: '$files' } }
                    }
                };
                break;
            default: // standard
                groupStage = {
                    $group: {
                        _id: '$standardId',
                        count: { $sum: 1 },
                        fileCount: { $sum: { $size: '$files' } },
                        statuses: { $push: '$status' }
                    }
                };
                lookupStage = {
                    $lookup: {
                        from: 'standards',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'standard'
                    }
                };
        }

        const pipeline = [
            { $match: matchQuery },
            groupStage
        ];

        if (lookupStage) {
            pipeline.push(lookupStage);
        }

        pipeline.push({ $sort: { count: -1 } });

        const report = await Evidence.aggregate(pipeline);

        res.json({
            success: true,
            data: {
                report,
                groupBy,
                filters: {
                    programId,
                    organizationId,
                    standardId,
                    criteriaId,
                    startDate,
                    endDate
                }
            }
        });

    } catch (error) {
        console.error('Get evidence report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo báo cáo minh chứng'
        });
    }
};

const getExpertReport = async (req, res) => {
    try {
        // Only admin and manager can view expert reports
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem báo cáo chuyên gia'
            });
        }

        const { facultyId, status, availability } = req.query;

        let matchQuery = { status: 'active' };
        if (status) matchQuery.status = status;
        if (availability) matchQuery.availability = availability;

        const experts = await Expert.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'personnel',
                    localField: 'personnelId',
                    foreignField: '_id',
                    as: 'personnel'
                }
            },
            { $unwind: '$personnel' },
            {
                $lookup: {
                    from: 'faculties',
                    localField: 'personnel.facultyId',
                    foreignField: '_id',
                    as: 'faculty'
                }
            },
            { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
            {
                $match: facultyId ? { 'faculty._id': mongoose.Types.ObjectId(facultyId) } : {}
            },
            {
                $group: {
                    _id: '$faculty._id',
                    facultyName: { $first: '$faculty.name' },
                    facultyCode: { $first: '$faculty.code' },
                    expertCount: { $sum: 1 },
                    availableExperts: {
                        $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] }
                    },
                    busyExperts: {
                        $sum: { $cond: [{ $eq: ['$availability', 'busy'] }, 1, 0] }
                    },
                    totalAssignments: { $sum: '$workload.currentAssignments' },
                    experts: { $push: '$$ROOT' }
                }
            },
            { $sort: { facultyCode: 1 } }
        ]);

        // Get specialization distribution
        const specializationStats = await Expert.aggregate([
            { $match: matchQuery },
            { $unwind: '$specializations' },
            {
                $group: {
                    _id: '$specializations.field',
                    count: { $sum: 1 },
                    avgExperience: { $avg: '$specializations.yearsOfExperience' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                byFaculty: experts,
                bySpecialization: specializationStats,
                summary: {
                    totalExperts: experts.reduce((sum, faculty) => sum + faculty.expertCount, 0),
                    totalAvailable: experts.reduce((sum, faculty) => sum + faculty.availableExperts, 0),
                    totalAssignments: experts.reduce((sum, faculty) => sum + faculty.totalAssignments, 0)
                }
            }
        });

    } catch (error) {
        console.error('Get expert report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo báo cáo chuyên gia'
        });
    }
};

const getProgressReport = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu programId hoặc organizationId'
            });
        }

        // Get standards and criteria for the program
        const standards = await Standard.find({
            programId,
            organizationId,
            status: 'active'
        }).sort({ code: 1 });

        const progressReport = [];

        for (const standard of standards) {
            const criteria = await Criteria.find({
                standardId: standard._id,
                status: 'active'
            }).sort({ code: 1 });

            const standardProgress = {
                standard: {
                    id: standard._id,
                    code: standard.code,
                    name: standard.name
                },
                criteria: [],
                totalEvidences: 0,
                completionRate: 0
            };

            for (const criterion of criteria) {
                const evidenceCount = await Evidence.countDocuments({
                    criteriaId: criterion._id,
                    status: 'active'
                });

                const criteriaProgress = {
                    id: criterion._id,
                    code: criterion.code,
                    name: criterion.name,
                    evidenceCount,
                    hasEvidence: evidenceCount > 0
                };

                standardProgress.criteria.push(criteriaProgress);
                standardProgress.totalEvidences += evidenceCount;
            }

            // Calculate completion rate
            const completedCriteria = standardProgress.criteria.filter(c => c.hasEvidence).length;
            standardProgress.completionRate = standardProgress.criteria.length > 0
                ? Math.round((completedCriteria / standardProgress.criteria.length) * 100)
                : 0;

            progressReport.push(standardProgress);
        }

        // Calculate overall progress
        const totalCriteria = progressReport.reduce((sum, std) => sum + std.criteria.length, 0);
        const completedCriteria = progressReport.reduce((sum, std) =>
            sum + std.criteria.filter(c => c.hasEvidence).length, 0);
        const overallProgress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

        res.json({
            success: true,
            data: {
                progressReport,
                summary: {
                    totalStandards: standards.length,
                    totalCriteria,
                    completedCriteria,
                    overallProgress,
                    totalEvidences: progressReport.reduce((sum, std) => sum + std.totalEvidences, 0)
                }
            }
        });

    } catch (error) {
        console.error('Get progress report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo báo cáo tiến độ'
        });
    }
};

const exportReport = async (req, res) => {
    try {
        const {
            reportType,
            format = 'xlsx',
            programId,
            organizationId,
            startDate,
            endDate
        } = req.query;

        let data;
        let filename;

        switch (reportType) {
            case 'evidence':
                data = await exportService.exportEvidences({
                    programId,
                    organizationId,
                    dateFrom: startDate,
                    dateTo: endDate
                }, format);
                filename = `evidence_report_${Date.now()}.${format}`;
                break;

            case 'statistics':
                data = await exportService.exportStatistics({
                    programId,
                    organizationId,
                    dateFrom: startDate,
                    dateTo: endDate
                });
                filename = `statistics_report_${Date.now()}.xlsx`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Loại báo cáo không hợp lệ'
                });
        }

        if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else {
            res.setHeader('Content-Type', 'text/csv');
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xuất báo cáo'
        });
    }
};

const getActivityReport = async (req, res) => {
    try {
        // Only admin and manager can view activity reports
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem báo cáo hoạt động'
            });
        }

        const {
            startDate,
            endDate,
            userId,
            action,
            module
        } = req.query;

        let matchQuery = {};
        if (startDate || endDate) {
            matchQuery.timestamp = {};
            if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
            if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
        }
        if (userId) matchQuery.userId = mongoose.Types.ObjectId(userId);
        if (action) matchQuery.action = action;
        if (module) matchQuery.module = module;

        // Activity by action
        const activityByAction = await History.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    successCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                    },
                    failedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Activity by user
        const activityByUser = await History.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    actions: { $addToSet: '$action' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }
        ]);

        // Activity over time
        const activityOverTime = await History.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' },
                        day: { $dayOfMonth: '$timestamp' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                byAction: activityByAction,
                byUser: activityByUser,
                overTime: activityOverTime,
                summary: {
                    totalActivities: activityByAction.reduce((sum, item) => sum + item.count, 0),
                    uniqueUsers: activityByUser.length,
                    dateRange: { startDate, endDate }
                }
            }
        });

    } catch (error) {
        console.error('Get activity report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo báo cáo hoạt động'
        });
    }
};

module.exports = {
    getDashboardStats,
    getEvidenceReport,
    getExpertReport,
    getProgressReport,
    getActivityReport,
    exportReport
};