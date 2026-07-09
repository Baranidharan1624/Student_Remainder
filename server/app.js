const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { startScheduler } = require("./services/scheduler.service");
const { verifyTransporter } = require("./services/email.service");

// Routes
const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Reminder API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reminders", reminderRoutes);

// Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected");

    // Verify email configuration
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    if (emailConfigured) {
      await verifyTransporter();
    } else {
      console.log("⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env");
    }

    // Start the email scheduler
    startScheduler();
    console.log("✅ Reminder Scheduler Started");

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server Running on port ${PORT}`);
      console.log("─".repeat(40));
      console.log("📧 Email Notifications: " + (emailConfigured ? "ENABLED" : "DISABLED"));
      console.log("⏰ Scheduler: ACTIVE");
      console.log("🌐 API: http://localhost:" + PORT);
      console.log("─".repeat(40));
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();