const bcrypt = require('bcryptjs');

async function generateHash() {
    try {
        const password = 'admin123';

        // Hash với salt 12 (giống trong code)
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);

        console.log('🔑 Password:', password);
        console.log('🔐 Hash:', hash);

        // Test verify
        const isValid = await bcrypt.compare(password, hash);
        console.log('✅ Verify test:', isValid);

        // Test với hash cũ
        const oldHash = '$2b$12$N9qo8uLOickgx2ZMRZoMye/Lo/TXpkmX3f7eKEzUQVl.n9JWCwNUq';
        const isOldValid = await bcrypt.compare(password, oldHash);
        console.log('🔍 Old hash valid:', isOldValid);

        console.log('\n📋 MongoDB command:');
        console.log(`db.users.updateOne(
            { email: "admin@cmc.edu.vn" },
            { $set: { password: "${hash}" } }
        )`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

generateHash();