const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const { processReminderDelivery } = require("./notification.service");
const { getCurrentTime } = require("../utils/dateUtils");

const processReminders = async () => {
  const now = getCurrentTime();
  console.log(`[SchedulerService] 🔍 Scanning reminders at ${now.format("YYYY-MM-DD HH:mm:ss")}`);

  try {
    const reminders = await Reminder.find({
      completed: false,
    }).populate("user", "name email notificationEnabled preferredReminderMethod whatsappNumber");

    for (const reminder of reminders) {
      if (!reminder.user || reminder.user.notificationEnabled === false) continue;

      let triggerNotification = false;

      // Iterate over custom schedules
      if (reminder.reminderSchedule && reminder.reminderSchedule.length > 0) {
        for (const schedule of reminder.reminderSchedule) {
          if (!schedule.sent && schedule.dateTime <= now.toDate()) {
            schedule.sent = true;
            triggerNotification = true;
          }
        }
      }

      if (triggerNotification) {
        console.log(`[SchedulerService] 🔔 Triggering notification for: ${reminder.title}`);

        // This handles Twilio/Email dispatch and exponential backoff
        await processReminderDelivery(reminder, reminder.user);

        // Save the updated schedules back to the database
        await reminder.save();
      }
    }
  } catch (error) {
    console.error(`[SchedulerService] ❌ Error processing reminders: ${error.message}`);
  }
};

const startScheduler = () => {
  console.log("[SchedulerService] 🚀 Starting reminder scheduler...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    await processReminders();
  });

  console.log("[SchedulerService] ✅ Scheduler started successfully");
};

module.exports = {
  startScheduler,
};
