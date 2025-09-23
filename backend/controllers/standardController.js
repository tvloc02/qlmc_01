const { Standard, Program, Organization } = require('../models/Program');

const getStandards = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            programId,
            organizationId,
            status,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [standards, total] = await Promise.all([
            Standard.find(query)
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Standard.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                standards,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get standards error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chuẩn'
        });
    }
};

const getStandardsByProgramAndOrg = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu programId hoặc organizationId'
            });
        }

        const standards = await Standard.findByProgramAndOrganization(programId, organizationId);

        res.json({
            success: true,
            data: standards
        });

    } catch (error) {
        console.error('Get standards by program and org error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chuẩn'
        });
    }
};

const getStandardById = async (req, res) => {
    try {
        const { id } = req.params;

        const standard = await Standard.findById(id)
            .populate('programId', 'name code description')
            .populate('organizationId', 'name code description')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn'
            });
        }

        res.json({
            success: true,
            data: standard
        });

    } catch (error) {
        console.error('Get standard by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin tiêu chuẩn'
        });
    }
};

const createStandard = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            programId,
            organizationId,
            order,
            weight,
            objectives,
            guidelines,
            evaluationCriteria
        } = req.body;

        const [program, organization] = await Promise.all([
            Program.findById(programId),
            Organization.findById(organizationId)
        ]);

        if (!program || !organization) {
            return res.status(400).json({
                success: false,
                message: 'Chương trình hoặc tổ chức không tồn tại'
            });
        }

        // Check if code already exists in this program-organization
        const existingStandard = await Standard.findOne({
            programId,
            organizationId,
            code: code.toString().padStart(2, '0')
        });

        if (existingStandard) {
            return res.status(400).json({
                success: false,
                message: `Mã tiêu chuẩn ${code} đã tồn tại trong chương trình này`
            });
        }

        const standard = new Standard({
            name: name.trim(),
            code: code.toString().padStart(2, '0'),
            description: description?.trim(),
            programId,
            organizationId,
            order: order || 1,
            weight,
            objectives: objectives?.trim(),
            guidelines: guidelines?.trim(),
            evaluationCriteria: evaluationCriteria || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await standard.save();

        await standard.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo tiêu chuẩn thành công',
            data: standard
        });

    } catch (error) {
        console.error('Create standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo tiêu chuẩn'
        });
    }
};

const updateStandard = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            code,
            description,
            order,
            weight,
            objectives,
            guidelines,
            evaluationCriteria,
            status
        } = req.body;

        const standard = await Standard.findById(id);
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn'
            });
        }

        // Check if code already exists (excluding current standard)
        if (code && code !== standard.code) {
            const existingStandard = await Standard.findOne({
                _id: { $ne: id },
                programId: standard.programId,
                organizationId: standard.organizationId,
                code: code.toString().padStart(2, '0')
            });

            if (existingStandard) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tiêu chuẩn ${code} đã tồn tại trong chương trình này`
                });
            }
        }

        // Update fields
        if (name !== undefined) standard.name = name.trim();
        if (code !== undefined) standard.code = code.toString().padStart(2, '0');
        if (description !== undefined) standard.description = description?.trim();
        if (order !== undefined) standard.order = order;
        if (weight !== undefined) standard.weight = weight;
        if (objectives !== undefined) standard.objectives = objectives?.trim();
        if (guidelines !== undefined) standard.guidelines = guidelines?.trim();
        if (evaluationCriteria !== undefined) standard.evaluationCriteria = evaluationCriteria;
        if (status !== undefined) standard.status = status;

        standard.updatedBy = req.user.id;

        await standard.save();

        await standard.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật tiêu chuẩn thành công',
            data: standard
        });

    } catch (error) {
        console.error('Update standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật tiêu chuẩn'
        });
    }
};

const deleteStandard = async (req, res) => {
    try {
        const { id } = req.params;

        const standard = await Standard.findById(id);
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn'
            });
        }

        // Check if standard is in use
        const isInUse = await standard.isInUse();
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tiêu chuẩn đang được sử dụng'
            });
        }

        await Standard.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa tiêu chuẩn thành công'
        });

    } catch (error) {
        console.error('Delete standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa tiêu chuẩn'
        });
    }
};

const getStandardStatistics = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        let query = {};
        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;

        // Get basic statistics
        const [
            totalStandards,
            statusStats,
            programStats,
            organizationStats,
            averageWeight
        ] = await Promise.all([
            Standard.countDocuments(query),

            Standard.aggregate([
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            Standard.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'programs',
                        localField: 'programId',
                        foreignField: '_id',
                        as: 'program'
                    }
                },
                { $unwind: '$program' },
                {
                    $group: {
                        _id: '$programId',
                        name: { $first: '$program.name' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            Standard.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'organizations',
                        localField: 'organizationId',
                        foreignField: '_id',
                        as: 'organization'
                    }
                },
                { $unwind: '$organization' },
                {
                    $group: {
                        _id: '$organizationId',
                        name: { $first: '$organization.name' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            Standard.aggregate([
                { $match: { ...query, weight: { $exists: true, $ne: null } } },
                { $group: { _id: null, averageWeight: { $avg: '$weight' } } }
            ])
        ]);

        // Format status statistics
        const formattedStatusStats = {
            draft: 0,
            active: 0,
            inactive: 0,
            archived: 0
        };

        statusStats.forEach(stat => {
            formattedStatusStats[stat._id] = stat.count;
        });

        // Get recent activities (recently created/updated)
        const recentActivities = await Standard.find(query)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('createdBy', 'fullName')
            .populate('updatedBy', 'fullName')
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('name code status createdAt updatedAt createdBy updatedBy');

        const statistics = {
            totalStandards,
            statusStatistics: formattedStatusStats,
            programStatistics: programStats,
            organizationStatistics: organizationStats,
            averageWeight: averageWeight.length > 0 ? Math.round(averageWeight[0].averageWeight * 100) / 100 : 0,
            recentActivities: recentActivities.map(activity => ({
                id: activity._id,
                name: activity.name,
                code: activity.code,
                status: activity.status,
                program: activity.programId?.name,
                organization: activity.organizationId?.name,
                lastAction: activity.updatedAt > activity.createdAt ? 'updated' : 'created',
                lastActionBy: activity.updatedAt > activity.createdAt ?
                    activity.updatedBy?.fullName : activity.createdBy?.fullName,
                lastActionAt: activity.updatedAt > activity.createdAt ?
                    activity.updatedAt : activity.createdAt
            }))
        };

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        console.error('Get standard statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê tiêu chuẩn'
        });
    }
};

module.exports = {
    getStandards,
    getStandardsByProgramAndOrg,
    getStandardById,
    createStandard,
    updateStandard,
    deleteStandard,
    getStandardStatistics
};