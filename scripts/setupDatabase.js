// File: scripts/setupDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../backend/models/User');
const Faculty = require('../backend/models/Faculty');
const Department = require('../backend/models/Department');
const Organization = require('../backend/models/Organization');
const Program = require('../backend/models/Program');
const Standard = require('../backend/models/Standard');
const Criteria = require('../backend/models/Criteria');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/evidence_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create initial data
const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Faculty.deleteMany({}),
            Department.deleteMany({}),
            Organization.deleteMany({}),
            Program.deleteMany({}),
            Standard.deleteMany({}),
            Criteria.deleteMany({})
        ]);

        // Create Admin User first (without faculty requirement)
        const adminUser = new User({
            email: 'admin@cmc.edu.vn',
            fullName: 'Administrator',
            password: 'admin123',
            phoneNumber: '0987654321',
            role: 'admin',
            status: 'active',
            academicLevel: 'thac_si',
            specializations: ['Quản trị hệ thống'],
            positions: [{
                title: 'chuyen_vien',
                isMain: true,
                isActive: true,
                description: 'Quản trị viên hệ thống'
            }],
            preferences: {
                language: 'vi',
                theme: 'light',
                pageSize: 20
            }
        });

        // Temporarily disable faculty requirement for admin
        adminUser.facultyId = undefined;
        const savedAdmin = await User.create(adminUser.toObject());
        console.log('✅ Admin user created');

        // Create Organization
        const organization = await Organization.create({
            name: 'Đại học Công nghệ và Quản lý CMC',
            code: 'CMC-UNIVERSITY',
            description: 'Tổ chức đánh giá chương trình đào tạo',
            level: 'institutional',
            type: 'education',
            website: 'https://cmc.edu.vn',
            contactEmail: 'info@cmc.edu.vn',
            contactPhone: '024.123.4567',
            address: 'Hà Nội, Việt Nam',
            status: 'active',
            createdBy: savedAdmin._id
        });
        console.log('✅ Organization created');

        // Create Faculty
        const faculty = await Faculty.create({
            name: 'Khoa Công nghệ Thông tin',
            code: 'CNTT',
            description: 'Khoa Công nghệ Thông tin',
            establishedDate: new Date('2010-01-01'),
            contactInfo: {
                email: 'cntt@cmc.edu.vn',
                phone: '024.123.4568',
                address: 'Tòa A, CMC University'
            },
            status: 'active',
            createdBy: savedAdmin._id
        });
        console.log('✅ Faculty created');

        // Create Department
        const department = await Department.create({
            name: 'Bộ môn Hệ thống Thông tin',
            code: 'HTTT',
            type: 'department',
            facultyId: faculty._id,
            description: 'Bộ môn Hệ thống Thông tin',
            trainingLevel: ['undergraduate', 'graduate'],
            status: 'active',
            createdBy: savedAdmin._id
        });
        console.log('✅ Department created');

        // Update admin user with faculty and department
        await User.findByIdAndUpdate(savedAdmin._id, {
            facultyId: faculty._id,
            departmentId: department._id,
            'positions.0.department': department._id
        });
        console.log('✅ Admin user updated with faculty/department');

        // Create Program
        const program = await Program.create({
            name: 'Chương trình Đánh giá Chất lượng Giáo dục Đại học',
            code: 'CLGD-DH-2024',
            description: 'Chương trình đánh giá chất lượng giáo dục đại học theo tiêu chuẩn AUN-QA',
            type: 'undergraduate',
            version: '2024.1',
            applicableYear: 2024,
            status: 'active',
            effectiveDate: new Date(),
            objectives: 'Đánh giá chất lượng chương trình đào tạo đại học',
            guidelines: 'Thực hiện theo hướng dẫn của Bộ GD&ĐT',
            createdBy: savedAdmin._id
        });
        console.log('✅ Program created');

        // Create Standards
        const standards = [
            {
                name: 'Mục tiêu chương trình',
                code: '1',
                description: 'Mục tiêu của chương trình đào tạo phải được xác định rõ ràng',
                programId: program._id,
                organizationId: organization._id,
                order: 1,
                weight: 10,
                objectives: 'Đảm bảo mục tiêu chương trình rõ ràng',
                status: 'active',
                createdBy: savedAdmin._id
            },
            {
                name: 'Chuẩn đầu ra',
                code: '2',
                description: 'Chuẩn đầu ra của chương trình đào tạo',
                programId: program._id,
                organizationId: organization._id,
                order: 2,
                weight: 15,
                objectives: 'Xác định chuẩn đầu ra phù hợp',
                status: 'active',
                createdBy: savedAdmin._id
            },
            {
                name: 'Chương trình đào tạo',
                code: '3',
                description: 'Thiết kế chương trình đào tạo',
                programId: program._id,
                organizationId: organization._id,
                order: 3,
                weight: 20,
                objectives: 'Thiết kế chương trình đào tạo phù hợp',
                status: 'active',
                createdBy: savedAdmin._id
            }
        ];

        const createdStandards = await Standard.insertMany(standards);
        console.log('✅ Standards created');

        // Create Criteria for each Standard
        for (const standard of createdStandards) {
            const criteria = [
                {
                    name: `Tiêu chí ${standard.code}.1`,
                    code: '1',
                    description: `Mô tả chi tiết cho tiêu chí ${standard.code}.1`,
                    standardId: standard._id,
                    programId: program._id,
                    organizationId: organization._id,
                    order: 1,
                    weight: 50,
                    type: 'mandatory',
                    requirements: 'Yêu cầu cơ bản',
                    guidelines: 'Hướng dẫn thực hiện',
                    status: 'active',
                    createdBy: savedAdmin._id
                },
                {
                    name: `Tiêu chí ${standard.code}.2`,
                    code: '2',
                    description: `Mô tả chi tiết cho tiêu chí ${standard.code}.2`,
                    standardId: standard._id,
                    programId: program._id,
                    organizationId: organization._id,
                    order: 2,
                    weight: 50,
                    type: 'mandatory',
                    requirements: 'Yêu cầu bổ sung',
                    guidelines: 'Hướng dẫn chi tiết',
                    status: 'active',
                    createdBy: savedAdmin._id
                }
            ];

            await Criteria.insertMany(criteria);
        }
        console.log('✅ Criteria created');

        // Create additional users
        const users = [
            {
                email: 'truongkhoa@cmc.edu.vn',
                fullName: 'Nguyễn Văn Trưởng',
                password: 'truongkhoa123',
                phoneNumber: '0987654322',
                facultyId: faculty._id,
                departmentId: department._id,
                positions: [{
                    title: 'truong_khoa',
                    department: department._id,
                    isMain: true,
                    isActive: true,
                    description: 'Trưởng khoa CNTT'
                }],
                academicLevel: 'giao_su',
                specializations: ['Công nghệ phần mềm', 'Trí tuệ nhân tạo'],
                role: 'manager',
                status: 'active',
                createdBy: savedAdmin._id
            },
            {
                email: 'giangvien@cmc.edu.vn',
                fullName: 'Trần Thị Giảng',
                password: 'giangvien123',
                phoneNumber: '0987654323',
                facultyId: faculty._id,
                departmentId: department._id,
                positions: [{
                    title: 'giang_vien',
                    department: department._id,
                    isMain: true,
                    isActive: true,
                    description: 'Giảng viên'
                }],
                academicLevel: 'thac_si',
                specializations: ['Cơ sở dữ liệu'],
                role: 'staff',
                status: 'active',
                createdBy: savedAdmin._id
            },
            {
                email: 'chuyengia@cmc.edu.vn',
                fullName: 'Lê Văn Chuyên',
                password: 'chuyengia123',
                phoneNumber: '0987654324',
                facultyId: faculty._id,
                departmentId: department._id,
                positions: [{
                    title: 'giang_vien',
                    department: department._id,
                    isMain: true,
                    isActive: true,
                    description: 'Chuyên gia đánh giá'
                }],
                academicLevel: 'tien_si',
                specializations: ['Đảm bảo chất lượng', 'Đánh giá giáo dục'],
                role: 'expert',
                status: 'active',
                createdBy: savedAdmin._id
            }
        ];

        await User.insertMany(users);
        console.log('✅ Additional users created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Created accounts:');
        console.log('👤 Admin: admin@cmc.edu.vn / admin123');
        console.log('👤 Trưởng khoa: truongkhoa@cmc.edu.vn / truongkhoa123');
        console.log('👤 Giảng viên: giangvien@cmc.edu.vn / giangvien123');
        console.log('👤 Chuyên gia: chuyengia@cmc.edu.vn / chuyengia123');

    } catch (error) {
        console.error('❌ Seeding error:', error);
        throw error;
    }
};

// Fix existing users (if any)
const fixExistingUsers = async () => {
    try {
        console.log('🔧 Fixing existing users...');

        // Find users without proper positions
        const usersWithoutPositions = await User.find({
            $or: [
                { positions: { $size: 0 } },
                { 'positions.title': { $exists: false } },
                { 'positions.title': null }
            ]
        });

        for (const user of usersWithoutPositions) {
            // Add default position based on role
            let defaultTitle = 'giang_vien';
            if (user.role === 'admin') defaultTitle = 'chuyen_vien';
            else if (user.role === 'manager') defaultTitle = 'truong_khoa';
            else if (user.role === 'expert') defaultTitle = 'giang_vien';

            user.positions = [{
                title: defaultTitle,
                isMain: true,
                isActive: true,
                description: `Vị trí mặc định - ${defaultTitle}`
            }];

            await user.save();
            console.log(`✅ Fixed user: ${user.email}`);
        }

        console.log('✅ All users fixed');
    } catch (error) {
        console.error('❌ Error fixing users:', error);
        throw error;
    }
};

// Main execution
const main = async () => {
    await connectDB();

    try {
        // Check if data already exists
        const userCount = await User.countDocuments();

        if (userCount === 0) {
            console.log('📦 No existing data found. Creating initial data...');
            await seedData();
        } else {
            console.log(`📦 Found ${userCount} users. Fixing any validation issues...`);
            await fixExistingUsers();
        }

        console.log('\n✅ Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { connectDB, seedData, fixExistingUsers };