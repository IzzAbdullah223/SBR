
import BusStop from '../models/BusStop.js';
import { calculateWalkingDistance } from './geoCalculator.service.js';
import * as timeHelper from './timeHelper.service.js';
import * as scheduleGen from './scheduleGenerator.service.js';


const DEFAULT_SCHEDULE = {
  weekday: {
    firstBus: '05:00',
    lastBus: '23:30',
    frequency: 15  // 15 minutes between buses
  },
  weekend: {
    firstBus: '06:00',
    lastBus: '23:00',
    frequency: 20  // 20 minutes between buses
  }
};

/**
 * Get route schedule (use default if not available)
 */
const getRouteSchedule = (route) => {
  return route.schedule || DEFAULT_SCHEDULE;
};

/**
 * Generate buses for a direct route
 */
export const generateDirectBuses = (routeInfo, origin, destination, currentTime = null) => {
  const { route, originStop, destStop } = routeInfo;
  const buses = [];
  
  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  
  // Get schedule (use default if route doesn't have one)
  const schedule = getRouteSchedule(route);
  
  // Check if route is currently operating
  if (!timeHelper.isWithinServiceHours(schedule, dubaiTime)) {
    console.log(`⏰ Route ${route.routeNumber} is not currently in service`);
    return buses;
  }
  
  // Get frequency for current time
  const frequency = scheduleGen.getServiceFrequency(schedule, dubaiTime);
  
  // Generate arrival times
  const arrivalTimes = scheduleGen.generateArrivalTimes(frequency, dubaiTime, 5);
  
  // Calculate walking distance and time
  const walkingDistance = calculateWalkingDistance(origin, originStop);
  const walkingTime = scheduleGen.calculateWalkingTime(walkingDistance);
  
  // Get route travel time (use default if not available)
  const routeTravelTime = route.stats?.duration || 20;
  
  // Generate bus objects
  arrivalTimes.forEach((arrival, i) => {
    const busId = `${route.routeNumber}-${Date.now()}-${i}`;
    
    // Calculate total journey time
    const totalJourneyTime = scheduleGen.calculateTotalJourneyTime(
      walkingTime,
      arrival.minutesFromNow,
      routeTravelTime
    );
    
    buses.push({
      busId,
      routeNumber: route.routeNumber,
      routeName: route.name || `Route ${route.routeNumber}`,
      routeType: route.type || 'bus',
      color: route.color || '#667eea',
      
      // Criteria for TOPSIS (all in minutes)
      arrivalTime: arrival.minutesFromNow,
      travelTime: routeTravelTime,
      cost: route.fare?.baseFare || 3,
      walkingDistance,
      walkingTime,
      transfers: 0,
      
      // Time details for display
      departureTime: arrival.formatted,
      departureTime24: arrival.formatted24,
      totalJourneyTime,
      
      // Journey details
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
    });
  });

  return buses;
};

/**
 * Generate buses for a transfer route
 */
export const generateTransferBuses = async (transferInfo, origin, destination, currentTime = null) => {
  const { route1, route2, originStop, transferStopId, destStop } = transferInfo;
  
  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  
  // Get schedules (use default if not available)
  const schedule1 = getRouteSchedule(route1);
  const schedule2 = getRouteSchedule(route2);
  
  // Check if both routes are operating
  const route1Operating = timeHelper.isWithinServiceHours(schedule1, dubaiTime);
  const route2Operating = timeHelper.isWithinServiceHours(schedule2, dubaiTime);
  
  if (!route1Operating || !route2Operating) {
    console.log(`⏰ Transfer route not available (Route ${route1.routeNumber} or ${route2.routeNumber} not in service)`);
    return [];
  }
  
  // Get transfer stop details
  const transferStop = await BusStop.findOne({ stopId: transferStopId });
  if (!transferStop) {
    console.log(`❌ Transfer stop ${transferStopId} not found`);
    return [];
  }
  
  const buses = [];
  
  // Get frequencies
  const frequency1 = scheduleGen.getServiceFrequency(schedule1, dubaiTime);
  
  // Calculate walking distance and time
  const walkingDistance = calculateWalkingDistance(origin, originStop);
  const walkingTime = scheduleGen.calculateWalkingTime(walkingDistance);
  
  // Get route durations
  const leg1Duration = route1.stats?.duration || 20;
  const leg2Duration = route2.stats?.duration || 20;
  const transferWaitTime = 5;
  
  // Generate first leg arrivals
  const leg1Arrivals = scheduleGen.generateArrivalTimes(frequency1, dubaiTime, 3);
  
  // Generate combinations
  leg1Arrivals.forEach((leg1Arrival, i) => {
    const arrivalAtTransfer = scheduleGen.estimateTransferStopArrival(
      leg1Arrival.minutesFromNow,
      walkingTime,
      leg1Duration
    );
    
    const leg2DepartureMin = Math.ceil(arrivalAtTransfer + transferWaitTime);
    const leg2DepartureTime = timeHelper.addMinutes(dubaiTime, leg2DepartureMin);
    
    const totalTime = scheduleGen.calculateTransferTime(leg1Duration, transferWaitTime, leg2Duration);
    const totalCost = (route1.fare?.baseFare || 3) + (route2.fare?.baseFare || 3);
    
    const busId = `${route1.routeNumber}-${route2.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: `${route1.routeNumber} → ${route2.routeNumber}`,
      routeName: `${route1.name || route1.routeNumber} + ${route2.name || route2.routeNumber}`,
      routeType: 'transfer',
      color: route1.color || '#667eea',
      
      // Criteria for TOPSIS
      arrivalTime: leg1Arrival.minutesFromNow,
      travelTime: totalTime,
      cost: totalCost,
      walkingDistance,
      walkingTime,
      transfers: 1,
      
      // Time details
      leg1DepartureTime: leg1Arrival.formatted,
      leg1DepartureTime24: leg1Arrival.formatted24,
      leg2DepartureTime: timeHelper.formatTime(leg2DepartureTime),
      leg2DepartureTime24: timeHelper.formatTime24(leg2DepartureTime),
      
      // Journey details
      journeyType: 'transfer',
      leg1: {
        routeNumber: route1.routeNumber,
        routeName: route1.name || `Route ${route1.routeNumber}`,
        duration: leg1Duration,
        cost: route1.fare?.baseFare || 3,
        departureTime: leg1Arrival.formatted,
      },
      leg2: {
        routeNumber: route2.routeNumber,
        routeName: route2.name || `Route ${route2.routeNumber}`,
        duration: leg2Duration,
        cost: route2.fare?.baseFare || 3,
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
    });
  });

  return buses;
};

/**
 * Generate all buses from route information
 */
export const generateAllBuses = async (routeData, origin, destination, currentTime = null) => {
  const allBuses = [];
  const dubaiTime = currentTime || timeHelper.getDubaiTime();
  
  console.log(`🕐 Generating buses for Dubai time: ${timeHelper.formatTime(dubaiTime)}`);

  // Generate direct route buses
  for (const routeInfo of routeData.directRoutes) {
    const buses = generateDirectBuses(routeInfo, origin, destination, dubaiTime);
    allBuses.push(...buses);
  }

  // Generate transfer route buses
  for (const transferInfo of routeData.transferRoutes) {
    const buses = await generateTransferBuses(transferInfo, origin, destination, dubaiTime);
    allBuses.push(...buses);
  }

  console.log(`🚌 Generated ${allBuses.length} total buses`);

  return allBuses;
};