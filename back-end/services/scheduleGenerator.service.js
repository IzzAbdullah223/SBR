import * as timeHelper from './timeHelper.service.js';

export const calculateWalkingTime = (distanceKm) => {
  const WALKING_SPEED_KMH = 5;
  return Math.ceil((distanceKm / WALKING_SPEED_KMH) * 60);
};

export const getServiceFrequency = (schedule, currentTime) => {
  const isWeekend = timeHelper.isWeekendInDubai(currentTime);
  return isWeekend ? schedule.weekend.frequency : schedule.weekday.frequency;
};

export const generateArrivalTimes = (frequency, currentTime, count = 5) => {
  const arrivals = [];

  // Simulate user arriving at a random point in the bus cycle.
  // First bus is between 3 and (frequency - 1) minutes away — never less than 3.
  // This ensures realistic waits like 5, 9, or 13 minutes, not 1-2 minutes.
  const minWait = Math.max(3, Math.floor(frequency * 0.2));
  const maxWait = frequency - 1;
  const firstBusOffset = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;

  for (let i = 0; i < count; i++) {
    // Subsequent buses are exactly frequency apart — no variance so times never repeat
    const minutesToAdd = firstBusOffset + (i * frequency);
    const arrivalTime = timeHelper.addMinutes(currentTime, minutesToAdd);

    arrivals.push({
      time: arrivalTime,
      minutesFromNow: timeHelper.getMinutesFromNow(arrivalTime, currentTime),
      formatted: timeHelper.formatTime(arrivalTime),
      formatted24: timeHelper.formatTime24(arrivalTime),
    });
  }

  return arrivals;
};

export const calculateTotalJourneyTime = (walkingTimeMin, waitingTimeMin, travelTimeMin) => {
  return walkingTimeMin + waitingTimeMin + travelTimeMin;
};

export const calculateTransferTime = (leg1Duration, transferWaitTime, leg2Duration) => {
  return leg1Duration + transferWaitTime + leg2Duration;
};

// transferRatio — how far through route1 the transfer stop sits (0 = start, 1 = end).
// Calculated in busGenerator from the stop's sequence index.
// Defaults to 0.5 (midpoint) if caller does not provide it.
export const estimateTransferStopArrival = (busArrivalMin, walkingTimeMin, leg1Duration, transferRatio = 0.5) => {
  return busArrivalMin + walkingTimeMin + (leg1Duration * transferRatio);
};