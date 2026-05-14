const mongoose = require('mongoose');
const User = require('../models/User'); // import user model

const connectDB = async () => {
  try {
    // connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");


    // create admin if not exists
    
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const admin = new User({
        name: "Admin",
        email: "salim.lone444@gmail.com",
        password: "Salim@123$", //  hashed automatically
        role: "admin"
      });

      await admin.save();
      console.log("Admin created");
    }

  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;