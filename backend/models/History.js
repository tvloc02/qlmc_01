const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'ID người dùng là bắt buộc']
    },

    action: {
        type: String,
        enum: [
            'login', 'logout',
            'create', 'read', 'update', 'delete',
            'upload', 'download',
            'sign', 'approve', 'reject',
            'publish', 'unpublish',
            'export', 'import',
            'status_change', 'digital_sign',
            'evidence_approve', 'evidence_reject', 'evidence_cancel', 'evidence_initiate'
        ],
        required: [true, 'Hành động là bắt buộc']
    },

    module: {
        type: String,
        enum: [
            'auth', 'evidence', 'standards', 'criteria',
            'experts', 'assessment', 'reports', 'documents',
            'workflow', 'users', 'configuration', 'evidence_workflow',
            'programs', 'organizations', 'files'
        ],
        required: [true, 'Module là bắt buộc']
    },

    targetType: {
        type: String,
        enum: [
            'Evidence', 'Standard', 'Criteria', 'Expert',
            'Program', 'Organization', 'File', 'User',
            'AssessmentProgram', 'SigningInfo', 'Faculty',
            'Department', 'Personnel', 'UserGroup'
        ]
    },

    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },

    description: {
        type: String,
        required: [true, 'Mô tả hành động là bắt buộc'],
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    details: {
        oldValues: mongoose.Schema.Types.Mixed,
        newValues: mongoose.Schema.Types.Mixed,
        metadata: mongoose.Schema.Types.Mixed,
        oldStatus: String,
        newStatus: String,
        hasSigningProcess: Boolean,
        signedFiles: Number,
        reason: String,
        location: String,
        timestamp: Date,
        signatureLevel: String,
        error: String
    },

    ipAddress: {
        type: String,
        validate: {
            validator: function(ip) {
                if (!ip) return true;
                return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) ||
                    /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/.test(ip);
            },
            message: 'Địa chỉ IP không hợp lệ'
        }
    },

    userAgent: String,
    sessionId: String,

    status: {
        type: String,
        enum: ['success', 'failed', 'warning'],
        default: 'success'
    },

    errorMessage: String,

    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

historySchema.index({ userId: 1, timestamp: -1 });
historySchema.index({ action: 1 });
historySchema.index({ module: 1 });
historySchema.index({ targetType: 1, targetId: 1 });
historySchema.index({ timestamp: -1 });

historySchema.statics.logActivity = function(activityData) {
    return this.create(activityData);
};

historySchema.statics.getUserActivity = function(userId, options = {}) {
    const {
        startDate,
        endDate,
        action,
        module,
        limit = 50,
        skip = 0
    } = options;

    let query = { userId };

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) query.action = action;
    if (module) query.module = module;

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

historySchema.statics.getSystemActivity = function(options = {}) {
    const {
        startDate,
        endDate,
        module,
        action,
        limit = 100,
        skip = 0
    } = options;

    let query = {};

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (module) query.module = module;
    if (action) query.action = action;

    return this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

module.exports = mongoose.model('History', historySchema);