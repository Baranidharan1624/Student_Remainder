const nodemailer = require("nodemailer");
const moment = require("moment-timezone");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendReminderEmail = async ({
  to,
  userName,
  reminder,
  scheduleNumber,
  totalSchedules,
  scheduleDate
}) => {
  try {
    const transporter = createTransporter();

    let subjectPrefix = `Reminder: ${reminder.title}`;

    const targetDueDateTimeStr = `${new Date(reminder.dueDate).toISOString().split("T")[0]}T${reminder.dueTime || "23:59"}:00`;
    const remainingTimeDiff = moment(targetDueDateTimeStr)
      .tz(reminder.timezone || "Asia/Kolkata")
      .diff(moment(scheduleDate || new Date()).tz(reminder.timezone || "Asia/Kolkata"));

    const remainingDuration = moment.duration(remainingTimeDiff > 0 ? remainingTimeDiff : 0);
    const days = Math.floor(remainingDuration.asDays());
    const hours = remainingDuration.hours();
    const minutes = remainingDuration.minutes();

    let remainingText = "";
    if (days > 0) remainingText += `${days} Days `;
    if (hours > 0) remainingText += `${hours} Hours `;
    if (minutes > 0 || remainingText === "") remainingText += `${minutes} Minutes`;

    const targetDueDateTimeStrForFormat = `${new Date(reminder.dueDate).toISOString().split("T")[0]}T${reminder.dueTime || "23:59"}:00`;
    const dueDateFormatted = moment(targetDueDateTimeStrForFormat)
      .tz(reminder.timezone || "Asia/Kolkata")
      .format("DD MMMM YYYY");

    const dueTimeFormatted = reminder.dueTime
      ? moment(targetDueDateTimeStrForFormat).tz(reminder.timezone || "Asia/Kolkata").format("hh:mm A")
      : "Not set";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; color: #1f2937; line-height: 1.5;">
        <div style="background-color: #2563EB; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Student Reminder</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">This is a reminder for your upcoming task.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold; width: 40%;">Title</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${reminder.title}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Subject</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${reminder.subject || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Priority</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${reminder.priority}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Category</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${reminder.category}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Due Date</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${dueDateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Due Time</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${dueTimeFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Current Reminder Number</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Reminder ${scheduleNumber} of ${totalSchedules}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Scheduled Reminder Date</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${moment(scheduleDate).tz(reminder.timezone || "Asia/Kolkata").format("DD MMMM YYYY")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold;">Scheduled Reminder Time</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${moment(scheduleDate).tz(reminder.timezone || "Asia/Kolkata").format("hh:mm A")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold; color: #DC2626;">Remaining Time</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #DC2626; font-weight: bold;">${remainingText}</td>
            </tr>
          </table>

          ${reminder.description ? `<p style="font-size: 14px; color: #4b5563; padding: 10px; background-color: #f3f4f6; border-radius: 4px;"><strong>Description:</strong><br/>${reminder.description}</p>` : ""}
          
          <p style="font-size: 16px; margin-top: 20px;">Good luck!</p>
          <p style="font-size: 14px; color: #6b7280;">Student Reminder Team</p>
        </div>
        
        <div style="text-align: center; padding: 15px; font-size: 12px; color: #9ca3af;">
          <p>You received this email because you set a reminder in the Student Reminder app.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Student Reminder" <noreply@studentreminder.com>',
      to,
      subject: subjectPrefix,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendReminderEmail,
};
