import * as timeHelper from './timeHelper.service.js';

export const calculateWalkingTime = (distanceKm) => {
  const WALKING_SPEED_KMH = 5;
  return Math.ceil((distanceKm / WALKING_SPEED_KMH) * 60);
};

export const getServiceFrequency = (schedule, currentTime) => {
  const isWeekend = timeHelper.isWeekendInDubai(currentTime);
  return isWeekend ? schedule.weekend.frequency : schedule.weekday.frequency;
};

export const generateArrivalTimes = (frequency, currentTime, count = 5, forceMinOffset = null) => {
  const arrivals = [];

  // Guard — frequency must be a positive number
  if (!frequency || frequency <= 0) frequency = 15;

  let firstBusOffset;

  if (forceMinOffset !== null && !isNaN(forceMinOffset) && forceMinOffset > 0) {
    // Round up to the next clean frequency slot AFTER the minimum walking time
    // Example: minDeparture=14, frequency=15 → ceil(14/15)*15 = 15
    firstBusOffset = Math.ceil(forceMinOffset / frequency) * frequency;
    // Safety: if rounding landed below minimum, add one more frequency slot
    if (firstBusOffset < forceMinOffset) firstBusOffset += frequency;
  } else {
    // Normal random offset — simulates arriving mid-cycle
    const minWait = Math.max(3, Math.floor(frequency * 0.2));
    const maxWait = frequency - 1;
    firstBusOffset = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;
  }

  // Final guard — firstBusOffset must be a valid number
  if (isNaN(firstBusOffset) || firstBusOffset <= 0) firstBusOffset = frequency;

  for (let i = 0; i < count; i++) {
    const minutesToAdd = firstBusOffset + (i * frequency);
    const arrivalTime  = timeHelper.addMinutes(currentTime, minutesToAdd);

    arrivals.push({
      time:           arrivalTime,
      minutesFromNow: timeHelper.getMinutesFromNow(arrivalTime, currentTime),
      formatted:      timeHelper.formatTime(arrivalTime),
      formatted24:    timeHelper.formatTime24(arrivalTime),
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

export const estimateTransferStopArrival = (busArrivalMin, walkingTimeMin, leg1Duration, transferRatio = 0.5) => {
  return busArrivalMin + walkingTimeMin + (leg1Duration * transferRatio);
};