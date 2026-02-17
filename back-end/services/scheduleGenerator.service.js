/**
 * SCHEDULE GENERATOR SERVICE
 * Handles bus schedule generation and walking time calculations
 */

import * as timeHelper from './timeHelper.service.js';

/**
 * Calculate walking time from distance
 * Average walking speed: 5 km/h
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Walking time in minutes
 */
export const calculateWalkingTime = (distanceKm) => {
  const WALKING_SPEED_KMH = 5;
  const timeInHours = distanceKm / WALKING_SPEED_KMH;
  const timeInMinutes = timeInHours * 60;
  return Math.ceil(timeInMinutes); // Round up
};

/**
 * Get service frequency based on schedule and current time
 * @param {Object} schedule - Route schedule {weekday, weekend}
 * @param {Date} currentTime - Current time
 * @returns {number} Frequency in minutes
 */
export const getServiceFrequency = (schedule, currentTime) => {
  const isWeekend = timeHelper.isWeekendInDubai(currentTime);
  return isWeekend ? schedule.weekend.frequency : schedule.weekday.frequency;
};

/**
 * Generate next bus arrival times based on frequency
 * @param {number} frequency - Minutes between buses
 * @param {Date} currentTime - Current time
 * @param {number} count - Number of buses to generate (default: 5)
 * @returns {Array} Array of arrival time objects
 */
export const generateArrivalTimes = (frequency, currentTime, count = 5) => {
  const arrivals = [];
  
  // First bus: Random offset between 1-5 minutes from now
  const firstBusOffset = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < count; i++) {
    // Calculate arrival time with small random variance (0-2 minutes)
    const variance = Math.floor(Math.random() * 3);
    const minutesToAdd = firstBusOffset + (i * frequency) + variance;
    
    const arrivalTime = timeHelper.addMinutes(currentTime, minutesToAdd);
    const minutesFromNow = timeHelper.getMinutesFromNow(arrivalTime, currentTime);
    
    arrivals.push({
      time: arrivalTime,
      minutesFromNow: minutesFromNow,
      formatted: timeHelper.formatTime(arrivalTime),
      formatted24: timeHelper.formatTime24(arrivalTime)
    });
  }
  
  return arrivals;
};

/**
 * Calculate total journey time
 * @param {number} walkingTimeMin - Time to walk to stop
 * @param {number} waitingTimeMin - Time waiting for bus
 * @param {number} travelTimeMin - Time on bus
 * @returns {number} Total time in minutes
 */
export const calculateTotalJourneyTime = (walkingTimeMin, waitingTimeMin, travelTimeMin) => {
  return walkingTimeMin + waitingTimeMin + travelTimeMin;
};

/**
 * Calculate transfer journey time
 * @param {number} leg1Duration - First leg duration
 * @param {number} transferWaitTime - Wait time at transfer stop
 * @param {number} leg2Duration - Second leg duration
 * @returns {number} Total transfer time in minutes
 */
export const calculateTransferTime = (leg1Duration, transferWaitTime, leg2Duration) => {
  return leg1Duration + transferWaitTime + leg2Duration;
};

/**
 * Estimate arrival time at transfer stop
 * @param {number} busArrivalMin - Minutes until bus arrives at origin
 * @param {number} walkingTimeMin - Walking time to origin stop
 * @param {number} leg1Duration - Duration of first leg
 * @returns {number} Minutes until arrival at transfer stop
 */
export const estimateTransferStopArrival = (busArrivalMin, walkingTimeMin, leg1Duration) => {
  // Approximate time to transfer stop (usually halfway through route)
  return busArrivalMin + walkingTimeMin + (leg1Duration / 2);
};