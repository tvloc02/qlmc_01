const mongoose = require('mongoose');

const assessmentProgramSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên chương trình đánh giá là bắt buộc'],
        trim: true,
        maxlength: [300, 'Tên không được quá 300 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã chương trình đánh giá là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Chương trình gốc là bắt buộc']
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Tổ chức đánh giá là bắt buộc']
    },

    academicYear: {
        type: String,
        required: [true, 'Năm học là bắt buộc'],
        validate: {
            validator: function(year) {
                return /^\d{4}-\d{4}$/.test(year);
            },
            message: 'Năm học phải có định dạng YYYY-YYYY'
        }
    },

    assessmentType: {
        type: String,
        enum: ['self_assessment', 'internal_review', 'external_review', 'accreditation'],
        required: [true, 'Loại đánh giá là bắt buộc']
    },

    timeline: {
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc']
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc']
        },
        milestones: [{
            name: String,
            description: String,
            dueDate: Date,
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'overdue'],
                default: 'pending'
            }
        }]
    },

    assignedExperts: [{
        expertId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expert'
        },
        role: {
            type: String,
            enum: ['lead_evaluator', 'evaluator', 'reviewer', 'observer'],
            default: 'evaluator'
        },
        assignedStandards: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Standard'
        }],
        assignedDate: {
            type: Date,
            default: Date.now
        }
    }],

    assessmentCriteria: [{
        standardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Standard'
        },
        weight: {
            type: Number,
            min: 0,
            max: 100
        },
        isRequired: {
            type: Boolean,
            default: true
        }
    }],

    progress: {
        overallProgress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedStandards: {
            type: Number,
            default: 0
        },
        totalStandards: {
            type: Number,
            default: 0
        },
        evidenceProgress: {
            submitted: { type: Number, default: 0 },
            reviewed: { type: Number, default: 0 },
            approved: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        }
    },

    status: {
        type: String,
        enum: ['planning', 'active', 'review', 'completed', 'cancelled', 'suspended'],
        default: 'planning'
    },

    results: {
        overallRating: {
            type: String,
            enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory']
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        standardResults: [{
            standardId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Standard'
            },
            score: Number,
            rating: String,
            feedback: String
        }],
        recommendations: [String],
        nextReviewDate: Date
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

assessmentProgramSchema.index({ code: 1 });
assessmentProgramSchema.index({ programId: 1 });
assessmentProgramSchema.index({ status: 1 });
assessmentProgramSchema.index({ academicYear: 1 });

assessmentProgramSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

assessmentProgramSchema.methods.updateProgress = async function() {
    // Tính toán progress dựa trên evidences và standards
    const Evidence = require('./Evidence');
    const Standard = require('./Standard');

    const totalStandards = await Standard.countDocuments({
        programId: this.programId,
        organizationId: this.organizationId,
        status: 'active'
    });

    const totalEvidences = await Evidence.countDocuments({
        programId: this.programId,
        organizationId: this.organizationId,
        status: 'active'
    });

    this.progress.totalStandards = totalStandards;
    this.progress.evidenceProgress.total = totalEvidences;

    // Tính progress tổng thể
    if (totalStandards > 0) {
        this.progress.overallProgress = Math.round(
            (this.progress.completedStandards / totalStandards) * 100
        );
    }

    return this.save();
};

module.exports = mongoose.model('AssessmentProgram', assessmentProgramSchema);
