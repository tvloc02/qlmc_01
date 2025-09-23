const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { FILE_SIZE_LIMITS, ALLOWED_FILE_TYPES, HTTP_STATUS } = require('../utils/constants');

const uploadDir = path.join(__dirname, '..', 'uploads');
const tempDir = path.join(uploadDir, 'temp');
const evidenceDir = path.join(uploadDir, 'evidences');

[uploadDir, tempDir, evidenceDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destination = req.evidenceId ? evidenceDir : tempDir;
        cb(null, destination);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        ...ALLOWED_FILE_TYPES.DOCUMENTS,
        ...ALLOWED_FILE_TYPES.IMAGES,
        ...ALLOWED_FILE_TYPES.ARCHIVES
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_SIZE_LIMITS.DOCUMENT,
        files: 10
    }
});

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'File too large'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Too many files'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Unexpected field'
            });
        }
    }

    if (error.message.includes('File type')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

const cleanupTempFiles = () => {
    try {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Temp file cleanup error:', error);
    }
};

setInterval(cleanupTempFiles, 4 * 60 * 60 * 1000); // Every 4 hours

module.exports = {
    upload,
    handleUploadError,
    cleanupTempFiles
};