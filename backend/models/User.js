const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^[a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?$/.test(email);
            },
            message: 'Email không hợp lệ'
        }
    },

    fullName: {
        type: String,
        required: [true, 'Họ và tên là bắt buộc'],
        maxlength: [100, 'Họ và tên không được quá 100 ký tự'],
        trim: true
    },

    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
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

    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: [true, 'Khoa là bắt buộc']
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },

    positions: [{
        title: {
            type: String,
            required: true,
            enum: [
                'giang_vien',
                'truong_khoa',
                'pho_truong_khoa',
                'truong_bo_mon',
                'pho_truong_bo_mon',
                'chu_nhiem_chuong_trinh',
                'giam_doc_trung_tam',
                'pho_giam_doc',
                'thu_ky_khoa',
                'chuyen_vien',
                'nhan_vien',
                'other'
            ]
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        isMain: {
            type: Boolean,
            default: false
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        },
        description: String
    }],

    academicLevel: {
        type: String,
        enum: ['cu_nhan', 'thac_si', 'tien_si', 'pho_giao_su', 'giao_su'],
        default: 'cu_nhan'
    },

    specializations: [String],

    role: {
        type: String,
        enum: ['admin', 'manager', 'staff', 'expert', 'guest'],
        default: 'staff'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'pending'
    },

    digitalSignature: {
        signatureImage: String,

        certificate: {
            serialNumber: String,
            issuer: String,
            subject: String,
            validFrom: Date,
            validTo: Date,
            thumbprint: String,
            algorithm: {
                type: String,
                default: 'RSA-SHA256'
            }
        },

        settings: {
            showDate: {
                type: Boolean,
                default: true
            },
            showReason: {
                type: Boolean,
                default: true
            },
            showLocation: {
                type: Boolean,
                default: true
            },
            defaultLocation: String,
            signatureFormat: {
                type: String,
                enum: ['image_only', 'text_only', 'image_and_text'],
                default: 'image_and_text'
            }
        },

        usageStats: {
            totalSigned: {
                type: Number,
                default: 0
            },
            lastUsed: Date
        },

        isActive: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },

    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    individualPermissions: [{
        module: {
            type: String,
            enum: [
                'evidence',
                'standards',
                'criteria',
                'experts',
                'assessment',
                'reports',
                'documents',
                'workflow',
                'users',
                'configuration'
            ]
        },
        actions: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
        },
        restrictions: [{
            type: String,
        }]
    }],

    standardAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],

    criteriaAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria'
    }],

    preferences: {
        language: {
            type: String,
            enum: ['vi', 'en'],
            default: 'vi'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        pageSize: {
            type: Number,
            default: 20,
            min: 10,
            max: 100
        },
        notifications: {
            email: { type: Boolean, default: true },
            system: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        }
    },

    lastLogin: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({ email: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ facultyId: 1, status: 1 });
userSchema.index({ 'positions.title': 1, 'positions.isActive': 1 });

userSchema.virtual('mainPosition').get(function() {
    return this.positions.find(p => p.isMain && p.isActive) ||
        this.positions.find(p => p.isActive) ||
        null;
});

userSchema.virtual('activePositions').get(function() {
    return this.positions.filter(p => p.isActive);
});

userSchema.virtual('hasDigitalSignature').get(function() {
    return !!(this.digitalSignature && this.digitalSignature.isActive);
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    const mainPositions = this.positions.filter(p => p.isMain && p.isActive);
    if (mainPositions.length > 1) {
        for (let i = 1; i < mainPositions.length; i++) {
            const pos = this.positions.find(p => p._id.equals(mainPositions[i]._id));
            if (pos) pos.isMain = false;
        }
    }

    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

userSchema.methods.getFullEmail = function(domain = 'cmc.edu.vn') {
    if (this.email.includes('@')) return this.email;
    return `${this.email}@${domain}`;
};

userSchema.methods.hasPermission = function(module, action) {
    const individual = this.individualPermissions.find(p => p.module === module);
    if (individual && individual.actions[action] !== undefined) {
        return individual.actions[action];
    }

    return false;
};

userSchema.methods.addPosition = function(positionData) {
    if (positionData.isMain) {
        this.positions.forEach(p => {
            if (p.isActive) p.isMain = false;
        });
    }

    this.positions.push(positionData);
};

userSchema.methods.removePosition = function(positionId) {
    this.positions = this.positions.filter(p => !p._id.equals(positionId));
};

userSchema.methods.updateSignatureUsage = function() {
    if (this.digitalSignature) {
        this.digitalSignature.usageStats.totalSigned += 1;
        this.digitalSignature.usageStats.lastUsed = new Date();
    }
};

userSchema.methods.canSignDocuments = function() {
    return this.hasDigitalSignature && this.status === 'active';
};

userSchema.statics.generateDefaultPassword = function(email) {
    const username = email.split('@')[0];
    return `${username}123`;
};

userSchema.statics.findByEmailOrUsername = function(identifier) {
    const emailWithoutDomain = identifier.replace('@cmc.edu.vn', '');
    const emailWithDomain = emailWithoutDomain.includes('@') ?
        emailWithoutDomain : `${emailWithoutDomain}@cmc.edu.vn`;

    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { email: emailWithoutDomain.toLowerCase() },
            { email: emailWithDomain.toLowerCase() }
        ]
    });
};

userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
    }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);