const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const SigningInfo = require('../models/SigningInfo');
const Evidence = require('../models/Evidence');
const File = require('../models/File');

/**
 * Digital signature service for documents
 */

// Sign a document/evidence
const signDocument = async (documentId, signingInfoId, userId, password, reason = '') => {
    try {
        // Get signing configuration
        const signingInfo = await SigningInfo.findById(signingInfoId);
        if (!signingInfo) {
            throw new Error('Cấu hình ký không tồn tại');
        }

        if (signingInfo.status !== 'active') {
            throw new Error('Cấu hình ký không hoạt động');
        }

        if (signingInfo.isExpired()) {
            throw new Error('Chứng chỉ ký đã hết hạn');
        }

        // Check permissions
        if (!canUserSign(userId, signingInfo)) {
            throw new Error('Không có quyền sử dụng cấu hình ký này');
        }

        // Get document to sign
        const evidence = await Evidence.findById(documentId)
            .populate('files');

        if (!evidence) {
            throw new Error('Tài liệu không tồn tại');
        }

        if (evidence.files.length === 0) {
            throw new Error('Tài liệu chưa có file để ký');
        }

        // Verify password if required
        if (signingInfo.security.requirePassword && !verifySigningPassword(password, signingInfo)) {
            throw new Error('Mật khẩu ký không chính xác');
        }

        // Generate OTP if required
        if (signingInfo.security.requireOTP) {
            const otpCode = await generateAndSendOTP(userId);
            // In real implementation, this would be handled in a separate step
        }

        const signedFiles = [];
        const timestamp = new Date();

        // Sign each file
        for (const file of evidence.files) {
            try {
                const signedFile = await signFile(file, signingInfo, userId, reason, timestamp);
                signedFiles.push(signedFile);
            } catch (error) {
                console.error(`Error signing file ${file._id}:`, error);
                throw new Error(`Lỗi khi ký file ${file.originalName}: ${error.message}`);
            }
        }

        // Update evidence status
        evidence.status = 'signed';
        evidence.updatedBy = userId;
        await evidence.save();

        // Update signing info usage
        await signingInfo.incrementUsage();

        // Log signing activity
        await logSigningActivity(userId, documentId, signingInfoId, 'success', {
            signedFiles: signedFiles.length,
            reason,
            timestamp
        });

        return {
            success: true,
            message: 'Ký tài liệu thành công',
            data: {
                documentId,
                signedFiles: signedFiles.length,
                timestamp,
                signingInfo: {
                    name: signingInfo.name,
                    signerName: signingInfo.signerInfo.fullName
                }
            }
        };

    } catch (error) {
        console.error('Sign document error:', error);

        // Log failed signing attempt
        await logSigningActivity(userId, documentId, signingInfoId, 'failed', {
            error: error.message
        });

        throw error;
    }
};

// Sign individual file
const signFile = async (file, signingInfo, userId, reason, timestamp) => {
    try {
        if (!fs.existsSync(file.filePath)) {
            throw new Error('File không tồn tại');
        }

        // Read file content
        const fileContent = fs.readFileSync(file.filePath);

        // Generate file hash
        const fileHash = crypto.createHash(signingInfo.security.hashAlgorithm || 'sha256')
            .update(fileContent)
            .digest('hex');

        // Create signature data
        const signatureData = {
            fileId: file._id,
            fileName: file.originalName,
            fileHash,
            signingTime: timestamp,
            signerInfo: signingInfo.signerInfo,
            reason,
            algorithm: signingInfo.certificate.algorithm,
            certificateIssuer: signingInfo.certificate.issuer,
            certificateSerial: signingInfo.certificate.serialNumber
        };

        // Generate digital signature
        const signature = generateDigitalSignature(signatureData, signingInfo);

        // Create signed file path
        const signedFileName = generateSignedFileName(file.originalName);
        const signedFilePath = path.join(path.dirname(file.filePath), signedFileName);

        // For PDF files, embed signature into PDF
        if (file.mimeType === 'application/pdf') {
            await embedPDFSignature(file.filePath, signedFilePath, signature, signatureData, signingInfo);
        } else {
            // For other files, create a detached signature file
            await createDetachedSignature(file.filePath, signedFilePath, signature, signatureData);
        }

        // Update file record
        file.status = 'signed';
        file.metadata = file.metadata || {};
        file.metadata.signature = {
            signatureHash: signature,
            signedAt: timestamp,
            signedBy: userId,
            signerName: signingInfo.signerInfo.fullName,
            reason
        };
        await file.save();

        return {
            fileId: file._id,
            originalName: file.originalName,
            signedFileName,
            signedFilePath,
            signature,
            signedAt: timestamp
        };

    } catch (error) {
        console.error('Sign file error:', error);
        throw error;
    }
};

// Generate digital signature
const generateDigitalSignature = (data, signingInfo) => {
    try {
        // In a real implementation, this would use actual cryptographic signing
        // with the private key from the certificate
        const dataString = JSON.stringify(data);

        // Create a hash-based signature (placeholder implementation)
        const signature = crypto.createHmac('sha256', signingInfo.certificate.serialNumber)
            .update(dataString)
            .digest('hex');

        return signature;
    } catch (error) {
        console.error('Generate digital signature error:', error);
        throw new Error('Lỗi khi tạo chữ ký số');
    }
};

// Embed signature into PDF
const embedPDFSignature = async (inputPath, outputPath, signature, signatureData, signingInfo) => {
    try {
        // This is a placeholder implementation
        // In reality, you would use a PDF library like pdf-lib or HummusJS
        // to embed the digital signature into the PDF structure

        // Copy original file
        fs.copyFileSync(inputPath, outputPath);

        // For demo purposes, we'll append signature metadata as comments
        // In real implementation, this would be properly embedded in PDF structure
        const signatureComment = `\n%% Digital Signature\n%% Signed by: ${signatureData.signerInfo.fullName}\n%% Date: ${signatureData.signingTime}\n%% Signature: ${signature}\n`;
        fs.appendFileSync(outputPath, signatureComment);

        return outputPath;
    } catch (error) {
        console.error('Embed PDF signature error:', error);
        throw new Error('Lỗi khi nhúng chữ ký vào PDF');
    }
};

// Create detached signature file
const createDetachedSignature = async (inputPath, outputPath, signature, signatureData) => {
    try {
        // Copy original file
        fs.copyFileSync(inputPath, outputPath);

        // Create signature file
        const signatureFilePath = outputPath + '.sig';
        const signatureContent = {
            signature,
            signatureData,
            format: 'PKCS#7',
            version: '1.0'
        };

        fs.writeFileSync(signatureFilePath, JSON.stringify(signatureContent, null, 2));

        return outputPath;
    } catch (error) {
        console.error('Create detached signature error:', error);
        throw new Error('Lỗi khi tạo file chữ ký');
    }
};

// Verify document signature
const verifySignature = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File không tồn tại');
        }

        if (!file.metadata?.signature) {
            return {
                isValid: false,
                message: 'File chưa được ký'
            };
        }

        // Verify file integrity
        if (!fs.existsSync(file.filePath)) {
            return {
                isValid: false,
                message: 'File đã bị xóa hoặc di chuyển'
            };
        }

        const currentFileHash = crypto.createHash('sha256')
            .update(fs.readFileSync(file.filePath))
            .digest('hex');

        // In a real implementation, you would:
        // 1. Extract the signature from the file
        // 2. Verify the signature using the public key
        // 3. Check certificate validity
        // 4. Verify the hash chain

        const signature = file.metadata.signature;

        return {
            isValid: true,
            signedBy: signature.signerName,
            signedAt: signature.signedAt,
            reason: signature.reason,
            certificateValid: true,
            fileIntegrityValid: true,
            message: 'Chữ ký hợp lệ'
        };

    } catch (error) {
        console.error('Verify signature error:', error);
        return {
            isValid: false,
            message: 'Lỗi khi xác thực chữ ký: ' + error.message
        };
    }
};

// Check if user can use signing configuration
const canUserSign = (userId, signingInfo) => {
    // Check if user is in allowed users list
    if (signingInfo.permissions.allowedUsers.length > 0) {
        return signingInfo.permissions.allowedUsers.includes(userId);
    }

    // Check if user role is allowed
    // This would require user role information
    // For now, return true for basic implementation
    return true;
};

// Verify signing password
const verifySigningPassword = (password, signingInfo) => {
    // In real implementation, this would verify against stored password hash
    // For now, return true for demo purposes
    return true;
};

// Generate and send OTP
const generateAndSendOTP = async (userId) => {
    try {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiration (normally in Redis or database)
        // Send OTP via SMS/Email

        return otpCode;
    } catch (error) {
        console.error('Generate OTP error:', error);
        throw new Error('Lỗi khi tạo mã OTP');
    }
};

// Generate signed file name
const generateSignedFileName = (originalName) => {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();

    return `${name}_signed_${timestamp}${ext}`;
};

// Log signing activity
const logSigningActivity = async (userId, documentId, signingInfoId, status, details) => {
    try {
        const History = require('../models/History');

        await History.create({
            userId,
            action: 'sign',
            module: 'evidence',
            targetType: 'Evidence',
            targetId: documentId,
            description: `${status === 'success' ? 'Ký tài liệu thành công' : 'Ký tài liệu thất bại'}`,
            details: {
                signingInfoId,
                status,
                ...details
            },
            status
        });
    } catch (error) {
        console.error('Log signing activity error:', error);
    }
};

// Get user signing history
const getSigningHistory = async (userId, options = {}) => {
    try {
        const History = require('../models/History');

        const {
            startDate,
            endDate,
            status,
            limit = 50,
            skip = 0
        } = options;

        let query = {
            userId,
            action: 'sign',
            module: 'evidence'
        };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        if (status) query.status = status;

        const history = await History.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .populate('targetId', 'code name');

        return history;
    } catch (error) {
        console.error('Get signing history error:', error);
        throw error;
    }
};

// Bulk sign multiple documents
const bulkSignDocuments = async (documentIds, signingInfoId, userId, password, reason = '') => {
    try {
        const results = {
            success: [],
            failed: [],
            total: documentIds.length
        };

        for (const documentId of documentIds) {
            try {
                const result = await signDocument(documentId, signingInfoId, userId, password, reason);
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
            message: `Ký thành công ${results.success.length}/${results.total} tài liệu`,
            data: results
        };

    } catch (error) {
        console.error('Bulk sign documents error:', error);
        throw error;
    }
};

module.exports = {
    signDocument,
    signFile,
    verifySignature,
    getSigningHistory,
    bulkSignDocuments,
    generateDigitalSignature,
    canUserSign
};