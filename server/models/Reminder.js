const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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


    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    completed: {
      type: Boolean,
      default: false,
    },
    reminderSchedules: [
      {
        reminderDate: {
          type: Date,
          required: true,
        },
        emailSent: {
          type: Boolean,
          default: false,
        },
        sentAt: {
          type: Date,
          default: null,
        },
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// We'll require moment-timezone here for virtual calculations
const moment = require("moment-timezone");

reminderSchema.virtual("status").get(function () {
  if (this.completed) return "Completed";
  
  const now = moment().tz("Asia/Kolkata");
  const dueDate = moment(this.dueDate).tz("Asia/Kolkata").endOf('day');
  if (dueDate.isBefore(now)) return "Overdue";
  if (dueDate.isSame(now, 'day')) return "Due Today";
  return "Upcoming";
});

module.exports = mongoose.model("Reminder", reminderSchema);