const mongoose = require('mongoose');

const signingInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên cấu hình ký là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên không được quá 100 ký tự']
    },

    type: {
        type: String,
        enum: ['individual', 'organizational'],
        default: 'individual'
    },

    certificate: {
        issuer: {
            type: String,
            required: [true, 'Tổ chức cấp chứng chỉ là bắt buộc']
        },
        serialNumber: String,
        validFrom: {
            type: Date,
            required: [true, 'Ngày hiệu lực là bắt buộc']
        },
        validTo: {
            type: Date,
            required: [true, 'Ngày hết hạn là bắt buộc']
        },
        algorithm: {
            type: String,
            default: 'RSA-SHA256'
        },
        keySize: {
            type: Number,
            default: 2048
        }
    },

    signerInfo: {
        fullName: {
            type: String,
            required: [true, 'Tên người ký là bắt buộc']
        },
        position: String,
        organization: String,
        email: String,
        phone: String
    },

    template: {
        signatureImage: String, // Base64 hoặc URL
        position: {
            x: { type: Number, default: 100 },
            y: { type: Number, default: 100 }
        },
        size: {
            width: { type: Number, default: 150 },
            height: { type: Number, default: 50 }
        },
        appearance: {
            showName: { type: Boolean, default: true },
            showDate: { type: Boolean, default: true },
            showReason: { type: Boolean, default: false },
            font: { type: String, default: 'Arial' },
            fontSize: { type: Number, default: 12 }
        }
    },

    permissions: {
        allowedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        allowedRoles: [{
            type: String,
            enum: ['admin', 'manager', 'staff', 'expert']
        }],
        documentTypes: [{
            type: String,
            enum: ['evidence', 'report', 'certificate', 'approval']
        }]
    },

    security: {
        requirePassword: {
            type: Boolean,
            default: true
        },
        requireOTP: {
            type: Boolean,
            default: false
        },
        timestampServer: String,
        hashAlgorithm: {
            type: String,
            default: 'SHA-256'
        }
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'expired', 'revoked'],
        default: 'active'
    },

    usageCount: {
        type: Number,
        default: 0
    },

    lastUsed: Date,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

signingInfoSchema.index({ status: 1 });
signingInfoSchema.index({ 'certificate.validTo': 1 });

signingInfoSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

signingInfoSchema.methods.incrementUsage = function() {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return this.save();
};

signingInfoSchema.methods.isExpired = function() {
    return new Date() > this.certificate.validTo;
};

module.exports = mongoose.model('SigningInfo', signingInfoSchema);