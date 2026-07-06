const cron = require("node-cron");
const moment = require("moment-timezone");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const { sendReminderEmail } = require("./emailService");

const startScheduler = () => {
  console.log("[Scheduler] Starting reminder email scheduler...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = moment().tz("Asia/Kolkata");
      
      // Find incomplete reminders that have a valid reminderDateTime
      const reminders = await Reminder.find({
        completed: false,
        reminderDateTime: { $ne: null },
      }).populate("user", "name email");

      for (const reminder of reminders) {
        if (!reminder.user || !reminder.user.email) continue;

        const reminderTime = moment(reminder.reminderDateTime).tz(reminder.timezone || "Asia/Kolkata");
        const diffMinutes = reminderTime.diff(now, "minutes");

        // If the reminder is in the past by more than 10 minutes, we don't send anything
        if (diffMinutes < 0) continue;

        let emailTypeToSend = null;

        // 24 Hours condition
        if (diffMinutes <= 1440 && diffMinutes > 300 && !reminder.email24Sent) {
          emailTypeToSend = "24h";
        }
        // 5 Hours condition
        else if (diffMinutes <= 300 && diffMinutes > 10 && !reminder.email5Sent) {
          emailTypeToSend = "5h";
        }
        // 10 Minutes condition
        else if (diffMinutes <= 10 && diffMinutes >= 0 && !reminder.email10Sent) {
          emailTypeToSend = "10m";
        }

        if (emailTypeToSend) {
          console.log(`[Scheduler] Triggering ${emailTypeToSend} email for reminder ${reminder._id}`);
          
          const result = await sendReminderEmail({
            to: reminder.user.email,
            userName: reminder.user.name,
            reminder,
            type: emailTypeToSend,
          });

          if (result.success) {
            // Update DB immediately
            if (emailTypeToSend === "24h") reminder.email24Sent = true;
            if (emailTypeToSend === "5h") reminder.email5Sent = true;
            if (emailTypeToSend === "10m") reminder.email10Sent = true;
            
            reminder.lastEmailSentAt = new Date();
            await reminder.save();
          }
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error in cron job:", error.message);
    }
  });
};

module.exports = {
  startScheduler,
};
