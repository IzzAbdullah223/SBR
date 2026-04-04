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
  const firstBusOffset = Math.floor(Math.random() * 5) + 1;

  for (let i = 0; i < count; i++) {
    const variance = Math.floor(Math.random() * 3);
    const minutesToAdd = firstBusOffset + (i * frequency) + variance;
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