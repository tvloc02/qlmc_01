const AssessmentProgram = require('../models/AssessmentProgram');
const { Program, Organization, Standard } = require('../models/Program');
const Expert = require('../models/Expert');

const getAssessmentPrograms = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            assessmentType,
            academicYear,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (assessmentType) query.assessmentType = assessmentType;
        if (academicYear) query.academicYear = academicYear;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [assessmentPrograms, total] = await Promise.all([
            AssessmentProgram.find(query)
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('assignedExperts.expertId', 'expertCode personnelId')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            AssessmentProgram.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                assessmentPrograms,
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
        console.error('Get assessment programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách chương trình đánh giá'
        });
    }
};

const getAssessmentProgramById = async (req, res) => {
    try {
        const { id } = req.params;

        const assessmentProgram = await AssessmentProgram.findById(id)
            .populate('programId', 'name code description')
            .populate('organizationId', 'name code description')
            .populate('assignedExperts.expertId', 'expertCode personnelId specializations')
            .populate('assignedExperts.assignedStandards', 'name code')
            .populate('assessmentCriteria.standardId', 'name code')
            .populate('createdBy', 'fullName email');

        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        res.json({
            success: true,
            data: assessmentProgram
        });

    } catch (error) {
        console.error('Get assessment program by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin chương trình đánh giá'
        });
    }
};

const createAssessmentProgram = async (req, res) => {
    try {
        const {
            name,
            code,
            programId,
            organizationId,
            academicYear,
            assessmentType,
            timeline,
            assessmentCriteria
        } = req.body;

        // Check if code already exists
        const existingProgram = await AssessmentProgram.findOne({ code: code.toUpperCase() });
        if (existingProgram) {
            return res.status(400).json({
                success: false,
                message: `Mã chương trình đánh giá ${code} đã tồn tại`
            });
        }

        // Validate program and organization
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

        const assessmentProgram = new AssessmentProgram({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            programId,
            organizationId,
            academicYear,
            assessmentType,
            timeline,
            assessmentCriteria: assessmentCriteria || [],
            createdBy: req.user.id
        });

        await assessmentProgram.save();

        await assessmentProgram.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo chương trình đánh giá thành công',
            data: assessmentProgram
        });

    } catch (error) {
        console.error('Create assessment program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo chương trình đánh giá'
        });
    }
};

const updateAssessmentProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const assessmentProgram = await AssessmentProgram.findById(id);
        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        // Check code uniqueness if being updated
        if (updateData.code && updateData.code.toUpperCase() !== assessmentProgram.code) {
            const existingProgram = await AssessmentProgram.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingProgram) {
                return res.status(400).json({
                    success: false,
                    message: `Mã chương trình đánh giá ${updateData.code} đã tồn tại`
                });
            }
        }

        // Update fields
        Object.assign(assessmentProgram, updateData);
        if (updateData.code) {
            assessmentProgram.code = updateData.code.toUpperCase();
        }

        await assessmentProgram.save();

        await assessmentProgram.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'assignedExperts.expertId', select: 'expertCode personnelId' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật chương trình đánh giá thành công',
            data: assessmentProgram
        });

    } catch (error) {
        console.error('Update assessment program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật chương trình đánh giá'
        });
    }
};

const deleteAssessmentProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const assessmentProgram = await AssessmentProgram.findById(id);
        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        // Check if can be deleted (not in active assessment)
        if (assessmentProgram.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa chương trình đánh giá đang hoạt động'
            });
        }

        await AssessmentProgram.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa chương trình đánh giá thành công'
        });

    } catch (error) {
        console.error('Delete assessment program error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa chương trình đánh giá'
        });
    }
};

const assignExpert = async (req, res) => {
    try {
        const { id } = req.params;
        const { expertId, role, assignedStandards } = req.body;

        const assessmentProgram = await AssessmentProgram.findById(id);
        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        // Check if expert exists
        const expert = await Expert.findById(expertId);
        if (!expert) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia không tồn tại'
            });
        }

        // Check if expert already assigned
        const existingAssignment = assessmentProgram.assignedExperts.find(
            assignment => assignment.expertId.toString() === expertId
        );

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia đã được phân công cho chương trình này'
            });
        }

        // Add expert assignment
        assessmentProgram.assignedExperts.push({
            expertId,
            role: role || 'evaluator',
            assignedStandards: assignedStandards || []
        });

        await assessmentProgram.save();

        await assessmentProgram.populate([
            { path: 'assignedExperts.expertId', select: 'expertCode personnelId' },
            { path: 'assignedExperts.assignedStandards', select: 'name code' }
        ]);

        res.json({
            success: true,
            message: 'Phân công chuyên gia thành công',
            data: assessmentProgram.assignedExperts
        });

    } catch (error) {
        console.error('Assign expert error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công chuyên gia'
        });
    }
};

const removeExpert = async (req, res) => {
    try {
        const { id, expertId } = req.params;

        const assessmentProgram = await AssessmentProgram.findById(id);
        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        // Remove expert assignment
        assessmentProgram.assignedExperts = assessmentProgram.assignedExperts.filter(
            assignment => assignment.expertId.toString() !== expertId
        );

        await assessmentProgram.save();

        res.json({
            success: true,
            message: 'Hủy phân công chuyên gia thành công'
        });

    } catch (error) {
        console.error('Remove expert error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi hủy phân công chuyên gia'
        });
    }
};

const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const assessmentProgram = await AssessmentProgram.findById(id);
        if (!assessmentProgram) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy chương trình đánh giá'
            });
        }

        await assessmentProgram.updateProgress();

        res.json({
            success: true,
            message: 'Cập nhật tiến độ thành công',
            data: assessmentProgram.progress
        });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật tiến độ'
        });
    }
};

const getStatistics = async (req, res) => {
    try {
        const { academicYear } = req.query;

        let matchStage = {};
        if (academicYear) matchStage.academicYear = academicYear;

        const stats = await AssessmentProgram.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalPrograms: { $sum: 1 },
                    activePrograms: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    completedPrograms: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    averageProgress: { $avg: '$progress.overallProgress' }
                }
            }
        ]);

        const result = stats[0] || {
            totalPrograms: 0,
            activePrograms: 0,
            completedPrograms: 0,
            averageProgress: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê'
        });
    }
};

module.exports = {
    getAssessmentPrograms,
    getAssessmentProgramById,
    createAssessmentProgram,
    updateAssessmentProgram,
    deleteAssessmentProgram,
    assignExpert,
    removeExpert,
    updateProgress,
    getStatistics
};