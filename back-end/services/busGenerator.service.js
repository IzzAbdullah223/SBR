/**
 * BUS GENERATOR SERVICE
 * Generates buses for routes and calculates criteria
 */

import BusStop from '../models/BusStop.js';
import { calculateWalkingDistance } from './geoCalculator.service.js';

/**
 * Generate buses for a direct route
 * @param {Object} routeInfo - {route, originStop, destStop, type}
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Array} Array of bus objects with criteria
 */
export const generateDirectBuses = (routeInfo, origin, destination) => {
  const { route, originStop, destStop } = routeInfo;
  const buses = [];
  const frequency = route.schedule?.weekday?.frequency || 15;

  // Generate 5 buses
  for (let i = 0; i < 5; i++) {
    const baseArrival = i * frequency;
    const randomOffset = Math.floor(Math.random() * 3);
    const arrivalTime = baseArrival + randomOffset + 1;

    const walkingDistance = calculateWalkingDistance(origin, originStop);

    const busId = `${route.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: route.routeNumber,
      routeName: route.name,
      routeType: route.type,
      color: route.color || '#667eea',
      
      // Criteria for TOPSIS
      arrivalTime,
      travelTime: route.stats?.duration || 20,
      cost: route.fare?.baseFare || 3,
      walkingDistance,
      transfers: 0,
      
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
  }

  return buses;
};

/**
 * Generate buses for a transfer route
 * @param {Object} transferInfo - {route1, route2, originStop, transferStopId, destStop}
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Array>} Array of transfer bus combinations
 */
export const generateTransferBuses = async (transferInfo, origin, destination) => {
  const { route1, route2, originStop, transferStopId, destStop } = transferInfo;
  
  // Get transfer stop details
  const transferStop = await BusStop.findOne({ stopId: transferStopId });
  
  const buses = [];
  const frequency1 = route1.schedule?.weekday?.frequency || 15;
  const frequency2 = route2.schedule?.weekday?.frequency || 15;
  const transferWaitTime = 5; // Assume 5 min transfer time

  // Generate 3 combinations (less than direct to avoid clutter)
  for (let i = 0; i < 3; i++) {
    // First leg timing
    const leg1Arrival = i * frequency1 + 1;
    const leg1Duration = route1.stats?.duration || 20;
    const leg1ArrivalAtTransfer = leg1Arrival + (leg1Duration / 2); // Approx time to transfer point

    // Find matching second leg bus
    const leg2Departure = Math.ceil(leg1ArrivalAtTransfer + transferWaitTime);
    const leg2Duration = route2.stats?.duration || 20;

    const walkingDistance = calculateWalkingDistance(origin, originStop);
    const totalCost = (route1.fare?.baseFare || 3) + (route2.fare?.baseFare || 3);
    const totalTime = leg1Duration + transferWaitTime + leg2Duration;

    const busId = `${route1.routeNumber}-${route2.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: `${route1.routeNumber} → ${route2.routeNumber}`,
      routeName: `${route1.name} + ${route2.name}`,
      routeType: 'transfer',
      color: route1.color || '#667eea',
      
      // Criteria for TOPSIS
      arrivalTime: leg1Arrival,
      travelTime: totalTime,
      cost: totalCost,
      walkingDistance,
      transfers: 1,
      
      // Journey details
      journeyType: 'transfer',
      leg1: {
        routeNumber: route1.routeNumber,
        routeName: route1.name,
        duration: leg1Duration,
        cost: route1.fare?.baseFare || 3,
      },
      leg2: {
        routeNumber: route2.routeNumber,
        routeName: route2.name,
        duration: leg2Duration,
        cost: route2.fare?.baseFare || 3,
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
  }

  return buses;
};

/**
 * Generate all buses from route information
 * @param {Object} routeData - Output from routeFinder service
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Array>} All generated buses
 */
export const generateAllBuses = async (routeData, origin, destination) => {
  const allBuses = [];

  // Generate direct route buses
  for (const routeInfo of routeData.directRoutes) {
    const buses = generateDirectBuses(routeInfo, origin, destination);
    allBuses.push(...buses);
  }

  // Generate transfer route buses
  for (const transferInfo of routeData.transferRoutes) {
    const buses = await generateTransferBuses(transferInfo, origin, destination);
    allBuses.push(...buses);
  }

  return allBuses;
};