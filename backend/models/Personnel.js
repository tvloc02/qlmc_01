const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Họ và tên là bắt buộc'],
        trim: true,
        maxlength: [100, 'Họ và tên không được quá 100 ký tự']
    },

    employeeId: {
        type: String,
        required: [true, 'Mã nhân viên là bắt buộc'],
        unique: true,
        trim: true,
        maxlength: [20, 'Mã nhân viên không được quá 20 ký tự']
    },

    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Email không hợp lệ'
        }
    },

    phoneNumber: {
        type: String,
        validate: {
            validator: function(phone) {
                return !phone || /^[0-9]{10,11}$/.test(phone);
            },
            message: 'Số điện thoại không hợp lệ'
        }
    },

    position: {
        type: String,
        enum: ['lecturer', 'senior_lecturer', 'associate_professor', 'professor', 'dean', 'vice_dean', 'head_of_department', 'staff'],
        required: [true, 'Chức vụ là bắt buộc']
    },

    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },

    qualifications: [{
        degree: {
            type: String,
            enum: ['bachelor', 'master', 'phd', 'professor', 'associate_professor']
        },
        field: String,
        university: String,
        year: Number
    }],

    specializations: [String],

    workingYears: {
        type: Number,
        min: [0, 'Số năm làm việc không được âm']
    },

    dateOfBirth: Date,
    dateJoined: Date,

    status: {
        type: String,
        enum: ['active', 'inactive', 'retired'],
        default: 'active'
    },

    isExpert: {
        type: Boolean,
        default: false
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

personnelSchema.index({ employeeId: 1 });
personnelSchema.index({ email: 1 });
personnelSchema.index({ facultyId: 1 });
personnelSchema.index({ position: 1 });

personnelSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Personnel', personnelSchema);