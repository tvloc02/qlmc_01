const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Personnel = require('../models/Personnel');

const getDepartments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            facultyId,
            type,
            status,
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
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (facultyId) query.facultyId = facultyId;
        if (type) query.type = type;
        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [departments, total] = await Promise.all([
            Department.find(query)
                .populate('facultyId', 'name code')
                .populate('head', 'fullName email position')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Department.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                departments,
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
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách bộ môn/ngành'
        });
    }
};

const getAllDepartments = async (req, res) => {
    try {
        const { facultyId } = req.query;

        let query = { status: 'active' };
        if (facultyId) query.facultyId = facultyId;

        const departments = await Department.find(query)
            .populate('facultyId', 'name code')
            .select('name code type facultyId')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: departments
        });

    } catch (error) {
        console.error('Get all departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách bộ môn/ngành'
        });
    }
};

const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id)
            .populate('facultyId', 'name code description')
            .populate('head', 'fullName email position employeeId')
            .populate('createdBy', 'fullName email');

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ môn/ngành'
            });
        }

        res.json({
            success: true,
            data: department
        });

    } catch (error) {
        console.error('Get department by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin bộ môn/ngành'
        });
    }
};

const createDepartment = async (req, res) => {
    try {
        const {
            name,
            code,
            type,
            facultyId,
            head,
            description,
            trainingLevel
        } = req.body;

        // Check if code already exists
        const existingDepartment = await Department.findOne({ code: code.toUpperCase() });
        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                message: `Mã bộ môn/ngành ${code} đã tồn tại`
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

        // Validate head if provided
        if (head) {
            const headPersonnel = await Personnel.findById(head);
            if (!headPersonnel) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng bộ môn/ngành không tồn tại'
                });
            }
            if (headPersonnel.facultyId.toString() !== facultyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng bộ môn/ngành phải thuộc khoa này'
                });
            }
        }

        const department = new Department({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            type,
            facultyId,
            head,
            description: description?.trim(),
            trainingLevel: trainingLevel || [],
            createdBy: req.user.id
        });

        await department.save();

        await department.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'head', select: 'fullName email position' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo bộ môn/ngành thành công',
            data: department
        });

    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo bộ môn/ngành'
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ môn/ngành'
            });
        }

        // Check code uniqueness if being updated
        if (updateData.code && updateData.code.toUpperCase() !== department.code) {
            const existingDepartment = await Department.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingDepartment) {
                return res.status(400).json({
                    success: false,
                    message: `Mã bộ môn/ngành ${updateData.code} đã tồn tại`
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

        // Validate head if being updated
        if (updateData.head) {
            const headPersonnel = await Personnel.findById(updateData.head);
            if (!headPersonnel) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng bộ môn/ngành không tồn tại'
                });
            }
            const facultyId = updateData.facultyId || department.facultyId;
            if (headPersonnel.facultyId.toString() !== facultyId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng bộ môn/ngành phải thuộc khoa này'
                });
            }
        }

        // Update fields
        Object.assign(department, updateData);
        if (updateData.code) {
            department.code = updateData.code.toUpperCase();
        }

        await department.save();

        await department.populate([
            { path: 'facultyId', select: 'name code' },
            { path: 'head', select: 'fullName email position' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật bộ môn/ngành thành công',
            data: department
        });

    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật bộ môn/ngành'
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ môn/ngành'
            });
        }

        // Check if department has personnel
        const personnelCount = await Personnel.countDocuments({ departmentId: id });
        if (personnelCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa bộ môn/ngành đang có nhân sự'
            });
        }

        await Department.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa bộ môn/ngành thành công'
        });

    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa bộ môn/ngành'
        });
    }
};

const getDepartmentPersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const { position } = req.query;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ môn/ngành'
            });
        }

        let query = { departmentId: id, status: 'active' };
        if (position) query.position = position;

        const personnel = await Personnel.find(query)
            .select('fullName employeeId email position dateJoined')
            .sort({ fullName: 1 });

        res.json({
            success: true,
            data: personnel
        });

    } catch (error) {
        console.error('Get department personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhân sự bộ môn/ngành'
        });
    }
};

const getDepartmentsByFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        const departments = await Department.find({
            facultyId,
            status: 'active'
        })
            .select('name code type trainingLevel')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: departments
        });

    } catch (error) {
        console.error('Get departments by faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách bộ môn/ngành theo khoa'
        });
    }
};

const getDepartmentStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ môn/ngành'
            });
        }

        const stats = await Personnel.aggregate([
            { $match: { departmentId: mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: null,
                    totalPersonnel: { $sum: 1 },
                    activePersonnel: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    lecturers: {
                        $sum: { $cond: [{ $eq: ['$position', 'lecturer'] }, 1, 0] }
                    },
                    seniorLecturers: {
                        $sum: { $cond: [{ $eq: ['$position', 'senior_lecturer'] }, 1, 0] }
                    },
                    staff: {
                        $sum: { $cond: [{ $eq: ['$position', 'staff'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalPersonnel: 0,
            activePersonnel: 0,
            lecturers: 0,
            seniorLecturers: 0,
            staff: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get department statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê bộ môn/ngành'
        });
    }
};

module.exports = {
    getDepartments,
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentPersonnel,
    getDepartmentsByFaculty,
    getDepartmentStatistics
};