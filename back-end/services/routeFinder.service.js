/**
 * ROUTE FINDER SERVICE
 * Finds direct routes and routes with transfers
 */

import BusRoute from '../models/BusRoute.js';
import { findNearbyStops } from './geoCalculator.service.js';

/**
 * Find routes that directly connect origin and destination stops
 * @param {Array} originStops - Bus stops near origin
 * @param {Array} destStops - Bus stops near destination
 * @returns {Promise<Array>} Array of connecting routes with stop info
 */
export const findDirectRoutes = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const connectingRoutes = [];

  allRoutes.forEach(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    
    // Check if route has stops near both origin and destination
    const originStop = originStops.find(stop => routeStopIds.includes(stop.stopId));
    const destStop = destStops.find(stop => routeStopIds.includes(stop.stopId));

    if (originStop && destStop) {
      // Check that destination comes after origin on the route
      const originIndex = route.stops.findIndex(s => s.stopId === originStop.stopId);
      const destIndex = route.stops.findIndex(s => s.stopId === destStop.stopId);
      
      if (destIndex > originIndex) {
        connectingRoutes.push({
          route,
          originStop,
          destStop,
          type: 'direct',
        });
      }
    }
  });

  return connectingRoutes;
};

/**
 * Find routes with one transfer
 * @param {Array} originStops - Bus stops near origin
 * @param {Array} destStops - Bus stops near destination
 * @returns {Promise<Array>} Array of transfer routes
 */
export const findRoutesWithTransfer = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const transferRoutes = [];

  // Find routes from origin
  const routesFromOrigin = allRoutes.filter(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    return originStops.some(stop => routeStopIds.includes(stop.stopId));
  });

  // Find routes to destination
  const routesToDest = allRoutes.filter(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    return destStops.some(stop => routeStopIds.includes(stop.stopId));
  });

  // Find transfer points (common stops between routes)
  routesFromOrigin.forEach(route1 => {
    routesToDest.forEach(route2 => {
      // Skip if same route
      if (route1.routeNumber === route2.routeNumber) return;

      const route1StopIds = route1.stops.map(s => s.stopId);
      const route2StopIds = route2.stops.map(s => s.stopId);

      // Find common stops (potential transfer points)
      const commonStopIds = route1StopIds.filter(id => route2StopIds.includes(id));

      if (commonStopIds.length > 0) {
        // Use first common stop as transfer point
        const transferStopId = commonStopIds[0];
        
        // Find the actual stop objects
        const originStop = originStops.find(stop => route1StopIds.includes(stop.stopId));
        const destStop = destStops.find(stop => route2StopIds.includes(stop.stopId));
        
        if (originStop && destStop) {
          // Verify order: origin → transfer → destination
          const route1OriginIdx = route1.stops.findIndex(s => s.stopId === originStop.stopId);
          const route1TransferIdx = route1.stops.findIndex(s => s.stopId === transferStopId);
          const route2TransferIdx = route2.stops.findIndex(s => s.stopId === transferStopId);
          const route2DestIdx = route2.stops.findIndex(s => s.stopId === destStop.stopId);

          if (route1TransferIdx > route1OriginIdx && route2DestIdx > route2TransferIdx) {
            transferRoutes.push({
              route1,
              route2,
              originStop,
              transferStopId,
              destStop,
              type: 'transfer',
            });
          }
        }
      }
    });
  });

  return transferRoutes;
};

/**
 * Main function: Find all possible routes (direct + transfer)
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Object>} {directRoutes, transferRoutes, originStops, destStops}
 */
export const findAllRoutes = async (origin, destination) => {
  // Find nearby stops
  const originStops = await findNearbyStops(origin.lat, origin.lng, 1.0);
  const destStops = await findNearbyStops(destination.lat, destination.lng, 1.0);

  // Check if stops found
  if (originStops.length === 0 || destStops.length === 0) {
    return {
      success: false,
      message: 'No bus stops found near your origin or destination',
      originStops: [],
      destStops: [],
      directRoutes: [],
      transferRoutes: [],
    };
  }

  // Find direct routes first
  const directRoutes = await findDirectRoutes(originStops, destStops);

  // If no direct routes, find transfer routes
  let transferRoutes = [];
  if (directRoutes.length === 0) {
    transferRoutes = await findRoutesWithTransfer(originStops, destStops);
  }

  return {
    success: true,
    originStops,
    destStops,
    directRoutes,
    transferRoutes,
  };
};