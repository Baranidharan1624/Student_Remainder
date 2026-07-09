const twilio = require("twilio");

// Initialize Twilio client dynamically to avoid crashing if env vars are missing
let twilioClient = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  }
  return null;
};

// Format WhatsApp numbers (Twilio requires the "whatsapp:" prefix)
const formatWhatsAppNumber = (number) => {
  if (!number) return null;
  // If already formatted, return as is
  if (number.startsWith("whatsapp:")) return number;
  
  // Ensure it has a + prefix for E.164 format
  const cleanNumber = number.startsWith("+") ? number : `+${number}`;
  return `whatsapp:${cleanNumber}`;
};

/**
 * Sends a WhatsApp reminder using Twilio.
 * 
 * @param {Object} options
 * @param {string} options.to - User's WhatsApp number (e.g., +919876543210)
 * @param {string} options.userName - User's name
 * @param {Object} options.reminder - Reminder object
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendWhatsAppReminder = async ({ to, userName, reminder }) => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!client || !fromNumber) {
      console.warn("[TwilioService] ⚠️ Twilio credentials missing. Simulating WhatsApp send.");
      // Simulation for development without real credentials
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, messageId: `mock_${Date.now()}` });
        }, 500);
      });
    }

    const formattedTo = formatWhatsAppNumber(to);
    const formattedFrom = formatWhatsAppNumber(fromNumber);

    if (!formattedTo) {
      throw new Error("Invalid destination WhatsApp number");
    }

    // Professional WhatsApp Message Template
    const messageBody = `🔔 *Student Reminder*

Hi ${userName},

This is a reminder for your task.

📚 *Title*:
${reminder.title || "Untitled Task"}

📂 *Category*:
${reminder.category || "Other"}

⭐ *Priority*:
${reminder.priority || "Medium"}

🕒 *Time*:
${reminder.dueTime || "N/A"}

📝 *Description*:
${reminder.description || "N/A"}

Stay productive and have a great day! 🚀`;

    const message = await client.messages.create({
      body: messageBody,
      from: formattedFrom,
      to: formattedTo,
    });

    console.log(`[TwilioService] ✅ WhatsApp sent to ${to} | SID: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error(`[TwilioService] ❌ Failed to send WhatsApp to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppReminder,
};
