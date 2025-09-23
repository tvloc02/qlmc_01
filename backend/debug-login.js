
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const debugLogin = async () => {
    try {
        console.log('🔍 DEBUGGING LOGIN PROCESS...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');


        console.log('\n1️⃣ Testing findByEmail method:');

        try {
            const user = await User.findByEmail('admin');
            console.log(`   Result: ${user ? '✅ FOUND' : '❌ NOT FOUND'}`);

            if (user) {
                console.log(`   Email: ${user.email}`);
                console.log(`   Name: ${user.fullName}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
            }
        } catch (error) {
            console.log(`   ❌ findByEmail error: ${error.message}`);
        }

        // 2. Test direct find
        console.log('\n2️⃣ Testing direct User.findOne:');

        try {
            const user = await User.findOne({ email: 'admin' });
            console.log(`   Result: ${user ? '✅ FOUND' : '❌ NOT FOUND'}`);

            if (user) {
                console.log(`   Email: ${user.email}`);
                console.log(`   Status: ${user.status}`);
            }
        } catch (error) {
            console.log(`   ❌ findOne error: ${error.message}`);
        }

        // 3. Test password comparison
        console.log('\n3️⃣ Testing password comparison:');

        try {
            const user = await User.findOne({ email: 'admin' });
            if (user) {
                const isValid = await user.comparePassword('Admin@123');
                console.log(`   Password "Admin@123": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
            } else {
                console.log('   ❌ No user to test password');
            }
        } catch (error) {
            console.log(`   ❌ Password comparison error: ${error.message}`);
        }

        // 4. Test populate (có thể gây lỗi)
        console.log('\n4️⃣ Testing populate methods:');

        try {
            const user = await User.findOne({ email: 'admin' })
                .populate('standardAccess', 'name code')
                .populate('criteriaAccess', 'name code');

            console.log(`   Populate result: ${user ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   StandardAccess: ${user?.standardAccess?.length || 0} items`);
            console.log(`   CriteriaAccess: ${user?.criteriaAccess?.length || 0} items`);
        } catch (error) {
            console.log(`   ❌ Populate error: ${error.message}`);
            console.log('   💡 This might be the 500 error cause!');
        }

        // 5. Test login flow simulation
        console.log('\n5️⃣ Simulating login flow:');

        try {
            // Step 1: Find user
            const user = await User.findByEmail('admin');
            if (!user) {
                console.log('   ❌ User not found');
                return;
            }

            // Step 2: Check status
            if (user.status !== 'active') {
                console.log('   ❌ User not active');
                return;
            }

            // Step 3: Check password
            const isPasswordValid = await user.comparePassword('Admin@123');
            if (!isPasswordValid) {
                console.log('   ❌ Invalid password');
                return;
            }

            // Step 4: Generate token (simulate)
            console.log('   ✅ Login simulation: SUCCESS');
            console.log('   📝 All steps passed - issue might be in authController');

        } catch (error) {
            console.log(`   ❌ Login simulation error: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Debug error:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

debugLogin();