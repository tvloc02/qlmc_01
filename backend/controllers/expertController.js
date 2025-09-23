const Expert = require('../models/Expert');
const Personnel = require('../models/Personnel');
const { Program, Standard } = require('../models/Program');

const getExperts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            availability,
            specialization,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            // Search in expert code and personnel info
            const personnelIds = await Personnel.find({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { employeeId: { $regex: search, $options: 'i' } }
                ]
            }).distinct('_id');

            query.$or = [
                { expertCode: { $regex: search, $options: 'i' } },
                { personnelId: { $in: personnelIds } }
            ];
        }

        if (status) query.status = status;
        if (availability) query.availability = availability;
        if (specialization) {
            query['specializations.field'] = { $regex: specialization, $options: 'i' };
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [experts, total] = await Promise.all([
            Expert.find(query)
                .populate('personnelId', 'fullName email employeeId position facultyId departmentId')
                .populate('assignedPrograms.programId', 'name code')
                .populate('assignedStandards', 'name code')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Expert.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                experts,
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
        console.error('Get experts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách chuyên gia'
        });
    }
};

const getExpertById = async (req, res) => {
    try {
        const { id } = req.params;

        const expert = await Expert.findById(id)
            .populate('personnelId', 'fullName email employeeId position facultyId departmentId qualifications')
            .populate('assignedPrograms.programId', 'name code description')
            .populate('assignedStandards', 'name code description')
            .populate('createdBy', 'fullName email');

        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        res.json({
            success: true,
            data: expert
        });

    } catch (error) {
        console.error('Get expert by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin chuyên gia'
        });
    }
};

const createExpert = async (req, res) => {
    try {
        const {
            personnelId,
            specializations,
            certifications,
            maxAssignments
        } = req.body;

        // Check if personnel exists
        const personnel = await Personnel.findById(personnelId);
        if (!personnel) {
            return res.status(400).json({
                success: false,
                message: 'Nhân sự không tồn tại'
            });
        }

        // Check if personnel is already an expert
        const existingExpert = await Expert.findOne({ personnelId });
        if (existingExpert) {
            return res.status(400).json({
                success: false,
                message: 'Nhân sự này đã là chuyên gia'
            });
        }

        // Generate expert code
        const expertCode = await Expert.generateExpertCode();

        const expert = new Expert({
            personnelId,
            expertCode,
            specializations: specializations || [],
            certifications: certifications || [],
            workload: {
                currentAssignments: 0,
                maxAssignments: maxAssignments || 5
            },
            createdBy: req.user.id
        });

        await expert.save();

        // Update personnel isExpert flag
        personnel.isExpert = true;
        await personnel.save();

        await expert.populate([
            { path: 'personnelId', select: 'fullName email employeeId position' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo chuyên gia thành công',
            data: expert
        });

    } catch (error) {
        console.error('Create expert error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo chuyên gia'
        });
    }
};

const updateExpert = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const expert = await Expert.findById(id);
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        // Update allowed fields
        const allowedFields = [
            'specializations', 'certifications', 'availability',
            'workload', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                expert[field] = updateData[field];
            }
        });

        await expert.save();

        await expert.populate([
            { path: 'personnelId', select: 'fullName email employeeId position' },
            { path: 'assignedPrograms.programId', select: 'name code' },
            { path: 'assignedStandards', select: 'name code' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật chuyên gia thành công',
            data: expert
        });

    } catch (error) {
        console.error('Update expert error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật chuyên gia'
        });
    }
};

const deleteExpert = async (req, res) => {
    try {
        const { id } = req.params;

        const expert = await Expert.findById(id);
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        // Check if expert has active assignments
        if (expert.workload.currentAssignments > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa chuyên gia đang có phân công'
            });
        }

        // Update personnel isExpert flag
        const personnel = await Personnel.findById(expert.personnelId);
        if (personnel) {
            personnel.isExpert = false;
            await personnel.save();
        }

        await Expert.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa chuyên gia thành công'
        });

    } catch (error) {
        console.error('Delete expert error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa chuyên gia'
        });
    }
};

const assignToProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { programId, role } = req.body;

        const expert = await Expert.findById(id);
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        const program = await Program.findById(programId);
        if (!program) {
            return res.status(400).json({
                success: false,
                message: 'Chương trình không tồn tại'
            });
        }

        // Check if already assigned
        const existingAssignment = expert.assignedPrograms.find(
            assignment => assignment.programId.toString() === programId
        );

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia đã được phân công cho chương trình này'
            });
        }

        // Check workload
        if (expert.workload.currentAssignments >= expert.workload.maxAssignments) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia đã đạt giới hạn phân công'
            });
        }

        expert.assignedPrograms.push({
            programId,
            role: role || 'evaluator'
        });

        expert.workload.currentAssignments += 1;
        await expert.save();

        res.json({
            success: true,
            message: 'Phân công chương trình thành công'
        });

    } catch (error) {
        console.error('Assign to program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công chương trình'
        });
    }
};

const removeFromProgram = async (req, res) => {
    try {
        const { id, programId } = req.params;

        const expert = await Expert.findById(id);
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        expert.assignedPrograms = expert.assignedPrograms.filter(
            assignment => assignment.programId.toString() !== programId
        );

        expert.workload.currentAssignments = Math.max(0, expert.workload.currentAssignments - 1);
        await expert.save();

        res.json({
            success: true,
            message: 'Hủy phân công chương trình thành công'
        });

    } catch (error) {
        console.error('Remove from program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi hủy phân công chương trình'
        });
    }
};

const assignStandards = async (req, res) => {
    try {
        const { id } = req.params;
        const { standardIds } = req.body;

        const expert = await Expert.findById(id);
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chuyên gia'
            });
        }

        // Validate standards exist
        const standards = await Standard.find({ _id: { $in: standardIds } });
        if (standards.length !== standardIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một số tiêu chuẩn không tồn tại'
            });
        }

        expert.assignedStandards = standardIds;
        await expert.save();

        await expert.populate('assignedStandards', 'name code');

        res.json({
            success: true,
            message: 'Phân công tiêu chuẩn thành công',
            data: expert.assignedStandards
        });

    } catch (error) {
        console.error('Assign standards error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công tiêu chuẩn'
        });
    }
};

const getAvailableExperts = async (req, res) => {
    try {
        const { specialization, maxWorkload } = req.query;

        let query = {
            status: 'active',
            availability: 'available'
        };

        if (specialization) {
            query['specializations.field'] = { $regex: specialization, $options: 'i' };
        }

        if (maxWorkload) {
            query['$expr'] = {
                $lt: ['$workload.currentAssignments', '$workload.maxAssignments']
            };
        }

        const experts = await Expert.find(query)
            .populate('personnelId', 'fullName email position')
            .select('expertCode specializations workload availability')
            .sort({ 'workload.currentAssignments': 1 });

        res.json({
            success: true,
            data: experts
        });

    } catch (error) {
        console.error('Get available experts error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách chuyên gia khả dụng'
        });
    }
};

const getExpertStatistics = async (req, res) => {
    try {
        const stats = await Expert.aggregate([
            {
                $group: {
                    _id: null,
                    totalExperts: { $sum: 1 },
                    activeExperts: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    availableExperts: {
                        $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] }
                    },
                    totalAssignments: { $sum: '$workload.currentAssignments' }
                }
            }
        ]);

        const result = stats[0] || {
            totalExperts: 0,
            activeExperts: 0,
            availableExperts: 0,
            totalAssignments: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get expert statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê chuyên gia'
        });
    }
};

module.exports = {
    getExperts,
    getExpertById,
    createExpert,
    updateExpert,
    deleteExpert,
    assignToProgram,
    removeFromProgram,
    assignStandards,
    getAvailableExperts,
    getExpertStatistics
};