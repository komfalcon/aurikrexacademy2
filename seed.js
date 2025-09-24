const bcrypt = require('bcryptjs');
const { getUsers, saveUsers } = require('./utils/userStore');
require('dotenv').config(); // make sure .env is loaded

async function seedAdmin() {
  try {
    const users = await getUsers();

    // Ensure both env variables exist
    const adminEmail = process.env.ADMIN_EMAIL || "aurikrexacademy@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Korex1025$";

    // Check if admin already exists
    if (!users.find(u => u.email === adminEmail)) {
      const hash = await bcrypt.hash(adminPassword, 10);
      users.push({
        id: Date.now(),
        fullName: 'Admin',
        email: adminEmail,
        password: hash,
        role: 'admin',
        verified: true
      });
      await saveUsers(users);
      console.log(`✅ Seeded admin user: ${adminEmail}`);
    } else {
      console.log("ℹ️ Admin user already exists, skipping seed.");
    }
  } catch (err) {
    console.error("❌ Error seeding admin user:", err.message);
  }
}

module.exports = { seedAdmin };

if (require.main === module) {
  seedAdmin().catch(console.error);
}
