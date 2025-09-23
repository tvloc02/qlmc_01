const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên nhóm người dùng là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên nhóm không được quá 100 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã nhóm là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [20, 'Mã nhóm không được quá 20 ký tự']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Phân quyền chi tiết theo từng chức năng
    permissions: [{
        module: {
            type: String,
            enum: [
                'so_trinh_ky',      // Số trình ký
                'so_ky_duyet',      // Số ký duyệt
                'tra_cuu_so',       // Tra cứu số
                'so_da_ban_hanh',   // Số đã ban hành
                'kiem_tra',         // Kiểm tra
                'dong_dau',         // Đóng dấu
                'bao_cao',          // Báo cáo
                'danh_muc_so',      // Danh mục số
                'cau_hinh',         // Cấu hình
                'du_lieu_don_vi'    // Dữ liệu đơn vị
            ],
            required: true
        },
        actions: {
            view: {
                type: Boolean,
                default: false
            },      // Hiển thị
            create: {
                type: Boolean,
                default: false
            },    // Thêm
            edit: {
                type: Boolean,
                default: false
            },      // Sửa
            delete: {
                type: Boolean,
                default: false
            }     // Xóa
        },
        // Ràng buộc phạm vi (nếu cần)
        restrictions: {
            scope: {
                type: String,
                enum: ['all', 'own_faculty', 'own_department', 'assigned_only'],
                default: 'all'
            },
            facultyIds: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Faculty'
            }],
            departmentIds: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Department'
            }]
        }
    }],

    // Nhóm thuộc về cơ cấu tổ chức nào
    organizationLevel: {
        type: String,
        enum: ['university', 'faculty', 'department', 'center'],
        default: 'university'
    },

    // Liên kết với khoa/bộ môn cụ thể (nếu có)
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },

    // Quyền chữ ký và đóng dấu
    signingPermissions: {
        canSign: {
            type: Boolean,
            default: false
        },
        canStamp: {
            type: Boolean,
            default: false
        },
        // Các loại tài liệu được phép ký
        allowedDocumentTypes: [{
            type: String,
            enum: [
                'van_ban_hanh_chinh',    // Văn bản hành chính
                'quyet_dinh',            // Quyết định
                'thong_bao',             // Thông báo
                'huong_dan',             // Hướng dẫn
                'bao_cao',               // Báo cáo
                'ke_hoach',              // Kế hoạch
                'de_an',                 // Đề án
                'tai_lieu_dao_tao',      // Tài liệu đào tạo
                'other'                  // Khác
            ]
        }],
        // Cấp độ phê duyệt
        approvalLevel: {
            type: Number,
            min: 1,
            max: 10,
            default: 1
        }
    },

    // Thứ tự ưu tiên (cho workflow phê duyệt)
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
    },

    // Cài đặt thông báo cho nhóm
    notificationSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        systemNotifications: {
            type: Boolean,
            default: true
        },
        // Các sự kiện cần thông báo
        events: [{
            type: String,
            enum: [
                'document_assigned',      // Tài liệu được giao
                'document_approved',      // Tài liệu được duyệt
                'document_rejected',      // Tài liệu bị từ chối
                'deadline_reminder',      // Nhắc nhở deadline
                'system_maintenance',     // Bảo trì hệ thống
                'security_alert'         // Cảnh báo bảo mật
            ]
        }]
    },

    // Quy tắc tự động gán (auto-assignment rules)
    autoAssignmentRules: [{
        condition: {
            documentType: String,
            facultyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Faculty'
            },
            departmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Department'
            },
            priority: String,
            keywords: [String]
        },
        action: {
            type: String,
            enum: ['assign', 'notify', 'escalate'],
            default: 'assign'
        },
        targetUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],

    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },

    // Thống kê nhóm
    statistics: {
        memberCount: {
            type: Number,
            default: 0
        },
        totalDocumentsProcessed: {
            type: Number,
            default: 0
        },
        averageProcessingTime: {
            type: Number,
            default: 0
        },
        lastActivity: Date
    },

    // Metadata
    tags: [String], // Tags để phân loại nhóm

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Indexes
userGroupSchema.index({ code: 1 });
userGroupSchema.index({ status: 1 });
userGroupSchema.index({ organizationLevel: 1, facultyId: 1 });
userGroupSchema.index({ 'permissions.module': 1 });

// Pre-save middleware
userGroupSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Methods
userGroupSchema.methods.hasPermission = function(module, action) {
    const permission = this.permissions.find(p => p.module === module);
    return permission ? permission.actions[action] : false;
};

userGroupSchema.methods.updateStatistics = async function() {
    const User = mongoose.model('User');
    this.statistics.memberCount = await User.countDocuments({
        userGroups: this._id,
        status: 'active'
    });
    this.statistics.lastActivity = new Date();
    return this.save();
};

userGroupSchema.methods.addPermission = function(module, actions, restrictions = {}) {
    const existingIndex = this.permissions.findIndex(p => p.module === module);

    const permissionData = {
        module,
        actions,
        restrictions
    };

    if (existingIndex >= 0) {
        this.permissions[existingIndex] = permissionData;
    } else {
        this.permissions.push(permissionData);
    }
};

userGroupSchema.methods.removePermission = function(module) {
    this.permissions = this.permissions.filter(p => p.module !== module);
};

userGroupSchema.methods.canUserJoin = function(user) {
    // Check organization level restrictions
    if (this.organizationLevel === 'faculty' && this.facultyId) {
        return user.facultyId.equals(this.facultyId);
    }

    if (this.organizationLevel === 'department' && this.departmentId) {
        return user.departmentId.equals(this.departmentId);
    }

    return true; // No restrictions
};

// Static methods
userGroupSchema.statics.getPermissionMatrix = async function() {
    const groups = await this.find({ status: 'active' }).select('name code permissions');

    const modules = [
        'evidence',         // Quản lý minh chứng
        'standards',        // Quản lý tiêu chuẩn
        'criteria',         // Quản lý tiêu chí
        'experts',          // Quản lý chuyên gia
        'assessment',       // Đánh giá minh chứng
        'reports',          // Báo cáo
        'documents',        // Quản lý tài liệu
        'workflow',         // Quy trình phê duyệt
        'users',            // Quản lý người dùng
        'configuration'     // Cấu hình hệ thống
    ];

    const actions = ['view', 'create', 'edit', 'delete'];

    const matrix = {};

    modules.forEach(module => {
        matrix[module] = {};
        groups.forEach(group => {
            const permission = group.permissions.find(p => p.module === module);
            matrix[module][group.code] = permission ? permission.actions : {
                view: false, create: false, edit: false, delete: false
            };
        });
    });

    return { matrix, modules, actions, groups };
};

userGroupSchema.statics.findByOrganization = function(level, organizationId) {
    const query = {
        status: 'active',
        organizationLevel: level
    };

    if (level === 'faculty') {
        query.facultyId = organizationId;
    } else if (level === 'department') {
        query.departmentId = organizationId;
    }

    return this.find(query);
};

// Virtuals
userGroupSchema.virtual('hasSigningRights').get(function() {
    return this.signingPermissions.canSign || this.signingPermissions.canStamp;
});

userGroupSchema.virtual('totalPermissions').get(function() {
    return this.permissions.reduce((total, perm) => {
        return total + Object.values(perm.actions).filter(Boolean).length;
    }, 0);
});

// JSON transformation
userGroupSchema.set('toJSON', { virtuals: true });
userGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserGroup', userGroupSchema);