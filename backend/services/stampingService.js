const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const Evidence = require('../models/Evidence');
const File = require('../models/File');

/**
 * Stamping service for documents
 */

// Stamp types and their default configurations
const STAMP_CONFIGS = {
    official: {
        text: 'CHÍNH THỨC',
        color: '#FF0000',
        fontSize: 16,
        fontFamily: 'Arial',
        borderWidth: 2,
        shape: 'rectangle'
    },
    approval: {
        text: 'ĐÃ DUYỆT',
        color: '#0066CC',
        fontSize: 14,
        fontFamily: 'Arial',
        borderWidth: 2,
        shape: 'rectangle'
    },
    reviewed: {
        text: 'ĐÃ KIỂM DUYỆT',
        color: '#009900',
        fontSize: 14,
        fontFamily: 'Arial',
        borderWidth: 2,
        shape: 'rectangle'
    },
    certified: {
        text: 'ĐÃ XÁC NHẬN',
        color: '#800080',
        fontSize: 14,
        fontFamily: 'Arial',
        borderWidth: 2,
        shape: 'circle'
    },
    custom: {
        color: '#FF0000',
        fontSize: 14,
        fontFamily: 'Arial',
        borderWidth: 2,
        shape: 'rectangle'
    }
};

// Apply stamp to document
const stampDocument = async (documentId, stampOptions, userId) => {
    try {
        const evidence = await Evidence.findById(documentId).populate('files');
        if (!evidence) {
            throw new Error('Tài liệu không tồn tại');
        }

        if (!evidence.files || evidence.files.length === 0) {
            throw new Error('Tài liệu chưa có file để đóng dấu');
        }

        const stampedFiles = [];
        const timestamp = new Date();

        // Process each file
        for (const file of evidence.files) {
            try {
                const stampedFile = await stampFile(file, stampOptions, userId, timestamp);
                stampedFiles.push(stampedFile);
            } catch (error) {
                console.error(`Error stamping file ${file._id}:`, error);
                throw new Error(`Lỗi khi đóng dấu file ${file.originalName}: ${error.message}`);
            }
        }

        // Update evidence metadata
        evidence.metadata = evidence.metadata || {};
        evidence.metadata.stamped = true;
        evidence.metadata.stampedAt = timestamp;
        evidence.metadata.stampedBy = userId;
        evidence.updatedBy = userId;
        await evidence.save();

        // Log stamping activity
        await logStampingActivity(userId, documentId, stampOptions, 'success', {
            stampedFiles: stampedFiles.length,
            timestamp
        });

        return {
            success: true,
            message: 'Đóng dấu tài liệu thành công',
            data: {
                documentId,
                stampedFiles: stampedFiles.length,
                timestamp,
                stampType: stampOptions.stampType
            }
        };

    } catch (error) {
        console.error('Stamp document error:', error);

        // Log failed stamping attempt
        await logStampingActivity(userId, documentId, stampOptions, 'failed', {
            error: error.message
        });

        throw error;
    }
};

// Apply stamp to individual file
const stampFile = async (file, stampOptions, userId, timestamp) => {
    try {
        if (!fs.existsSync(file.filePath)) {
            throw new Error('File không tồn tại');
        }

        // Generate stamp image
        const stampImage = await generateStampImage(stampOptions);

        // Create stamped file path
        const stampedFileName = generateStampedFileName(file.originalName);
        const stampedFilePath = path.join(path.dirname(file.filePath), stampedFileName);

        // Apply stamp based on file type
        switch (file.mimeType) {
            case 'application/pdf':
                await stampPDF(file.filePath, stampedFilePath, stampImage, stampOptions);
                break;
            case 'image/jpeg':
            case 'image/png':
                await stampImage(file.filePath, stampedFilePath, stampImage, stampOptions);
                break;
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                await stampWord(file.filePath, stampedFilePath, stampImage, stampOptions);
                break;
            default:
                throw new Error(`Loại file ${file.mimeType} không hỗ trợ đóng dấu`);
        }

        // Update file record
        file.metadata = file.metadata || {};
        file.metadata.stamped = true;
        file.metadata.stampType = stampOptions.stampType;
        file.metadata.stampedAt = timestamp;
        file.metadata.stampedBy = userId;
        file.metadata.stampPosition = stampOptions.position || { x: 50, y: 50 };

        await file.save();

        return {
            fileId: file._id,
            originalName: file.originalName,
            stampedFileName,
            stampedFilePath,
            stampedAt: timestamp
        };

    } catch (error) {
        console.error('Stamp file error:', error);
        throw error;
    }
};

// Generate stamp image
const generateStampImage = async (stampOptions) => {
    try {
        const { stampType, stampText, stampTemplate = {} } = stampOptions;

        // Get stamp configuration
        const config = { ...STAMP_CONFIGS[stampType], ...stampTemplate };

        // Use custom text if provided
        const text = stampText || config.text;

        // Default dimensions
        const width = config.width || 150;
        const height = config.height || 50;

        // Create canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Set transparent background
        ctx.clearRect(0, 0, width, height);

        // Draw border
        ctx.strokeStyle = config.color;
        ctx.lineWidth = config.borderWidth || 2;

        if (config.shape === 'circle') {
            const radius = Math.min(width, height) / 2 - config.borderWidth;
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            ctx.strokeRect(config.borderWidth / 2, config.borderWidth / 2,
                width - config.borderWidth, height - config.borderWidth);
        }

        // Draw text
        ctx.fillStyle = config.color;
        ctx.font = `bold ${config.fontSize || 14}px ${config.fontFamily || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Handle multi-line text
        const lines = text.split('\n');
        const lineHeight = config.fontSize * 1.2;
        const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, width / 2, startY + index * lineHeight);
        });

        // Add timestamp if required
        if (config.showTimestamp) {
            ctx.font = `${config.fontSize * 0.6}px ${config.fontFamily}`;
            ctx.fillText(
                new Date().toLocaleDateString('vi-VN'),
                width / 2,
                height - 10
            );
        }

        return canvas.toBuffer('image/png');

    } catch (error) {
        console.error('Generate stamp image error:', error);
        throw new Error('Lỗi khi tạo hình ảnh dấu');
    }
};

// Stamp PDF file
const stampPDF = async (inputPath, outputPath, stampImage, stampOptions) => {
    try {
        // This is a placeholder implementation
        // In production, you would use a PDF library like pdf-lib or HummusJS

        // For now, just copy the file and add stamp metadata
        fs.copyFileSync(inputPath, outputPath);

        // Save stamp image separately
        const stampImagePath = outputPath.replace(path.extname(outputPath), '_stamp.png');
        fs.writeFileSync(stampImagePath, stampImage);

        return outputPath;
    } catch (error) {
        console.error('Stamp PDF error:', error);
        throw new Error('Lỗi khi đóng dấu PDF');
    }
};

// Stamp image file
const stampImageFile = async (inputPath, outputPath, stampImage, stampOptions) => {
    try {
        // Load original image
        const originalImage = await loadImage(inputPath);

        // Load stamp image
        const stamp = await loadImage(stampImage);

        // Create canvas with original image dimensions
        const canvas = createCanvas(originalImage.width, originalImage.height);
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(originalImage, 0, 0);

        // Calculate stamp position
        const position = stampOptions.position || { x: 50, y: 50 };
        const x = position.x;
        const y = position.y;

        // Draw stamp with transparency
        ctx.globalAlpha = 0.8;
        ctx.drawImage(stamp, x, y);

        // Save stamped image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        return outputPath;
    } catch (error) {
        console.error('Stamp image error:', error);
        throw new Error('Lỗi khi đóng dấu hình ảnh');
    }
};

// Stamp Word document
const stampWord = async (inputPath, outputPath, stampImage, stampOptions) => {
    try {
        // This is a placeholder implementation
        // In production, you would use a library like docx to manipulate Word documents

        // For now, just copy the file
        fs.copyFileSync(inputPath, outputPath);

        // Save stamp image separately
        const stampImagePath = outputPath.replace(path.extname(outputPath), '_stamp.png');
        fs.writeFileSync(stampImagePath, stampImage);

        return outputPath;
    } catch (error) {
        console.error('Stamp Word error:', error);
        throw new Error('Lỗi khi đóng dấu Word');
    }
};

// Generate preview of stamp
const generateStampPreview = async (stampOptions) => {
    try {
        const stampImage = await generateStampImage(stampOptions);

        // Convert to base64 for preview
        const base64Image = `data:image/png;base64,${stampImage.toString('base64')}`;

        return {
            success: true,
            data: {
                preview: base64Image,
                stampType: stampOptions.stampType,
                dimensions: {
                    width: stampOptions.stampTemplate?.width || 150,
                    height: stampOptions.stampTemplate?.height || 50
                }
            }
        };
    } catch (error) {
        console.error('Generate stamp preview error:', error);
        throw error;
    }
};

// Bulk stamp multiple documents
const bulkStampDocuments = async (documentIds, stampOptions, userId) => {
    try {
        const results = {
            success: [],
            failed: [],
            total: documentIds.length
        };

        for (const documentId of documentIds) {
            try {
                const result = await stampDocument(documentId, stampOptions, userId);
                results.success.push({
                    documentId,
                    ...result.data
                });
            } catch (error) {
                results.failed.push({
                    documentId,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: `Đóng dấu thành công ${results.success.length}/${results.total} tài liệu`,
            data: results
        };

    } catch (error) {
        console.error('Bulk stamp documents error:', error);
        throw error;
    }
};

// Remove stamp from document
const removeStamp = async (documentId, userId) => {
    try {
        const evidence = await Evidence.findById(documentId).populate('files');
        if (!evidence) {
            throw new Error('Tài liệu không tồn tại');
        }

        // Check if document is stamped
        if (!evidence.metadata?.stamped) {
            throw new Error('Tài liệu chưa được đóng dấu');
        }

        // Remove stamp from files
        for (const file of evidence.files) {
            if (file.metadata?.stamped) {
                // In production, you would restore the original file
                // For now, just update metadata
                file.metadata.stamped = false;
                file.metadata.stampRemovedAt = new Date();
                file.metadata.stampRemovedBy = userId;
                await file.save();
            }
        }

        // Update evidence metadata
        evidence.metadata.stamped = false;
        evidence.metadata.stampRemovedAt = new Date();
        evidence.metadata.stampRemovedBy = userId;
        evidence.updatedBy = userId;
        await evidence.save();

        return {
            success: true,
            message: 'Gỡ dấu thành công'
        };

    } catch (error) {
        console.error('Remove stamp error:', error);
        throw error;
    }
};

// Get stamp templates
const getStampTemplates = () => {
    return {
        success: true,
        data: Object.keys(STAMP_CONFIGS).map(type => ({
            type,
            name: getStampTypeName(type),
            config: STAMP_CONFIGS[type]
        }))
    };
};

// Helper functions
const generateStampedFileName = (originalName) => {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();

    return `${name}_stamped_${timestamp}${ext}`;
};

const getStampTypeName = (type) => {
    const names = {
        official: 'Dấu chính thức',
        approval: 'Dấu đã duyệt',
        reviewed: 'Dấu đã kiểm duyệt',
        certified: 'Dấu đã xác nhận',
        custom: 'Dấu tùy chỉnh'
    };
    return names[type] || type;
};

// Log stamping activity
const logStampingActivity = async (userId, documentId, stampOptions, status, details) => {
    try {
        const History = require('../models/History');

        await History.create({
            userId,
            action: 'stamp',
            module: 'evidence',
            targetType: 'Evidence',
            targetId: documentId,
            description: `${status === 'success' ? 'Đóng dấu tài liệu thành công' : 'Đóng dấu tài liệu thất bại'}`,
            details: {
                stampType: stampOptions.stampType,
                status,
                ...details
            },
            status
        });
    } catch (error) {
        console.error('Log stamping activity error:', error);
    }
};

module.exports = {
    stampDocument,
    stampFile,
    generateStampPreview,
    bulkStampDocuments,
    removeStamp,
    getStampTemplates,
    generateStampImage
};