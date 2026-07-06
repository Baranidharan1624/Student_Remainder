const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");

// Valid enum values from the Reminder model
const VALID_CATEGORIES = ["Assignment", "Exam", "Class", "Personal", "Meeting", "Other"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

// ==========================================
// CREATE REMINDER
// ==========================================
exports.createReminder = async (req, res) => {
  try {
    const { title, description, subject, category, priority, dueDate } = req.body;

    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and Due Date are required",
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

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      description,
      subject,
      category,
      priority,
      dueDate: parsedDueDate,
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
    let sortOption = { dueDate: 1 }; // default sort

    if (sort) {
      const validSortFields = ["dueDate", "priority", "createdAt"];
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

    const { title, description, subject, category, priority, dueDate, completed } = req.body;

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

    const updatedReminder = await reminder.save();

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
                dueDate: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            },
            { $count: "count" },
          ],
          overdue: [
            {
              $match: {
                completed: false,
                dueDate: { $lt: new Date() },
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
