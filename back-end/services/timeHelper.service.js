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
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

/**
 * Format time as HH:MM (24-hour format)
 * @param {Date} date - Date object
 * @returns {string} Formatted time (e.g., "14:35")
 */
export const formatTime24 = (date) => {
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
  return Math.round((futureTime - currentTime) / (1000 * 60));
};

/**
 * Check if current time is within service hours
 * @param {Object} schedule - Route schedule {weekday, weekend}
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if within service hours
 */
export const isWithinServiceHours = (schedule, currentTime) => {
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Determine if weekend (Friday or Saturday in Dubai)
  const dayOfWeek = currentTime.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // 5=Friday, 6=Saturday
  
  const serviceSchedule = isWeekend ? schedule.weekend : schedule.weekday;
  
  // Parse first and last bus times
  const [firstHour, firstMin] = serviceSchedule.firstBus.split(':').map(Number);
  const [lastHour, lastMin] = serviceSchedule.lastBus.split(':').map(Number);
  
  const firstBusTime = firstHour * 60 + firstMin;
  let lastBusTime = lastHour * 60 + lastMin;
  
  // Handle times past midnight (e.g., 24:00, 25:00)
  if (lastBusTime < firstBusTime) {
    lastBusTime += 24 * 60;
  }
  
  return currentTimeInMinutes >= firstBusTime && currentTimeInMinutes <= lastBusTime;
};

/**
 * Check if current day is weekend in Dubai
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if Friday or Saturday
 */
export const isWeekendInDubai = (currentTime) => {
  const dayOfWeek = currentTime.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6; // 5=Friday, 6=Saturday
};

/**
 * Add minutes to a date
 * @param {Date} date - Starting date
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date with minutes added
 */
export const addMinutes = (date, minutes) => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};