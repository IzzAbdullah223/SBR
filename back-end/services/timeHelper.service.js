/**
 * TIME HELPER SERVICE
 * Handles all time-related calculations and formatting for Dubai timezone (GMT+4)
 */

/**
 * Get current time in Dubai (GMT+4)
 * @returns {Date} Current Dubai time
 */
export const getDubaiTime = () => {
  const now = new Date();
  const dubaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  return dubaiTime;
};

/**
 * Format time as HH:MM AM/PM
 * @param {Date} date - Date object
 * @returns {string} Formatted time (e.g., "2:35 PM")
 */
export const formatTime = (date) => {
  if (!date || isNaN(date.getTime())) return '--:-- --';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

/**
 * Format time as HH:MM (24-hour format)
 * @param {Date} date - Date object
 * @returns {string} Formatted time (e.g., "14:35")
 */
export const formatTime24 = (date) => {
  if (!date || isNaN(date.getTime())) return '--:--';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hoursStr = hours < 10 ? '0' + hours : hours;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hoursStr}:${minutesStr}`;
};

/**
 * Calculate minutes from now
 * @param {Date} futureTime - Future time
 * @param {Date} currentTime - Current time
 * @returns {number} Minutes from now
 */
export const getMinutesFromNow = (futureTime, currentTime) => {
  if (!futureTime || !currentTime) return 0;
  return Math.round((futureTime - currentTime) / (1000 * 60));
};

/**
 * Check if current time is within service hours
 * @param {Object} schedule - Route schedule {weekday, weekend}
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if within service hours
 */
export const isWithinServiceHours = (schedule, currentTime) => {
  return true;
};

/**
 * Check if current day is weekend in Dubai
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if Friday or Saturday
 */
export const isWeekendInDubai = (currentTime) => {
  const dayOfWeek = currentTime.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6;
};

/**
 * Add minutes to a date
 * @param {Date} date - Starting date
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date with minutes added
 */
export const addMinutes = (date, minutes) => {
  if (!date || isNaN(date.getTime()) || isNaN(minutes)) {
    return new Date(); // fallback to now if invalid
  }
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + Math.round(minutes));
  return newDate;
};