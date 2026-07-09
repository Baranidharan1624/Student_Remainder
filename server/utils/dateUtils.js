const moment = require("moment-timezone");

const TIMEZONE = "Asia/Kolkata";

/**
 * Get current time in Asia/Kolkata timezone
 */
const getCurrentTime = () => {
  return moment().tz(TIMEZONE);
};

/**
 * Format a Date object to readable string in Kolkata timezone
 * @param {Date} date - The date to format
 * @param {string} format - Moment format string
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = "DD MMMM YYYY") => {
  return moment(date).tz(TIMEZONE).format(format);
};

/**
 * Format time from a Date object
 * @param {Date} date - The date to format
 * @returns {string} Formatted time string (e.g., "5:00 PM")
 */
const formatTime = (date) => {
  return moment(date).tz(TIMEZONE).format("hh:mm A");
};

/**
 * Calculate the difference in minutes between two dates
 * @param {Date} futureDate - The future date
 * @param {Date} pastDate - The past date (defaults to now)
 * @returns {number} Difference in minutes (positive if futureDate is after pastDate)
 */
const getDiffMinutes = (futureDate, pastDate = null) => {
  const now = pastDate ? moment(pastDate).tz(TIMEZONE) : getCurrentTime();
  const future = moment(futureDate).tz(TIMEZONE);
  return future.diff(now, "minutes");
};

/**
 * Calculate remaining time as a human-readable string
 * @param {Date} reminderDateTime - The reminder date/time
 * @returns {string} Human-readable remaining time
 */
const calculateRemainingTime = (reminderDateTime) => {
  const now = getCurrentTime();
  const reminder = moment(reminderDateTime).tz(TIMEZONE);
  const diffMinutes = reminder.diff(now, "minutes");

  if (diffMinutes <= 0) return "Overdue";

  const days = Math.floor(diffMinutes / (24 * 60));
  const hours = Math.floor((diffMinutes % (24 * 60)) / 60);
  const minutes = diffMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(", ") : "Less than a minute";
};

/**
 * Calculate the target time by subtracting hours/minutes from a date
 * @param {Date} baseDate - The base date
 * @param {number} minutesToSubtract - Minutes to subtract
 * @returns {Date} The calculated target time
 */
const subtractMinutes = (baseDate, minutesToSubtract) => {
  return moment(baseDate).tz(TIMEZONE).subtract(minutesToSubtract, "minutes").toDate();
};

/**
 * Check if a target time has been reached (within a 1-minute window)
 * @param {Date} targetTime - The target time to check
 * @returns {boolean} True if the target time has been reached
 */
const hasTimeArrived = (targetTime) => {
  const now = getCurrentTime();
  const target = moment(targetTime).tz(TIMEZONE);
  const diffMinutes = now.diff(target, "minutes");
  // Allow a 1-minute window for the check
  return diffMinutes >= 0 && diffMinutes < 1;
};

/**
 * Get start of today in Kolkata timezone
 */
const getStartOfToday = () => {
  return getCurrentTime().startOf("day").toDate();
};

/**
 * Get end of today in Kolkata timezone
 */
const getEndOfToday = () => {
  return getCurrentTime().endOf("day").toDate();
};

module.exports = {
  TIMEZONE,
  getCurrentTime,
  formatDate,
  formatTime,
  getDiffMinutes,
  calculateRemainingTime,
  subtractMinutes,
  hasTimeArrived,
  getStartOfToday,
  getEndOfToday,
};
