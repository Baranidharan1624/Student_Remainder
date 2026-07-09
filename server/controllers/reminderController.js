const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");
const moment = require("moment-timezone");
const { sendCompletionEmail } = require("../services/email.service");

// Valid enum values from the Reminder model
const VALID_CATEGORIES = ["Assignment", "Exam", "Class", "Personal", "Meeting", "Other"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

// ==========================================
// CREATE REMINDER
// ==========================================
exports.createReminder = async (req, res) => {
  try {
    const { title, description, subject, category, priority, dueDate, dueTime, notificationMethods, reminderSchedule } = req.body;

    // Validate required fields
    if (!title || !dueDate || !dueTime) {
      return res.status(400).json({
        success: false,
        message: "Title, Due Date, and Due Time are required",
      });
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
      });
    }

    // Validate dueDate is a valid date
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date format",
      });
    }

    // Validate dueTime format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(dueTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Please use HH:mm (24-hour)",
      });
    }

    // Combine date and time in Asia/Kolkata
    let parsedReminderSchedule = [];
    if (Array.isArray(reminderSchedule)) {
      try {
        parsedReminderSchedule = reminderSchedule.map(s => {
          const schedTimeKolkata = moment.tz(`${s.date}T${s.time}:00`, "YYYY-MM-DDTHH:mm:ss", "Asia/Kolkata");
          if (!schedTimeKolkata.isValid()) {
            throw new Error(`Invalid schedule date or time: ${s.date} ${s.time}`);
          }
          return {
            date: s.date,
            time: s.time,
            dateTime: schedTimeKolkata.toDate(),
            sent: false
          };
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
    }

    const dateStr = parsedDueDate.toISOString().split("T")[0];
    const reminderDateTimeStr = `${dateStr}T${dueTime}:00`;
    const reminderTimeKolkata = moment.tz(reminderDateTimeStr, "YYYY-MM-DDTHH:mm:ss", "Asia/Kolkata");

    if (!reminderTimeKolkata.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date or time combination",
      });
    }

    // Check if it's in the past
    const nowKolkata = moment().tz("Asia/Kolkata");
    if (reminderTimeKolkata.isBefore(nowKolkata)) {
      return res.status(400).json({
        success: false,
        message: "Reminder cannot be set in the past",
      });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      description,
      subject,
      category,
      priority,
      dueDate: parsedDueDate,
      dueTime,
      reminderDateTime: reminderTimeKolkata.toDate(),
      timezone: "Asia/Kolkata",
      notificationMethods: Array.isArray(notificationMethods) ? notificationMethods : undefined,
      reminderSchedule: parsedReminderSchedule,
    });
    res.status(201).json({
      success: true,
      message: "Reminder Created Successfully",
      reminder,
    });
  } catch (error) {
    console.error(error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// GET ALL REMINDERS (with filter, sort, search, pagination)
// ==========================================
exports.getReminders = async (req, res) => {
  try {
    const { priority, category, completed, sort, page = 1, limit = 10 } = req.query;

    // Build filter object — always scoped to logged-in user (TASK 9: Security)
    const filter = { user: req.user._id };

    // TASK 5: Filter by priority
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority filter. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
        });
      }
      filter.priority = priority;
    }

    // TASK 5: Filter by category
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category filter. Allowed values: ${VALID_CATEGORIES.join(", ")}`,
        });
      }
      filter.category = category;
    }

    // TASK 5: Filter by completed status
    if (completed !== undefined) {
      if (completed === "true") {
        filter.completed = true;
      } else if (completed === "false") {
        filter.completed = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid completed filter. Use 'true' or 'false'",
        });
      }
    }

    // TASK 6: Sort support
    let sortOption = { reminderDateTime: 1 }; // default sort (nearest first)

    if (sort) {
      const validSortFields = ["dueDate", "reminderDateTime", "priority", "createdAt"];
      const isDescending = sort.startsWith("-");
      const sortField = isDescending ? sort.substring(1) : sort;

      if (!validSortFields.includes(sortField)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sort field. Allowed values: ${validSortFields.join(", ")}`,
        });
      }

      // For priority, we need a custom sort order since it's not alphabetical
      if (sortField === "priority") {
        // We'll handle priority sorting after query using a custom comparator
        sortOption = isDescending ? { createdAt: -1 } : { createdAt: 1 };
      } else {
        sortOption = { [sortField]: isDescending ? -1 : 1 };
      }
    }

    // TASK 7: Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    let reminders = await Reminder.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Handle priority sorting separately (custom order: High > Medium > Low)
    if (sort && sort.replace("-", "") === "priority") {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      const isDescending = sort.startsWith("-");
      reminders.sort((a, b) => {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return isDescending ? -diff : diff;
      });
    }

    // Get total count for pagination metadata
    const totalItems = await Reminder.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      page: pageNum,
      totalPages,
      totalItems,
      count: reminders.length,
      reminders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// GET SINGLE REMINDER
// ==========================================
exports.getReminderById = async (req, res) => {
  try {
    // TASK 8: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID format",
      });
    }

    // TASK 9: Security — only fetch reminders belonging to the logged-in user
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      reminder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// TASK 1: UPDATE REMINDER — PUT /api/reminders/:id
// ==========================================
exports.updateReminder = async (req, res) => {
  try {
    // TASK 8: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID format",
      });
    }

    // TASK 9: Security — find only if it belongs to the logged-in user
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    const { title, description, subject, category, priority, dueDate, dueTime, completed, notificationMethods, reminderSchedule } = req.body;

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
      });
    }

    // Validate dueTime format (HH:mm) if provided
    if (dueTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(dueTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Please use HH:mm (24-hour)",
        });
      }
      reminder.dueTime = dueTime;
    }

    // Validate dueDate if provided
    if (dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date format",
        });
      }
      reminder.dueDate = parsedDueDate;
    }

    // If either dueDate or dueTime is updated, recalculate reminderDateTime
    if (dueDate || dueTime) {
      const currentDueDateStr = reminder.dueDate ? reminder.dueDate.toISOString().split("T")[0] : moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const currentDueTime = reminder.dueTime || "23:59";

      const combinedDateTimeStr = `${currentDueDateStr}T${currentDueTime}:00`;
      const updatedTimeKolkata = moment.tz(combinedDateTimeStr, "YYYY-MM-DDTHH:mm:ss", "Asia/Kolkata");

      // Optionally validate if it's not in the past here if needed
      // but if the user just wants to update title, we shouldn't block if the reminder is already in the past.
      // So we just update the reminderDateTime.

      if (updatedTimeKolkata.isValid()) {
        reminder.reminderDateTime = updatedTimeKolkata.toDate();
      }
    }

    // Validate completed if provided
    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Completed field must be a boolean",
        });
      }
      reminder.completed = completed;
    }

    // Update fields only if they are provided in the request body
    if (title !== undefined) reminder.title = title;
    if (description !== undefined) reminder.description = description;
    if (subject !== undefined) reminder.subject = subject;
    if (category !== undefined) reminder.category = category;
    if (priority !== undefined) reminder.priority = priority;
    if (notificationMethods !== undefined && Array.isArray(notificationMethods)) {
      reminder.notificationMethods = notificationMethods;
    }

    const updatedReminder = await reminder.save();

    // Send completion email if reminder was just marked as completed
    if (completed === true && !reminder.completed) {
      // User just completed this reminder
      const User = require("../models/User");
      const user = await User.findById(req.user._id).select("name email");
      if (user && user.email) {
        sendCompletionEmail({
          to: user.email,
          userName: user.name,
          reminder: updatedReminder,
        }).catch((err) => {
          console.error(`[Reminder] Completion email failed: ${err.message}`);
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Reminder Updated Successfully",
      reminder: updatedReminder,
    });
  } catch (error) {
    console.error(error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// TASK 2: DELETE REMINDER — DELETE /api/reminders/:id
// ==========================================
exports.deleteReminder = async (req, res) => {
  try {
    // TASK 8: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID format",
      });
    }

    // TASK 9: Security — delete only if it belongs to the logged-in user
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reminder Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// TASK 3: DASHBOARD API — GET /api/reminders/dashboard
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    // TASK 9: Security — only aggregate reminders for the logged-in user
    const userId = req.user._id;

    // Use MongoDB aggregation to calculate all statistics in a single query
    const stats = await Reminder.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          totalReminders: [{ $count: "count" }],
          completed: [
            { $match: { completed: true } },
            { $count: "count" },
          ],
          pending: [
            { $match: { completed: false } },
            { $count: "count" },
          ],
          highPriority: [
            { $match: { priority: "High", completed: false } },
            { $count: "count" },
          ],
          dueToday: [
            {
              $match: {
                completed: false,
                reminderDateTime: {
                  // We need to match today's date in Kolkata timezone
                  // Since aggregate happens on UTC dates in DB, it's safer to build start/end of day in Kolkata, then convert to UTC Date objects
                  $gte: moment().tz("Asia/Kolkata").startOf('day').toDate(),
                  $lte: moment().tz("Asia/Kolkata").endOf('day').toDate(),
                },
              },
            },
            { $count: "count" },
          ],
          overdue: [
            {
              $match: {
                completed: false,
                reminderDateTime: { $lt: moment().tz("Asia/Kolkata").toDate() },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Extract counts from aggregation result (default to 0 if empty)
    const result = stats[0];
    const statistics = {
      totalReminders: result.totalReminders[0]?.count || 0,
      completed: result.completed[0]?.count || 0,
      pending: result.pending[0]?.count || 0,
      highPriority: result.highPriority[0]?.count || 0,
      dueToday: result.dueToday[0]?.count || 0,
      overdue: result.overdue[0]?.count || 0,
    };

    res.status(200).json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// TASK 4: SEARCH API — GET /api/reminders/search?keyword=
// ==========================================
exports.searchReminders = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    // TASK 9: Security — only search within logged-in user's reminders
    const reminders = await Reminder.find({
      user: req.user._id,
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { subject: { $regex: keyword, $options: "i" } },
      ],
    }).sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
