const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { startScheduler } = require("./services/reminderScheduler");

// Routes
const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");

const app = express();

// Connect Database
connectDB();

// Start Email Scheduler
startScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Reminder API is running 🚀",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reminders", reminderRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});