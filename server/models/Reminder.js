const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reminderSchedule: [{
      date: { type: String, required: true },
      time: { type: String, required: true },
      dateTime: { type: Date, required: true },
      sent: { type: Boolean, default: false }
    }],

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["Assignment", "Exam", "Class", "Personal", "Meeting", "Other"],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    dueDate: {
      type: Date,
      required: true,
    },

    dueTime: {
      type: String, // HH:mm
      required: false, // Make false initially for backward compatibility, handle in controller
    },

    reminderDateTime: {
      type: Date,
      required: false,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    completed: {
      type: Boolean,
      default: false,
    },



    missedReminderSent: {
      type: Boolean,
      default: false,
    },

    lastEmailSentAt: {
      type: Date,
      default: null,
    },

    notificationMethods: {
      type: [{
        type: String,
        enum: ["email", "whatsapp"],
      }],
      default: ["email"],
    },

    deliveryStatus: {
      emailStatus: {
        type: String,
        enum: ["Pending", "Sent", "Failed"],
        default: "Pending",
      },
      whatsappStatus: {
        type: String,
        enum: ["Pending", "Sent", "Failed"],
        default: "Pending",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// We'll require moment-timezone here for virtual calculations
const moment = require("moment-timezone");

// Calculate total remaining minutes helper
function getRemainingTime(doc) {
  if (!doc.reminderDateTime) return 0;
  const now = moment().tz(doc.timezone || "Asia/Kolkata");
  const reminderTime = moment(doc.reminderDateTime).tz(doc.timezone || "Asia/Kolkata");
  const diffMinutes = reminderTime.diff(now, 'minutes');
  return diffMinutes > 0 ? diffMinutes : 0;
}

reminderSchema.virtual("status").get(function () {
  if (this.completed) return "Completed";

  if (!this.reminderDateTime) {
    // Fallback for old reminders
    const now = moment().tz("Asia/Kolkata");
    const dueDate = moment(this.dueDate).tz("Asia/Kolkata").endOf('day');
    if (dueDate.isBefore(now)) return "Overdue";
    if (dueDate.isSame(now, 'day')) return "Due Today";
    return "Upcoming";
  }

  const now = moment().tz(this.timezone || "Asia/Kolkata");
  const reminderTime = moment(this.reminderDateTime).tz(this.timezone || "Asia/Kolkata");

  if (reminderTime.isBefore(now)) return "Overdue";
  if (reminderTime.isSame(now, 'day')) return "Due Today";

  return "Upcoming";
});

reminderSchema.virtual("remainingDays").get(function () {
  const totalMinutes = getRemainingTime(this);
  return Math.floor(totalMinutes / (24 * 60));
});

reminderSchema.virtual("remainingHours").get(function () {
  const totalMinutes = getRemainingTime(this);
  return Math.floor((totalMinutes % (24 * 60)) / 60);
});

reminderSchema.virtual("remainingMinutes").get(function () {
  const totalMinutes = getRemainingTime(this);
  return totalMinutes % 60;
});

module.exports = mongoose.model("Reminder", reminderSchema);