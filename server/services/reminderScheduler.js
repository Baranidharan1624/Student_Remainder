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

      // Find incomplete reminders
      const reminders = await Reminder.find({
        completed: false,
      }).populate("user", "name email");

      for (const reminder of reminders) {
        if (!reminder.user || !reminder.user.email) continue;
        if (!reminder.reminderSchedules || reminder.reminderSchedules.length === 0) continue;

        let hasUpdates = false;

        for (let i = 0; i < reminder.reminderSchedules.length; i++) {
          const schedule = reminder.reminderSchedules[i];
          if (schedule.emailSent) continue;

          const scheduleTime = moment(schedule.reminderDate).tz(reminder.timezone || "Asia/Kolkata");

          if (scheduleTime.isSameOrBefore(now)) {
            console.log(`[Scheduler] Triggering email for reminder ${reminder._id} (Schedule ${i + 1}/${reminder.reminderSchedules.length})`);

            const result = await sendReminderEmail({
              to: reminder.user.email,
              userName: reminder.user.name,
              reminder,
              scheduleNumber: i + 1,
              totalSchedules: reminder.reminderSchedules.length,
              scheduleDate: schedule.reminderDate
            });

            if (result.success) {
              schedule.emailSent = true;
              schedule.sentAt = new Date();
              hasUpdates = true;
            }
          }
        }

        if (hasUpdates) {
          // Because reminderSchedules is an array of subdocuments, saving the parent document will update them
          await reminder.save();
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
