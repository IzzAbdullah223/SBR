import BusRoute from '../models/BusRoute.js';
import { findNearbyStops } from './geoCalculator.service.js';

export const findDirectRoutes = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const connectingRoutes = [];

  allRoutes.forEach(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    const originStop = originStops.find(stop => routeStopIds.includes(stop.stopId));
    const destStop = destStops.find(stop => routeStopIds.includes(stop.stopId));

    if (originStop && destStop) {
      // ✅ FIXED: removed direction check — both directions are valid
      // direction check (destIndex > originIndex) was rejecting valid routes
      // when user swapped origin and destination
      connectingRoutes.push({ route, originStop, destStop, type: 'direct' });
    }
  });

  return connectingRoutes;
};

export const findRoutesWithTransfer = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const transferRoutes = [];

  const routesFromOrigin = allRoutes.filter(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    return originStops.some(stop => routeStopIds.includes(stop.stopId));
  });

  const routesToDest = allRoutes.filter(route => {
    const routeStopIds = route.stops.map(s => s.stopId);
    return destStops.some(stop => routeStopIds.includes(stop.stopId));
  });

  routesFromOrigin.forEach(route1 => {
    routesToDest.forEach(route2 => {
      if (route1.routeNumber === route2.routeNumber) return;

      const route1StopIds = route1.stops.map(s => s.stopId);
      const route2StopIds = route2.stops.map(s => s.stopId);
      const commonStopIds = route1StopIds.filter(id => route2StopIds.includes(id));

      if (commonStopIds.length > 0) {
        const transferStopId = commonStopIds[0];
        const originStop = originStops.find(stop => route1StopIds.includes(stop.stopId));
        const destStop = destStops.find(stop => route2StopIds.includes(stop.stopId));

        if (originStop && destStop) {
          const route1OriginIdx = route1.stops.findIndex(s => s.stopId === originStop.stopId);
          const route1TransferIdx = route1.stops.findIndex(s => s.stopId === transferStopId);
          const route2TransferIdx = route2.stops.findIndex(s => s.stopId === transferStopId);
          const route2DestIdx = route2.stops.findIndex(s => s.stopId === destStop.stopId);

          // ✅ FIXED: removed direction check — both directions are valid
          transferRoutes.push({ route1, route2, originStop, transferStopId, destStop, type: 'transfer' });
        }
      }
    });
  });

  return transferRoutes;
};

export const findAllRoutes = async (origin, destination) => {
  // Find nearby stops separately so we can report which one failed
  const originStops = await findNearbyStops(origin.lat, origin.lng, 1.0);
  const destStops = await findNearbyStops(destination.lat, destination.lng, 1.0);

  // ✅ Return both arrays even on failure so topsisController can give specific errors
  if (originStops.length === 0 || destStops.length === 0) {
    return {
      success: false,
      message: 'No bus stops found near your locations.',
      originStops,   // ← pass actual arrays so controller knows which one is empty
      destStops,
      directRoutes: [],
      transferRoutes: [],
    };
  }

  const directRoutes = await findDirectRoutes(originStops, destStops);

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