const { sendReminderEmail } = require("./email.service");
const { sendWhatsAppReminder } = require("./twilio.service");

// Exponential backoff helper function
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a notification using a specific provider (Email or WhatsApp)
 * with exponential backoff retry logic.
 * 
 * @param {Function} sendFunction - The function to call (sendReminderEmail or sendWhatsAppReminder)
 * @param {Object} payload - The arguments for the send function
 * @param {number} maxRetries - Maximum number of retries (default 3)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendWithRetry = async (sendFunction, payload, maxRetries = 3) => {
  let attempt = 0;
  let delay = 1000; // Start with 1 second delay

  while (attempt <= maxRetries) {
    const result = await sendFunction(payload);
    
    if (result.success) {
      return true;
    }

    attempt++;
    if (attempt <= maxRetries) {
      console.warn(`[NotificationService] ⚠️ Delivery failed. Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
      await wait(delay);
      delay *= 2; // Exponential backoff (1s, 2s, 4s, etc.)
    }
  }

  console.error(`[NotificationService] ❌ Delivery failed after ${maxRetries} retries.`);
  return false;
};

/**
 * Orchestrates sending reminder notifications based on the user's selected notification methods.
 * Updates the reminder's deliveryStatus accordingly.
 * 
 * @param {Object} reminder - The Reminder mongoose document
 * @param {Object} user - The populated User object
 */
const processReminderDelivery = async (reminder, user) => {
  if (!reminder || !user) return;

  const methods = reminder.notificationMethods || [];
  
  // Track status updates to save later
  let requiresSave = false;

  // Make sure deliveryStatus object exists
  if (!reminder.deliveryStatus) {
    reminder.deliveryStatus = { emailStatus: "Pending", whatsappStatus: "Pending" };
    requiresSave = true;
  }

  // ---- 1. EMAIL NOTIFICATION ----
  if (methods.includes("email")) {
    if (user.email) {
      const emailPayload = {
        to: user.email,
        userName: user.name,
        reminder: reminder,
        type: "oneDay", // Use standard type for formatting
      };
      
      const emailSuccess = await sendWithRetry(sendReminderEmail, emailPayload, 0); // Usually don't retry email heavily, or set to 1
      
      reminder.deliveryStatus.emailStatus = emailSuccess ? "Sent" : "Failed";
      requiresSave = true;
    } else {
      reminder.deliveryStatus.emailStatus = "Failed";
      requiresSave = true;
    }
  }

  // ---- 2. WHATSAPP NOTIFICATION ----
  if (methods.includes("whatsapp")) {
    if (user.whatsappNumber) {
      const whatsappPayload = {
        to: user.whatsappNumber,
        userName: user.name,
        reminder: reminder,
      };

      // Retry up to 3 times as specified in requirements
      const whatsappSuccess = await sendWithRetry(sendWhatsAppReminder, whatsappPayload, 3);
      
      reminder.deliveryStatus.whatsappStatus = whatsappSuccess ? "Sent" : "Failed";
      requiresSave = true;
    } else {
      reminder.deliveryStatus.whatsappStatus = "Failed";
      requiresSave = true;
    }
  }

  // Save the updated statuses back to the database
  if (requiresSave) {
    try {
      await reminder.save();
    } catch (error) {
      console.error(`[NotificationService] ❌ Failed to save reminder status: ${error.message}`);
    }
  }
};

module.exports = {
  processReminderDelivery,
};
