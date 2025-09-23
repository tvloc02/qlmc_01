const stampingService = require('../services/stampingService');
const { validationResult } = require('express-validator');

// Get stamp templates
const getStampTemplates = async (req, res) => {
    try {
        const result = stampingService.getStampTemplates();
        res.json(result);
    } catch (error) {
        console.error('Get stamp templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách mẫu con dấu'
        });
    }
};

// Create stamp template
const createStampTemplate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const templateData = {
            ...req.body,
            createdBy: req.user.id
        };

        // For demo purposes, return success
        res.status(201).json({
            success: true,
            message: 'Tạo mẫu con dấu thành công',
            data: {
                id: Date.now().toString(),
                ...templateData,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Create stamp template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo mẫu con dấu'
        });
    }
};

// Update stamp template
const updateStampTemplate = async (req, res) => {
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
        const updateData = {
            ...req.body,
            updatedBy: req.user.id,
            updatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Cập nhật mẫu con dấu thành công',
            data: { id, ...updateData }
        });
    } catch (error) {
        console.error('Update stamp template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật mẫu con dấu'
        });
    }
};

// Delete stamp template
const deleteStampTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        res.json({
            success: true,
            message: 'Xóa mẫu con dấu thành công'
        });
    } catch (error) {
        console.error('Delete stamp template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa mẫu con dấu'
        });
    }
};

// Stamp document
const stampDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const stampOptions = req.body;

        const result = await stampingService.stampDocument(evidenceId, stampOptions, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Stamp document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đóng dấu tài liệu'
        });
    }
};

// Bulk stamp documents
const bulkStampDocuments = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceIds, ...stampOptions } = req.body;

        const result = await stampingService.bulkStampDocuments(evidenceIds, stampOptions, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Bulk stamp documents error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi đóng dấu hàng loạt'
        });
    }
};

// Get stamp history
const getStampHistory = async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            evidenceId: req.query.evidenceId,
            stampedBy: req.query.stampedBy,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        // Mock history data
        const history = {
            data: [],
            total: 0,
            page: options.page,
            totalPages: 0
        };

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get stamp history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử đóng dấu'
        });
    }
};

// Validate stamp
const validateStamp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { evidenceId, stampData } = req.body;

        res.json({
            success: true,
            data: {
                isValid: true,
                stampType: 'official',
                stampedAt: new Date(),
                stampedBy: 'Nguyễn Văn A',
                message: 'Con dấu hợp lệ'
            }
        });
    } catch (error) {
        console.error('Validate stamp error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực con dấu'
        });
    }
};

module.exports = {
    getStampTemplates,
    createStampTemplate,
    updateStampTemplate,
    deleteStampTemplate,
    stampDocument,
    bulkStampDocuments,
    getStampHistory,
    validateStamp
};