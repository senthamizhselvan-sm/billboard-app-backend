const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, '.env') });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/billboard-reports');
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log(`Admin user already exists: ${adminExists.username}`);
      process.exit(0);
    }

    // Check all existing users
    const allUsers = await User.find();
    console.log("Existing users:");
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role})`);
    });

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123', // You should change this password
      role: 'admin'
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("⚠️  Please change the default password after first login!");

  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
