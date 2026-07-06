const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  getDashboard,
  searchReminders,
} = require("../controllers/reminderController");

// TASK 3: Dashboard — must be before /:id to avoid route conflict
router.get("/dashboard", authMiddleware, getDashboard);

// TASK 4: Search — must be before /:id to avoid route conflict
router.get("/search", authMiddleware, searchReminders);

// Create Reminder
router.post("/", authMiddleware, createReminder);

// TASK 5, 6, 7: Get All Reminders (filter, sort, pagination)
router.get("/", authMiddleware, getReminders);

// Get Single Reminder
router.get("/:id", authMiddleware, getReminderById);

// TASK 1: Update Reminder
router.put("/:id", authMiddleware, updateReminder);

// TASK 2: Delete Reminder
router.delete("/:id", authMiddleware, deleteReminder);

module.exports = router;
