const Personnel = require('../models/Personnel');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');

const getPersonnel = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            facultyId,
            departmentId,
            position,
            status,
            isExpert,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;
        if (position) query.position = position;
        if (status) query.status = status;
        if (isExpert !== undefined) query.isExpert = isExpert === 'true';

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [personnel, total] = await Promise.all([
            Personnel.find(query)
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code type')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Personnel.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                personnel,
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
        console.error('Get personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhân sự'
        });
    }
};

const getAllPersonnel = async (req, res) => {
    try {
        const { facultyId, departmentId, position, isExpert } = req.query;

        let query = { status: 'active' };
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;
        if (position) query.position = position;
        if (isExpert !== undefined) query.isExpert = isExpert === 'true';

        const personnel = await Personnel.find(query)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code')
            .select('fullName employeeId position email')
            .sort({ fullName: 1 });

        res.json({
            success: true,
            data: personnel
        });

    } catch (error) {
        console.error('Get all personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhân sự'
        });
    }
};

const getPersonnelById = async (req, res) => {
    try {
        const { id } = req.params;

        const personnel = await Personnel.findById(id)
            .populate('facultyId', 'name code description')
            .populate('departmentId', 'name code type')
            .populate('createdBy', 'fullName email');

        if (!personnel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân sự'
            });
        }

        res.json({
            success: true,
            data: personnel
        });

    } catch (error) {
        console.error('Get personnel by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhân sự'
        });
    }
};

const createPersonnel = async (req, res) => {
    try {
        const {
            fullName,
            employeeId,
            email,
            phoneNumber,
            position,
            facultyId,
            departmentId,
            qualifications,
            specializations,
            workingYears,
            dateOfBirth,
            dateJoined
        } = req.body;

        // Check if employeeId already exists
        const existingPersonnel = await Personnel.findOne({ employeeId });
        if (existingPersonnel) {
            return res.status(400).json({
                success: false,
                message: `Mã nhân viên ${employeeId} đã tồn tại`
            });
        }

        // Check if email already exists
        const existingEmail = await Personnel.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: `Email ${email} đã tồn tại`
            });
        }

        // Validate faculty
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(400).json({
                success: false,
                message: 'Khoa không tồn tại'
            });
        }

        // Validate department if provided
        if (departmentId) {
            const department = await Department.findById(departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn/ngành không tồn tại'
                });
            }
            if (department.facultyId.toString() !== facultyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn/ngành không thuộc khoa được chọn'
                });
            }
        }

        const personnel = new Personnel({
            fullName: fullName.trim(),
            employeeId: employeeId.trim(),
            email: email.toLowerCase().trim(),
            phoneNumber: phoneNumber?.trim(),
            position,
            facultyId,
            departmentId,
            qualifications: qualifications || [],
            specializations: specializations || [],
            workingYears,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            dateJoined: dateJoined ? new Date(dateJoined) : undefined,
            createdBy: req.user.id
        });

        await personnel.save();

        await personnel.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo nhân sự thành công',
            data: personnel
        });

    } catch (error) {
        console.error('Create personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhân sự'
        });
    }
};

const updatePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const personnel = await Personnel.findById(id);
        if (!personnel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân sự'
            });
        }

        // Check employeeId uniqueness if being updated
        if (updateData.employeeId && updateData.employeeId !== personnel.employeeId) {
            const existingPersonnel = await Personnel.findOne({
                employeeId: updateData.employeeId,
                _id: { $ne: id }
            });
            if (existingPersonnel) {
                return res.status(400).json({
                    success: false,
                    message: `Mã nhân viên ${updateData.employeeId} đã tồn tại`
                });
            }
        }

        // Check email uniqueness if being updated
        if (updateData.email && updateData.email.toLowerCase() !== personnel.email) {
            const existingEmail = await Personnel.findOne({
                email: updateData.email.toLowerCase(),
                _id: { $ne: id }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: `Email ${updateData.email} đã tồn tại`
                });
            }
        }

        // Validate faculty if being updated
        if (updateData.facultyId) {
            const faculty = await Faculty.findById(updateData.facultyId);
            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: 'Khoa không tồn tại'
                });
            }
        }

        // Validate department if being updated
        if (updateData.departmentId) {
            const department = await Department.findById(updateData.departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn/ngành không tồn tại'
                });
            }
            const facultyId = updateData.facultyId || personnel.facultyId;
            if (department.facultyId.toString() !== facultyId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Bộ môn/ngành không thuộc khoa được chọn'
                });
            }
        }

        // Update fields
        Object.assign(personnel, updateData);
        if (updateData.email) {
            personnel.email = updateData.email.toLowerCase();
        }

        await personnel.save();

        await personnel.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật nhân sự thành công',
            data: personnel
        });

    } catch (error) {
        console.error('Update personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật nhân sự'
        });
    }
};

const deletePersonnel = async (req, res) => {
    try {
        const { id } = req.params;

        const personnel = await Personnel.findById(id);
        if (!personnel) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân sự'
            });
        }

        // Check if personnel is an expert
        if (personnel.isExpert) {
            const Expert = require('../models/Expert');
            const expert = await Expert.findOne({ personnelId: id });
            if (expert && expert.workload.currentAssignments > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa nhân sự đang là chuyên gia có phân công'
                });
            }
        }

        // Check if personnel is head of faculty/department
        const [facultyCount, departmentCount] = await Promise.all([
            Faculty.countDocuments({ $or: [{ dean: id }, { viceDeans: id }] }),
            Department.countDocuments({ head: id })
        ]);

        if (facultyCount > 0 || departmentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa nhân sự đang giữ chức vụ lãnh đạo'
            });
        }

        await Personnel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa nhân sự thành công'
        });

    } catch (error) {
        console.error('Delete personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa nhân sự'
        });
    }
};

const getPersonnelStatistics = async (req, res) => {
    try {
        const { facultyId } = req.query;

        let matchStage = {};
        if (facultyId) matchStage.facultyId = mongoose.Types.ObjectId(facultyId);

        const stats = await Personnel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalPersonnel: { $sum: 1 },
                    activePersonnel: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    experts: {
                        $sum: { $cond: [{ $eq: ['$isExpert', true] }, 1, 0] }
                    },
                    lecturers: {
                        $sum: { $cond: [{ $eq: ['$position', 'lecturer'] }, 1, 0] }
                    },
                    seniorLecturers: {
                        $sum: { $cond: [{ $eq: ['$position', 'senior_lecturer'] }, 1, 0] }
                    },
                    associateProfessors: {
                        $sum: { $cond: [{ $eq: ['$position', 'associate_professor'] }, 1, 0] }
                    },
                    professors: {
                        $sum: { $cond: [{ $eq: ['$position', 'professor'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalPersonnel: 0,
            activePersonnel: 0,
            experts: 0,
            lecturers: 0,
            seniorLecturers: 0,
            associateProfessors: 0,
            professors: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get personnel statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê nhân sự'
        });
    }
};

const searchPersonnel = async (req, res) => {
    try {
        const { keyword, limit = 10 } = req.query;

        if (!keyword || keyword.trim().length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const personnel = await Personnel.find({
            status: 'active',
            $or: [
                { fullName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { employeeId: { $regex: keyword, $options: 'i' } }
            ]
        })
            .populate('facultyId', 'name')
            .populate('departmentId', 'name')
            .select('fullName employeeId email position facultyId departmentId')
            .limit(parseInt(limit))
            .sort({ fullName: 1 });

        res.json({
            success: true,
            data: personnel
        });

    } catch (error) {
        console.error('Search personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm nhân sự'
        });
    }
};

module.exports = {
    getPersonnel,
    getAllPersonnel,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    getPersonnelStatistics,
    searchPersonnel
};