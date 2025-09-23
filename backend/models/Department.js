const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên bộ môn/ngành là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên không được quá 200 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã bộ môn/ngành là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [15, 'Mã không được quá 15 ký tự']
    },

    type: {
        type: String,
        enum: ['department', 'major', 'program'],
        default: 'department'
    },

    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },

    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personnel'
    },

    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
    },

    trainingLevel: [{
        type: String,
        enum: ['undergraduate', 'graduate', 'postgraduate', 'phd']
    }],

    status: {
        type: String,
        enum: ['active', 'inactive'],
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

departmentSchema.index({ code: 1 });
departmentSchema.index({ facultyId: 1 });
departmentSchema.index({ type: 1 });

departmentSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Department', departmentSchema);