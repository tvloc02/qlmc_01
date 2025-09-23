const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, query } = require('express-validator');
const { auth, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    parseExcelFile,
    validateImportData,
    createExcelTemplate,
    exportStandardsToExcel
} = require('../utils/excelUtils');
const { Standard } = require('../models/Program');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ hỗ trợ file Excel (.xlsx, .xls)'), false);
        }
    }
});

// Download template
router.get('/template', auth, (req, res) => {
    try {
        const templateBuffer = createExcelTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Template_Tieu_chuan.xlsx');
        res.send(templateBuffer);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo template'
        });
    }
});

// Parse and validate Excel file
router.post('/parse',
    auth,
    requireManager,
    upload.single('file'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file được tải lên'
                });
            }

            const parseResult = parseExcelFile(req.file.buffer);

            if (!parseResult.success) {
                return res.status(400).json({
                    success: false,
                    message: parseResult.error
                });
            }

            const validationResult = validateImportData(parseResult.data);

            res.json({
                success: true,
                data: {
                    ...validationResult,
                    summary: {
                        total: parseResult.data.length,
                        valid: validationResult.valid.length,
                        invalid: validationResult.invalid.length,
                        duplicates: validationResult.duplicates.length
                    }
                }
            });

        } catch (error) {
            console.error('Parse Excel error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xử lý file Excel'
            });
        }
    }
);

// Import standards from Excel
router.post('/import',
    auth,
    requireManager,
    [
        body('programId')
            .notEmpty()
            .withMessage('ID chương trình là bắt buộc')
            .isMongoId()
            .withMessage('ID chương trình không hợp lệ'),
        body('organizationId')
            .notEmpty()
            .withMessage('ID tổ chức là bắt buộc')
            .isMongoId()
            .withMessage('ID tổ chức không hợp lệ'),
        body('standards')
            .isArray()
            .withMessage('Danh sách tiêu chuẩn phải là mảng')
            .notEmpty()
            .withMessage('Danh sách tiêu chuẩn không được rỗng')
    ],
    validation,
    async (req, res) => {
        try {
            const { programId, organizationId, standards } = req.body;

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Process standards
            for (const standardData of standards) {
                try {
                    // Check if code already exists
                    const existingStandard = await Standard.findOne({
                        programId,
                        organizationId,
                        code: standardData.code.toString().padStart(2, '0')
                    });

                    if (existingStandard) {
                        errorCount++;
                        errors.push({
                            code: standardData.code,
                            name: standardData.name,
                            error: `Mã tiêu chuẩn ${standardData.code} đã tồn tại`
                        });
                        continue;
                    }

                    const standard = new Standard({
                        name: standardData.name.trim(),
                        code: standardData.code.toString().padStart(2, '0'),
                        description: standardData.description?.trim() || '',
                        programId,
                        organizationId,
                        order: parseInt(standardData.order) || 1,
                        weight: standardData.weight ? parseFloat(standardData.weight) : undefined,
                        objectives: standardData.objectives?.trim() || '',
                        guidelines: standardData.guidelines?.trim() || '',
                        status: standardData.status || 'draft',
                        evaluationCriteria: [],
                        createdBy: req.user.id,
                        updatedBy: req.user.id
                    });

                    await standard.save();
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push({
                        code: standardData.code,
                        name: standardData.name,
                        error: error.message || 'Lỗi không xác định'
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    successCount,
                    errorCount,
                    errors,
                    summary: {
                        total: standards.length,
                        processed: successCount + errorCount,
                        success: successCount,
                        failed: errorCount
                    }
                }
            });

        } catch (error) {
            console.error('Import standards error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi import dữ liệu'
            });
        }
    }
);

// Export standards to Excel
router.get('/export',
    auth,
    [
        query('programId')
            .notEmpty()
            .withMessage('ID chương trình là bắt buộc')
            .isMongoId()
            .withMessage('ID chương trình không hợp lệ'),
        query('organizationId')
            .notEmpty()
            .withMessage('ID tổ chức là bắt buộc')
            .isMongoId()
            .withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { programId, organizationId } = req.query;

            const exportResult = await exportStandardsToExcel(programId, organizationId);

            if (!exportResult.success) {
                return res.status(500).json({
                    success: false,
                    message: exportResult.error
                });
            }

            // Generate filename
            const date = new Date().toISOString().split('T')[0];
            const filename = `Tieu_chuan_${date}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(exportResult.buffer);

        } catch (error) {
            console.error('Export standards error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất dữ liệu'
            });
        }
    }
);

module.exports = router;