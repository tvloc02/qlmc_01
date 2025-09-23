const Faculty = require('../models/Faculty');
const Personnel = require('../models/Personnel');

const getFaculties = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
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

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [faculties, total] = await Promise.all([
            Faculty.find(query)
                .populate('dean', 'fullName email position')
                .populate('viceDeans', 'fullName email position')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Faculty.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                faculties,
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
        console.error('Get faculties error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách khoa'
        });
    }
};

const getAllFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find({ status: 'active' })
            .select('name code')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: faculties
        });

    } catch (error) {
        console.error('Get all faculties error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách khoa'
        });
    }
};

const getFacultyById = async (req, res) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id)
            .populate('dean', 'fullName email position employeeId')
            .populate('viceDeans', 'fullName email position employeeId')
            .populate('createdBy', 'fullName email');

        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        res.json({
            success: true,
            data: faculty
        });

    } catch (error) {
        console.error('Get faculty by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin khoa'
        });
    }
};

const createFaculty = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            dean,
            viceDeans,
            establishedDate,
            contactInfo
        } = req.body;

        // Check if code already exists
        const existingFaculty = await Faculty.findOne({ code: code.toUpperCase() });
        if (existingFaculty) {
            return res.status(400).json({
                success: false,
                message: `Mã khoa ${code} đã tồn tại`
            });
        }

        // Validate dean if provided
        if (dean) {
            const deanPersonnel = await Personnel.findById(dean);
            if (!deanPersonnel) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng khoa không tồn tại'
                });
            }
        }

        // Validate vice deans if provided
        if (viceDeans && viceDeans.length > 0) {
            const viceDeanPersonnel = await Personnel.find({ _id: { $in: viceDeans } });
            if (viceDeanPersonnel.length !== viceDeans.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Một số phó trưởng khoa không tồn tại'
                });
            }
        }

        const faculty = new Faculty({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            description: description?.trim(),
            dean,
            viceDeans: viceDeans || [],
            establishedDate: establishedDate ? new Date(establishedDate) : undefined,
            contactInfo: contactInfo || {},
            createdBy: req.user.id
        });

        await faculty.save();

        await faculty.populate([
            { path: 'dean', select: 'fullName email position' },
            { path: 'viceDeans', select: 'fullName email position' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo khoa thành công',
            data: faculty
        });

    } catch (error) {
        console.error('Create faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo khoa'
        });
    }
};

const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        // Check code uniqueness if being updated
        if (updateData.code && updateData.code.toUpperCase() !== faculty.code) {
            const existingFaculty = await Faculty.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingFaculty) {
                return res.status(400).json({
                    success: false,
                    message: `Mã khoa ${updateData.code} đã tồn tại`
                });
            }
        }

        // Validate dean if being updated
        if (updateData.dean) {
            const deanPersonnel = await Personnel.findById(updateData.dean);
            if (!deanPersonnel) {
                return res.status(400).json({
                    success: false,
                    message: 'Trưởng khoa không tồn tại'
                });
            }
        }

        // Validate vice deans if being updated
        if (updateData.viceDeans && updateData.viceDeans.length > 0) {
            const viceDeanPersonnel = await Personnel.find({ _id: { $in: updateData.viceDeans } });
            if (viceDeanPersonnel.length !== updateData.viceDeans.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Một số phó trưởng khoa không tồn tại'
                });
            }
        }

        // Update fields
        Object.assign(faculty, updateData);
        if (updateData.code) {
            faculty.code = updateData.code.toUpperCase();
        }

        await faculty.save();

        await faculty.populate([
            { path: 'dean', select: 'fullName email position' },
            { path: 'viceDeans', select: 'fullName email position' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật khoa thành công',
            data: faculty
        });

    } catch (error) {
        console.error('Update faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật khoa'
        });
    }
};

const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        // Check if faculty has personnel
        const personnelCount = await Personnel.countDocuments({ facultyId: id });
        if (personnelCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa khoa đang có nhân sự'
            });
        }

        await Faculty.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa khoa thành công'
        });

    } catch (error) {
        console.error('Delete faculty error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa khoa'
        });
    }
};

const getFacultyPersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const { position } = req.query;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        let query = { facultyId: id, status: 'active' };
        if (position) query.position = position;

        const personnel = await Personnel.find(query)
            .select('fullName employeeId email position dateJoined')
            .sort({ fullName: 1 });

        res.json({
            success: true,
            data: personnel
        });

    } catch (error) {
        console.error('Get faculty personnel error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhân sự khoa'
        });
    }
};

const getFacultyStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoa'
            });
        }

        const stats = await Personnel.aggregate([
            { $match: { facultyId: mongoose.Types.ObjectId(id) } },
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
        console.error('Get faculty statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê khoa'
        });
    }
};

module.exports = {
    getFaculties,
    getAllFaculties,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getFacultyPersonnel,
    getFacultyStatistics
};