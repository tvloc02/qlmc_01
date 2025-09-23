const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên khoa là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên khoa không được quá 200 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã khoa là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [10, 'Mã khoa không được quá 10 ký tự']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
    },

    dean: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personnel'
    },

    viceDeans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personnel'
    }],

    establishedDate: Date,

    contactInfo: {
        email: String,
        phone: String,
        address: String,
        website: String
    },

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

facultySchema.index({ code: 1 });
facultySchema.index({ status: 1 });

facultySchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Faculty', facultySchema);
