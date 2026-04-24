import BusStop from '../models/BusStop.js';
import { calculateWalkingDistance } from './geoCalculator.service.js';
import * as timeHelper from './timeHelper.service.js';
import * as scheduleGen from './scheduleGenerator.service.js';

const DEFAULT_SCHEDULE = {
  weekday: { firstBus: '05:00', lastBus: '23:30', frequency: 15 },
  weekend: { firstBus: '06:00', lastBus: '23:00', frequency: 20 },
};

const getRouteSchedule = (route) => route.schedule || DEFAULT_SCHEDULE;

export const generateDirectBuses = (
  routeInfo,
  origin,
  destination,
  currentTime = null
) => {
  const { route, originStop, destStop } = routeInfo;
  const buses = [];

  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  const schedule = getRouteSchedule(route);

  if (!timeHelper.isWithinServiceHours(schedule, dubaiTime)) return buses;

  const frequency = scheduleGen.getServiceFrequency(schedule, dubaiTime);
  const walkingDistance = calculateWalkingDistance(origin, originStop);
  const walkingTime = scheduleGen.calculateWalkingTime(walkingDistance); // mins to walk to stop
  const routeTravelTime = route.stats?.duration || 20;                  // mins riding the bus
  const minDeparture = walkingTime + 2;

  const allArrivalTimes = scheduleGen.generateArrivalTimes(frequency, dubaiTime, 15);

  let arrivalTimes = allArrivalTimes
    .filter((dep) => !isNaN(dep.minutesFromNow) && dep.minutesFromNow >= minDeparture)
    .slice(0, 5);

  if (arrivalTimes.length === 0) {
    const forced = scheduleGen.generateArrivalTimes(frequency, dubaiTime, 5, minDeparture);
    arrivalTimes = forced.filter((dep) => !isNaN(dep.minutesFromNow));
  }

  if (arrivalTimes.length === 0) return buses;

  arrivalTimes.forEach((arrival, i) => {
    const busId = `${route.routeNumber}-${Date.now()}-${i}`;

    // walk + wait + ride = door-to-door total
    const totalJourneyTime = scheduleGen.calculateTotalJourneyTime(
      walkingTime,
      arrival.minutesFromNow,
      routeTravelTime
    );

    const busDepartureDate   = timeHelper.addMinutes(dubaiTime, arrival.minutesFromNow); // clock: bus departs stop
    const destinationArrival = timeHelper.addMinutes(busDepartureDate, routeTravelTime); // clock: arrives destination

    buses.push({
      busId,
      routeNumber: route.routeNumber,
      routeName: route.name || `Route ${route.routeNumber}`,
      routeType: route.type || 'bus',
      color: route.color || '#667eea',

      arrivalTime: arrival.minutesFromNow, // mins until bus departs (wait time)
      travelTime: routeTravelTime,          // mins riding the bus
      totalJourneyTime,                     // door-to-door: walk + wait + ride
      cost: route.fare?.nolFare || route.fare?.baseFare || 3,
      nolFare: route.fare?.nolFare || route.fare?.baseFare || 3,
      cashFare: route.fare?.cashFare || (route.fare?.baseFare || 3) + 1,
      walkingDistance,
      walkingTime,
      transfers: 0,

      departureTime: arrival.formatted,       // clock: bus leaves stop (12h)
      departureTime24: arrival.formatted24,   // clock: bus leaves stop (24h)
      destinationArrivalTime: timeHelper.formatTime(destinationArrival),    // clock: arrives destination (12h)
      destinationArrivalTime24: timeHelper.formatTime24(destinationArrival),// clock: arrives destination (24h)

      journeyType: 'direct',
      originStop: {
        stopId: originStop.stopId,
        name: originStop.name,
        position: originStop.position,
      },
      destinationStop: {
        stopId: destStop.stopId,
        name: destStop.name,
        position: destStop.position,
      },
      stops: route.stops || [],
      shapeId: route.shapeId || null,
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

  const buses = [];
  const frequency1 = scheduleGen.getServiceFrequency(schedule1, dubaiTime);
  const walkingDistance = calculateWalkingDistance(origin, originStop);
  const walkingTime  = scheduleGen.calculateWalkingTime(walkingDistance); // mins to walk to first stop
  const leg1Duration = route1.stats?.duration || 20;                     // full duration of route1
  const leg2Duration = route2.stats?.duration || 20;                     // full duration of route2
  const transferWaitTime = 5;                                             // mins waiting at transfer stop
  const minDeparture = walkingTime + 2;

  const allLeg1Arrivals = scheduleGen.generateArrivalTimes(frequency1, dubaiTime, 15);

  let leg1Arrivals = allLeg1Arrivals
    .filter((dep) => !isNaN(dep.minutesFromNow) && dep.minutesFromNow >= minDeparture)
    .slice(0, 3);

  if (leg1Arrivals.length === 0) {
    const forced = scheduleGen.generateArrivalTimes(frequency1, dubaiTime, 3, minDeparture);
    leg1Arrivals = forced.filter((dep) => !isNaN(dep.minutesFromNow));
  }

  if (leg1Arrivals.length === 0) return buses;

  const route1Stops = route1.stops || [];
  const route2Stops = route2.stops || [];

  // Where the transfer stop falls inside route1 (origin → transfer)
  const transferIndex = route1Stops.findIndex(s => s.stopId === transferStopId);

  // Where the transfer stop and destination fall inside route2 (transfer → destination)
  const transferIndexInRoute2 = route2Stops.findIndex(s => s.stopId === transferStopId);
  const destIndexInRoute2     = route2Stops.findIndex(s => s.stopId === destStop.stopId);

  // Fraction of route1 the user rides (start → transferStop)
  const leg1Ratio = transferIndex >= 0
    ? transferIndex / Math.max(route1Stops.length - 1, 1)
    : 0.5;

  // Fraction of route2 the user rides (transferStop → destination)
  // Uses route2's own stop positions 
  const leg2StartRatio = transferIndexInRoute2 >= 0
    ? transferIndexInRoute2 / Math.max(route2Stops.length - 1, 1)
    : 0;
  const leg2EndRatio = destIndexInRoute2 >= 0
    ? destIndexInRoute2 / Math.max(route2Stops.length - 1, 1)
    : 1;
  const leg2Ratio = Math.max(leg2EndRatio - leg2StartRatio, 0.1); // at least 10% of route2

  // Round to whole minutes — prevents 75.4571428... decimals in the UI
  const leg1RidingTime = Math.round(leg1Duration * leg1Ratio); // mins riding route1
  const leg2RidingTime = Math.round(leg2Duration * leg2Ratio); // mins riding route2
  const totalTime = leg1RidingTime + transferWaitTime + leg2RidingTime; // total riding (leg1 + wait + leg2)

  leg1Arrivals.forEach((leg1Arrival, i) => {
    if (isNaN(leg1Arrival.minutesFromNow)) return;

    const arrivalAtTransfer = leg1Arrival.minutesFromNow + walkingTime + leg1RidingTime; // mins until user reaches transfer stop
    const leg2DepartureMin  = Math.ceil(arrivalAtTransfer + transferWaitTime);           // mins until leg2 departs
    if (isNaN(leg2DepartureMin)) return;

    const leg2DepartureTime  = timeHelper.addMinutes(dubaiTime, leg2DepartureMin);       // clock: leg2 departs transfer stop
    const destinationArrival = timeHelper.addMinutes(leg2DepartureTime, leg2RidingTime); // clock: arrives destination

    const leg1Nol  = route1.fare?.nolFare || route1.fare?.baseFare || 3;
    const leg2Nol  = route2.fare?.nolFare || route2.fare?.baseFare || 3;
    const leg1Cash = route1.fare?.cashFare || leg1Nol + 1;
    const leg2Cash = route2.fare?.cashFare || leg2Nol + 1;

    const busId = `${route1.routeNumber}-${route2.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: `${route1.routeNumber} → ${route2.routeNumber}`,
      routeName: `${route1.name || route1.routeNumber} + ${route2.name || route2.routeNumber}`,
      routeType: 'transfer',
      color: route1.color || '#667eea',

      arrivalTime: leg1Arrival.minutesFromNow,                               // mins until leg1 bus departs (wait time)
      travelTime: totalTime,                                                  // mins riding only (leg1 + transferWait + leg2)
      totalJourneyTime: walkingTime + leg1Arrival.minutesFromNow + totalTime, // door-to-door: walk + wait + ride
      cost: leg1Nol + leg2Nol,
      nolFare: leg1Nol + leg2Nol,
      cashFare: leg1Cash + leg2Cash,
      walkingDistance,
      walkingTime,
      transfers: 1,

      departureTime: leg1Arrival.formatted,       // clock: leg1 departs stop (12h)
      departureTime24: leg1Arrival.formatted24,   // clock: leg1 departs stop (24h)
      leg1DepartureTime: leg1Arrival.formatted,
      leg1DepartureTime24: leg1Arrival.formatted24,
      leg2DepartureTime: timeHelper.formatTime(leg2DepartureTime),    // clock: leg2 departs transfer stop (12h)
      leg2DepartureTime24: timeHelper.formatTime24(leg2DepartureTime),// clock: leg2 departs transfer stop (24h)
      destinationArrivalTime: timeHelper.formatTime(destinationArrival),    // clock: arrives destination (12h)
      destinationArrivalTime24: timeHelper.formatTime24(destinationArrival),// clock: arrives destination (24h)

      journeyType: 'transfer',
      leg1: {
        routeNumber: route1.routeNumber,
        routeName: route1.name || `Route ${route1.routeNumber}`,
        duration: leg1RidingTime, // mins riding leg1
        cost: leg1Nol,
        nolFare: leg1Nol,
        cashFare: leg1Cash,
        departureTime: leg1Arrival.formatted,
      },
      leg2: {
        routeNumber: route2.routeNumber,
        routeName: route2.name || `Route ${route2.routeNumber}`,
        duration: leg2RidingTime, // mins riding leg2
        cost: leg2Nol,
        nolFare: leg2Nol,
        cashFare: leg2Cash,
        departureTime: timeHelper.formatTime(leg2DepartureTime),
      },
      transferStop: {
        stopId: transferStop.stopId,
        name: transferStop.name,
        position: transferStop.position,
      },
      originStop: {
        stopId: originStop.stopId,
        name: originStop.name,
        position: originStop.position,
      },
      destinationStop: {
        stopId: destStop.stopId,
        name: destStop.name,
        position: destStop.position,
      },
      shapeId: route1.shapeId || null,
      shapeIdReturn: route1.shapeIdReturn || null,
      shapeIdLeg2: route2.shapeId || null,
      shapeIdLeg2Return: route2.shapeIdReturn || null,
    });
  });

  return buses;
};

export const generateAllBuses = async (
  routeData,
  origin,
  destination,
  currentTime = null
) => {
  const allBuses = [];
  const dubaiTime = currentTime || timeHelper.getDubaiTime();

  if (routeData.transferRoutes.length > 0) {
    const transferStopIds = routeData.transferRoutes.map((t) => t.transferStopId);
    const transferStops   = await BusStop.find({ stopId: { $in: transferStopIds } });

    const transferStopMap = {};
    transferStops.forEach((s) => { transferStopMap[s.stopId] = s; });

    for (const transferInfo of routeData.transferRoutes) {
      const buses = await generateTransferBuses(
        transferInfo, origin, destination, dubaiTime, transferStopMap
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