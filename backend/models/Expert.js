const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
    personnelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personnel',
        required: [true, 'Thông tin nhân sự là bắt buộc']
    },

    expertCode: {
        type: String,
        unique: true,
        required: [true, 'Mã chuyên gia là bắt buộc'],
        uppercase: true,
        trim: true
    },

    specializations: [{
        field: {
            type: String,
            required: true,
            maxlength: [100, 'Lĩnh vực chuyên môn không được quá 100 ký tự']
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate'
        },
        yearsOfExperience: {
            type: Number,
            min: [0, 'Số năm kinh nghiệm không được âm']
        }
    }],

    certifications: [{
        name: String,
        issuingOrganization: String,
        issueDate: Date,
        expiryDate: Date,
        certificateNumber: String
    }],

    assignedPrograms: [{
        programId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program'
        },
        role: {
            type: String,
            enum: ['lead_evaluator', 'evaluator', 'reviewer'],
            default: 'evaluator'
        },
        assignedDate: {
            type: Date,
            default: Date.now
        }
    }],

    assignedStandards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],

    availability: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available'
    },

    workload: {
        currentAssignments: {
            type: Number,
            default: 0
        },
        maxAssignments: {
            type: Number,
            default: 5
        }
    },

    evaluationHistory: [{
        programId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Program'
        },
        evaluationDate: Date,
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String
    }],

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

expertSchema.index({ expertCode: 1 });
expertSchema.index({ personnelId: 1 });
expertSchema.index({ status: 1 });
expertSchema.index({ availability: 1 });

expertSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

expertSchema.statics.generateExpertCode = async function() {
    const count = await this.countDocuments();
    const nextNumber = count + 1;
    return `EXP${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Expert', expertSchema);