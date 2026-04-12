import BusStop from '../models/BusStop.js';
import { calculateWalkingDistance } from './geoCalculator.service.js';
import * as timeHelper from './timeHelper.service.js';
import * as scheduleGen from './scheduleGenerator.service.js';

const DEFAULT_SCHEDULE = {
  weekday: { firstBus: '05:00', lastBus: '23:30', frequency: 15 },
  weekend: { firstBus: '06:00', lastBus: '23:00', frequency: 20 },
};

const getRouteSchedule = (route) => route.schedule || DEFAULT_SCHEDULE;

export const generateDirectBuses = (routeInfo, origin, destination, currentTime = null) => {
  const { route, originStop, destStop } = routeInfo;
  const buses = [];

  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  const schedule  = getRouteSchedule(route);

  if (!timeHelper.isWithinServiceHours(schedule, dubaiTime)) return buses;

  const frequency       = scheduleGen.getServiceFrequency(schedule, dubaiTime);
  const walkingDistance = calculateWalkingDistance(origin, originStop);
  const walkingTime     = scheduleGen.calculateWalkingTime(walkingDistance);
  const routeTravelTime = route.stats?.duration || 20;
  const minDeparture    = walkingTime + 2;

  // Generate large pool so the filter always has enough to work with
  const allArrivalTimes = scheduleGen.generateArrivalTimes(frequency, dubaiTime, 15);

  let arrivalTimes = allArrivalTimes
    .filter(dep => !isNaN(dep.minutesFromNow) && dep.minutesFromNow >= minDeparture)
    .slice(0, 5);

  // If random offset caused all buses to be filtered out,
  // force-generate starting from the correct minimum offset
  if (arrivalTimes.length === 0) {
    const forced = scheduleGen.generateArrivalTimes(
      frequency,
      dubaiTime,
      5,
      minDeparture
    );
    arrivalTimes = forced.filter(dep => !isNaN(dep.minutesFromNow));
  }

  if (arrivalTimes.length === 0) return buses;

  arrivalTimes.forEach((arrival, i) => {
    const busId = `${route.routeNumber}-${Date.now()}-${i}`;
    const totalJourneyTime = scheduleGen.calculateTotalJourneyTime(
      walkingTime,
      arrival.minutesFromNow,
      routeTravelTime
    );

    buses.push({
      busId,
      routeNumber:  route.routeNumber,
      routeName:    route.name || `Route ${route.routeNumber}`,
      routeType:    route.type || 'bus',
      color:        route.color || '#667eea',

      arrivalTime:     arrival.minutesFromNow,
      travelTime:      routeTravelTime,
      cost:            route.fare?.nolFare  || route.fare?.baseFare || 3,
      nolFare:         route.fare?.nolFare  || route.fare?.baseFare || 3,
      cashFare:        route.fare?.cashFare || (route.fare?.baseFare || 3) + 1,
      walkingDistance,
      walkingTime,
      transfers: 0,

      departureTime:   arrival.formatted,
      departureTime24: arrival.formatted24,
      totalJourneyTime,

      journeyType: 'direct',
      originStop: {
        stopId:   originStop.stopId,
        name:     originStop.name,
        position: originStop.position,
      },
      destinationStop: {
        stopId:   destStop.stopId,
        name:     destStop.name,
        position: destStop.position,
      },
      stops:         route.stops        || [],
      shapeId:       route.shapeId      || null,
      shapeIdReturn: route.shapeIdReturn || null,
    });
  });

  return buses;
};

export const generateTransferBuses = async (
  transferInfo,
  origin,
  destination,
  currentTime = null,
  transferStopMap = {}
) => {
  const { route1, route2, originStop, transferStopId, destStop } = transferInfo;

  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  const schedule1 = getRouteSchedule(route1);
  const schedule2 = getRouteSchedule(route2);

  if (
    !timeHelper.isWithinServiceHours(schedule1, dubaiTime) ||
    !timeHelper.isWithinServiceHours(schedule2, dubaiTime)
  ) return [];

  const transferStop = transferStopMap[transferStopId];
  if (!transferStop) return [];

  const buses            = [];
  const frequency1       = scheduleGen.getServiceFrequency(schedule1, dubaiTime);
  const walkingDistance  = calculateWalkingDistance(origin, originStop);
  const walkingTime      = scheduleGen.calculateWalkingTime(walkingDistance);
  const leg1Duration     = route1.stats?.duration || 20;
  const leg2Duration     = route2.stats?.duration || 20;
  const transferWaitTime = 5;
  const minDeparture     = walkingTime + 2;

  // Generate large pool then filter
  const allLeg1Arrivals = scheduleGen.generateArrivalTimes(frequency1, dubaiTime, 15);

  let leg1Arrivals = allLeg1Arrivals
    .filter(dep => !isNaN(dep.minutesFromNow) && dep.minutesFromNow >= minDeparture)
    .slice(0, 3);

  // Forced fallback for transfer leg 1
  if (leg1Arrivals.length === 0) {
    const forced = scheduleGen.generateArrivalTimes(
      frequency1,
      dubaiTime,
      3,
      minDeparture
    );
    leg1Arrivals = forced.filter(dep => !isNaN(dep.minutesFromNow));
  }

  if (leg1Arrivals.length === 0) return buses;

  const route1Stops   = route1.stops || [];
  const transferIndex = route1Stops.findIndex(s => s.stopId === transferStopId);
  const transferRatio = transferIndex >= 0
    ? transferIndex / Math.max(route1Stops.length - 1, 1)
    : 0.5;

  leg1Arrivals.forEach((leg1Arrival, i) => {
    // Guard against NaN in time calculations
    if (isNaN(leg1Arrival.minutesFromNow)) return;

    const timeToTransferStop = walkingTime + (leg1Duration * transferRatio);
    const arrivalAtTransfer  = leg1Arrival.minutesFromNow + timeToTransferStop;
    const leg2DepartureMin   = Math.ceil(arrivalAtTransfer + transferWaitTime);

    // Guard — leg2DepartureMin must be a valid number before passing to addMinutes
    if (isNaN(leg2DepartureMin)) return;

    const leg2DepartureTime  = timeHelper.addMinutes(dubaiTime, leg2DepartureMin);
    const totalTime          = scheduleGen.calculateTransferTime(leg1Duration, transferWaitTime, leg2Duration);

    const leg1Nol  = route1.fare?.nolFare  || route1.fare?.baseFare || 3;
    const leg2Nol  = route2.fare?.nolFare  || route2.fare?.baseFare || 3;
    const leg1Cash = route1.fare?.cashFare || leg1Nol + 1;
    const leg2Cash = route2.fare?.cashFare || leg2Nol + 1;
    const totalCost = leg1Nol + leg2Nol;

    const busId = `${route1.routeNumber}-${route2.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: `${route1.routeNumber} → ${route2.routeNumber}`,
      routeName:   `${route1.name || route1.routeNumber} + ${route2.name || route2.routeNumber}`,
      routeType:   'transfer',
      color:       route1.color || '#667eea',

      arrivalTime:     leg1Arrival.minutesFromNow,
      travelTime:      totalTime,
      cost:            totalCost,
      nolFare:         leg1Nol + leg2Nol,
      cashFare:        leg1Cash + leg2Cash,
      walkingDistance,
      walkingTime,
      transfers: 1,

      departureTime:       leg1Arrival.formatted,
      departureTime24:     leg1Arrival.formatted24,
      leg1DepartureTime:   leg1Arrival.formatted,
      leg1DepartureTime24: leg1Arrival.formatted24,
      leg2DepartureTime:   timeHelper.formatTime(leg2DepartureTime),
      leg2DepartureTime24: timeHelper.formatTime24(leg2DepartureTime),

      journeyType: 'transfer',
      leg1: {
        routeNumber:   route1.routeNumber,
        routeName:     route1.name || `Route ${route1.routeNumber}`,
        duration:      leg1Duration,
        cost:          leg1Nol,
        nolFare:       leg1Nol,
        cashFare:      leg1Cash,
        departureTime: leg1Arrival.formatted,
      },
      leg2: {
        routeNumber:   route2.routeNumber,
        routeName:     route2.name || `Route ${route2.routeNumber}`,
        duration:      leg2Duration,
        cost:          leg2Nol,
        nolFare:       leg2Nol,
        cashFare:      leg2Cash,
        departureTime: timeHelper.formatTime(leg2DepartureTime),
      },
      transferStop: {
        stopId:   transferStop.stopId,
        name:     transferStop.name,
        position: transferStop.position,
      },
      originStop: {
        stopId:   originStop.stopId,
        name:     originStop.name,
        position: originStop.position,
      },
      destinationStop: {
        stopId:   destStop.stopId,
        name:     destStop.name,
        position: destStop.position,
      },
      shapeId:           route1.shapeId        || null,
      shapeIdReturn:     route1.shapeIdReturn   || null,
      shapeIdLeg2:       route2.shapeId         || null,
      shapeIdLeg2Return: route2.shapeIdReturn   || null,
    });
  });

  return buses;
};

export const generateAllBuses = async (routeData, origin, destination, currentTime = null) => {
  const allBuses  = [];
  const dubaiTime = currentTime || timeHelper.getDubaiTime();

  // Single DB query for ALL transfer stops instead of one per transfer
  if (routeData.transferRoutes.length > 0) {
    const transferStopIds = routeData.transferRoutes.map(t => t.transferStopId);
    const transferStops   = await BusStop.find({ stopId: { $in: transferStopIds } });

    const transferStopMap = {};
    transferStops.forEach(s => { transferStopMap[s.stopId] = s; });

    for (const transferInfo of routeData.transferRoutes) {
      const buses = await generateTransferBuses(
        transferInfo,
        origin,
        destination,
        dubaiTime,
        transferStopMap
      );
      allBuses.push(...buses);
    }
  }

  for (const routeInfo of routeData.directRoutes) {
    const buses = generateDirectBuses(routeInfo, origin, destination, dubaiTime);
    allBuses.push(...buses);
  }

  return allBuses;
};