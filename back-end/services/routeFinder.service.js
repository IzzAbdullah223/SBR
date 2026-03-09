import BusRoute from '../models/BusRoute.js';
import { findNearbyStops } from './geoCalculator.service.js';

export const findDirectRoutes = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const connectingRoutes = [];

  // seen tracks routeNumbers we already added — prevents the same route
  // appearing multiple times when several nearby stops all match the same route
  const seen = new Set();

  allRoutes.forEach(route => {
    // skip if we already have this route number
    if (seen.has(route.routeNumber)) return;

    const routeStopIds = route.stops.map(s => s.stopId);

    // get ALL origin stops that this route serves, then pick the closest one
    // to the user — instead of just taking the first match which is arbitrary
    const matchingOriginStops = originStops.filter(s => routeStopIds.includes(s.stopId));
    const matchingDestStops = destStops.filter(s => routeStopIds.includes(s.stopId));

    if (matchingOriginStops.length === 0 || matchingDestStops.length === 0) return;

    // sort by distance (attached by geoCalculator.findNearbyStops) and take closest
    const originStop = matchingOriginStops.sort((a, b) => a.distance - b.distance)[0];
    const destStop = matchingDestStops.sort((a, b) => a.distance - b.distance)[0];

    // ✅ FIXED: removed direction check — both directions are valid
    // direction check (destIndex > originIndex) was rejecting valid routes
    // when user swapped origin and destination
    connectingRoutes.push({ route, originStop, destStop, type: 'direct' });
    seen.add(route.routeNumber);
  });

  return connectingRoutes;
};

export const findRoutesWithTransfer = async (originStops, destStops) => {
  const allRoutes = await BusRoute.find();
  const transferRoutes = [];

  // seen tracks route1+route2 pairs we already added — prevents the same
  // transfer combination appearing multiple times when:
  // - multiple nearby stops match route1
  // - route1 and route2 share multiple common stops
  const seen = new Set();

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

      // skip if we already have this exact route1+route2 combination
      const pairKey = `${route1.routeNumber}→${route2.routeNumber}`;
      if (seen.has(pairKey)) return;

      const route1StopIds = route1.stops.map(s => s.stopId);
      const route2StopIds = route2.stops.map(s => s.stopId);
      const commonStopIds = route1StopIds.filter(id => route2StopIds.includes(id));

      if (commonStopIds.length === 0) return;

      const transferStopId = commonStopIds[0];

      // pick closest matching origin stop for route1
      const matchingOriginStops = originStops.filter(s => route1StopIds.includes(s.stopId));
      const originStop = matchingOriginStops.sort((a, b) => a.distance - b.distance)[0];

      // pick closest matching dest stop for route2
      const matchingDestStops = destStops.filter(s => route2StopIds.includes(s.stopId));
      const destStop = matchingDestStops.sort((a, b) => a.distance - b.distance)[0];

      if (originStop && destStop) {
        transferRoutes.push({ route1, route2, originStop, transferStopId, destStop, type: 'transfer' });
        seen.add(pairKey);
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