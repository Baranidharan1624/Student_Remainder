const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("DEBUG - Mongo URI:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");
    console.log("DEBUG - Database Name:", mongoose.connection.db.databaseName);
  } catch (error) {
    console.error("Database Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;