const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const {
  formatDate,
  formatTime,
  calculateRemainingTime,
} = require("../utils/dateUtils");

// ==========================================
// TRANSPORTER
// ==========================================
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ==========================================
// TEMPLATE LOADER
// ==========================================
const loadTemplate = (templateName) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.html`
  );
  return fs.readFileSync(templatePath, "utf-8");
};

// ==========================================
// TEMPLATE RENDERER (simple Handlebars-like)
// ==========================================
const renderTemplate = (template, data) => {
  let rendered = template;

  // Replace simple {{key}} placeholders
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(regex, value !== undefined && value !== null ? String(value) : "");
  }

  // Handle {{#if key}}...{{/if}} blocks
  const ifRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(ifRegex, (match, key, content) => {
    return data[key] ? content : "";
  });

  return rendered;
};

// ==========================================
// PRIORITY COLORS
// ==========================================
const getPriorityColor = (priority) => {
  const colors = {
    High: "#ef4444",
    Medium: "#f97316",
    Low: "#22c55e",
  };
  return colors[priority] || "#6b7280";
};

// ==========================================
// NOTIFICATION CONFIG
// ==========================================
const getNotificationConfig = (type) => {
  const configs = {
    oneDay: {
      subject: (title) => `📚 Reminder Tomorrow: ${title}`,
      badgeText: "Tomorrow",
      badgeColor: "#6366f1",
      greetingText: "This is a reminder for your upcoming task due **tomorrow**.",
      remainingBgColor: "#eef2ff",
      remainingBorderColor: "#c7d2fe",
      remainingTextColor: "#4f46e5",
    },
    fiveHours: {
      subject: (title) => `⏳ Reminder in 5 Hours: ${title}`,
      badgeText: "In 5 Hours",
      badgeColor: "#f59e0b",
      greetingText: "This is a reminder for your upcoming task due in **5 hours**.",
      remainingBgColor: "#fffbeb",
      remainingBorderColor: "#fde68a",
      remainingTextColor: "#d97706",
    },
    thirtyMinutes: {
      subject: (title) => `⚠️ Reminder in 30 Minutes: ${title}`,
      badgeText: "In 30 Minutes",
      badgeColor: "#f97316",
      greetingText: "This is a reminder for your upcoming task due in **30 minutes**.",
      remainingBgColor: "#fff7ed",
      remainingBorderColor: "#fed7aa",
      remainingTextColor: "#ea580c",
    },
    tenMinutes: {
      subject: (title) => `🚨 Starts in 10 Minutes: ${title}`,
      badgeText: "In 10 Minutes",
      badgeColor: "#ef4444",
      greetingText: "This is a reminder for your upcoming task starting in **10 minutes**!",
      remainingBgColor: "#fef2f2",
      remainingBorderColor: "#fecaca",
      remainingTextColor: "#dc2626",
    },
  };
  return configs[type] || configs.oneDay;
};

// ==========================================
// SEND REMINDER EMAIL
// ==========================================
const sendReminderEmail = async ({ to, userName, reminder, type }) => {
  try {
    const transporter = createTransporter();
    const config = getNotificationConfig(type);

    const reminderDate = reminder.reminderDateTime || reminder.dueDate;

    const templateData = {
      userName: userName,
      title: reminder.title || "Untitled Reminder",
      subject: reminder.subject || "N/A",
      category: reminder.category || "Other",
      priority: reminder.priority || "Medium",
      priorityColor: getPriorityColor(reminder.priority),
      date: formatDate(reminderDate),
      time: formatTime(reminderDate),
      remainingTime: calculateRemainingTime(reminderDate),
      description: reminder.description || "",
      subject_text: config.subject(reminder.title),
      badgeText: config.badgeText,
      badgeColor: config.badgeColor,
      greetingText: config.greetingText,
      remainingBgColor: config.remainingBgColor,
      remainingBorderColor: config.remainingBorderColor,
      remainingTextColor: config.remainingTextColor,
      actionUrl: process.env.CLIENT_URL || "http://localhost:3000/dashboard",
      actionText: "Open Student Reminder",
      footerText: "Good luck with your studies!",
    };

    const template = loadTemplate("reminderTemplate");
    const htmlContent = renderTemplate(template, templateData);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Student Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject: config.subject(reminder.title),
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Reminder email sent to ${to} | Type: ${type} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send reminder email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND WELCOME EMAIL
// ==========================================
const sendWelcomeEmail = async ({ to, userName }) => {
  try {
    const transporter = createTransporter();

    const templateData = {
      userName: userName,
      title: "Welcome to Student Reminder!",
      subject: "Welcome",
      category: "System",
      priority: "Low",
      priorityColor: "#22c55e",
      date: formatDate(new Date()),
      time: formatTime(new Date()),
      remainingTime: "N/A",
      description: "Your account has been created successfully. Start adding reminders to never miss a deadline again!",
      subject_text: "Welcome to Student Reminder",
      badgeText: "Welcome",
      badgeColor: "#22c55e",
      greetingText: "We are excited to have you on board!",
      remainingBgColor: "#f0fdf4",
      remainingBorderColor: "#bbf7d0",
      remainingTextColor: "#16a34a",
      actionUrl: process.env.CLIENT_URL || "http://localhost:3000/dashboard",
      actionText: "Go to Dashboard",
      footerText: "Start adding reminders to stay organized!",
    };

    const template = loadTemplate("reminderTemplate");
    const htmlContent = renderTemplate(template, templateData);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Student Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to Student Reminder, ${userName}! 🎉`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Welcome email sent to ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send welcome email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND DAILY SUMMARY EMAIL
// ==========================================
const sendDailySummaryEmail = async ({ to, userName, reminders }) => {
  try {
    const transporter = createTransporter();

    const reminderRows = reminders
      .map((r) => {
        const time = r.reminderDateTime ? formatTime(r.reminderDateTime) : r.dueTime || "N/A";
        const pColor = getPriorityColor(r.priority);
        return `
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${pColor}; margin-right: 8px;"></span>
              <strong style="color: #111827;">${r.title}</strong>
            </td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${r.subject || "N/A"}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${time}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6;">
              <span style="display: inline-block; background-color: ${pColor}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${r.priority}</span>
            </td>
          </tr>
        `;
      })
      .join("");

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f2f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 30px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📚 Daily Summary</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 14px;">${formatDate(new Date(), "dddd, MMMM Do YYYY")}</p>
        </div>
        <div style="background-color: #ffffff; padding: 30px 40px; border-radius: 0 0 16px 16px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
            Hello <strong>${userName}</strong>, here are your reminders for today:
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Title</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Subject</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Time</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Priority</th>
              </tr>
            </thead>
            <tbody>
              ${reminderRows}
            </tbody>
          </table>
          <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">Good luck with your studies! 🎯</p>
        </div>
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
          Student Reminder &copy; 2026
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Student Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📚 Daily Summary: You have ${reminders.length} reminder${reminders.length > 1 ? "s" : ""} today`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Daily summary sent to ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send daily summary to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND MISSED REMINDER EMAIL
// ==========================================
const sendMissedReminderEmail = async ({ to, userName, reminder }) => {
  try {
    const transporter = createTransporter();

    const reminderDate = reminder.reminderDateTime || reminder.dueDate;

    const templateData = {
      userName: userName,
      title: reminder.title || "Untitled Reminder",
      subject: reminder.subject || "N/A",
      category: reminder.category || "Other",
      priority: reminder.priority || "Medium",
      priorityColor: getPriorityColor(reminder.priority),
      date: formatDate(reminderDate),
      time: formatTime(reminderDate),
      remainingTime: "Missed",
      description: reminder.description || "",
      subject_text: "Missed Reminder",
      badgeText: "Missed",
      badgeColor: "#6b7280",
      greetingText: "It looks like you missed this reminder. Don't worry, you can still complete it!",
      remainingBgColor: "#f9fafb",
      remainingBorderColor: "#e5e7eb",
      remainingTextColor: "#6b7280",
      actionUrl: process.env.CLIENT_URL || "http://localhost:3000/dashboard",
      actionText: "View Reminder",
      footerText: "Stay on top of your tasks with Student Reminder!",
    };

    const template = loadTemplate("reminderTemplate");
    const htmlContent = renderTemplate(template, templateData);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Student Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📭 Missed Reminder: ${reminder.title}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Missed reminder email sent to ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send missed reminder email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ==========================================
// SEND COMPLETION EMAIL
// ==========================================
const sendCompletionEmail = async ({ to, userName, reminder }) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f2f5;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px 16px 0 0; padding: 30px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Task Completed!</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px 40px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="margin: 0 0 16px 0; font-size: 17px; color: #374151;">
            Hello <strong>${userName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
            Congratulations! You have completed your reminder:
          </p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 18px; color: #16a34a; font-weight: 700;">${reminder.title}</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #6b7280;">${reminder.category || "Other"} &bull; ${reminder.priority || "Medium"} Priority</p>
          </div>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Keep up the great work! 💪</p>
        </div>
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
          Student Reminder &copy; 2026
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Student Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Task Completed: ${reminder.title}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Completion email sent to ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send completion email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ==========================================
// VERIFY TRANSPORTER
// ==========================================
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("[EmailService] ✅ SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error(`[EmailService] ❌ SMTP verification failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendReminderEmail,
  sendWelcomeEmail,
  sendDailySummaryEmail,
  sendMissedReminderEmail,
  sendCompletionEmail,
  verifyTransporter,
};
