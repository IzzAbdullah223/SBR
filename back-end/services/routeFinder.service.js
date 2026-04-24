import BusRoute from '../models/BusRoute.js';
import { findNearbyStops } from './geoCalculator.service.js';

export const findDirectRoutes = async (originStops, destStops) => {
  const nearbyStopIds = [
    ...originStops.map((s) => s.stopId),

    ...destStops.map((s) => s.stopId),
  ];
  const allRoutes = await BusRoute.find({
    'stops.stopId': { $in: nearbyStopIds }, //$in MongoDB operator meaning "where stopId is IN this array"
  });
  const connectingRoutes = [];

  const seen = new Set(); //a Set (like an array but with instant lookup, no duplicates).

  allRoutes.forEach((route) => {
    // skip if we already have this route number
    if (seen.has(route.routeNumber)) return; //Loop every route. If we already added this route number → skip immediately. return inside forEach acts like continue(or skip this iteration and take the next one) in a regular loop — skip to the next iteration.

    const routeStopIds = route.stops.map((s) => s.stopId);

    // get ALL origin stops that this route serves, then pick the closest one

    const matchingOriginStops = originStops.filter((s) =>
      routeStopIds.includes(s.stopId)
    );
    const matchingDestStops = destStops.filter((s) =>
      routeStopIds.includes(s.stopId)
    );

    if (matchingOriginStops.length === 0 || matchingDestStops.length === 0)
      return;

    // sort by distance (attached by geoCalculator.findNearbyStops) and take closest
    const originStop = matchingOriginStops.sort(
      (a, b) => a.distance - b.distance
    )[0];
    const destStop = matchingDestStops.sort(
      (a, b) => a.distance - b.distance
    )[0];

    connectingRoutes.push({ route, originStop, destStop, type: 'direct' });
    seen.add(route.routeNumber);
  });

  return connectingRoutes;
};

export const findRoutesWithTransfer = async (originStops, destStops) => {
  const originStopIds = originStops.map((s) => s.stopId);
  const destStopIds = destStops.map((s) => s.stopId);

  const [routesFromOrigin, routesToDest] = await Promise.all([
    BusRoute.find({ 'stops.stopId': { $in: originStopIds } }),
    BusRoute.find({ 'stops.stopId': { $in: destStopIds } }),
  ]);

  const transferRoutes = [];

  const seen = new Set();

  routesFromOrigin.forEach((route1) => {
    routesToDest.forEach((route2) => {
      if (route1.routeNumber === route2.routeNumber) return;

      // skip if we already have this exact route1+route2 combination
      const pairKey = `${route1.routeNumber}→${route2.routeNumber}`;
      if (seen.has(pairKey)) return;

      const route1StopIds = route1.stops.map((s) => s.stopId);
      const route2StopIds = route2.stops.map((s) => s.stopId);
      const commonStopIds = route1StopIds.filter((id) =>
        route2StopIds.includes(id)
      );

      if (commonStopIds.length === 0) return;

      // pick closest matching origin stop for route1
      const matchingOriginStops = originStops.filter((s) =>
        route1StopIds.includes(s.stopId)
      );
      const originStop = matchingOriginStops.sort(
        (a, b) => a.distance - b.distance
      )[0];

      // pick closest matching dest stop for route2
      const matchingDestStops = destStops.filter((s) =>
        route2StopIds.includes(s.stopId)
      );
      const destStop = matchingDestStops.sort(
        (a, b) => a.distance - b.distance
      )[0];

      if (!originStop || !destStop) return;

      const originPos = originStop.position;
      const destPos = destStop.position;

      const sq = (a, b) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;

      // get the actual stop objects for common stops so we have positions
      const commonStops = route1.stops.filter((s) =>
        commonStopIds.includes(s.stopId)
      );

      let bestTransferStopId = commonStopIds[0];
      let bestScore = Infinity;

      commonStops.forEach((stop) => {
        if (!stop.position) return;
        const score = sq(originPos, stop.position) + sq(stop.position, destPos);
        if (score < bestScore) {
          bestScore = score;
          bestTransferStopId = stop.stopId;
        }
      });

      transferRoutes.push({
        route1,
        route2,
        originStop,
        transferStopId: bestTransferStopId,
        destStop,
        type: 'transfer',
      });
      seen.add(pairKey);
    });
  });

  return transferRoutes;
};

export const findAllRoutes = async (origin, destination) => {
  // Find nearby stops separately so we can report which one failed
  const [originStops, destStops] = await Promise.all([
    // run in parallel
    findNearbyStops(origin.lat, origin.lng, 1.0),
    findNearbyStops(destination.lat, destination.lng, 1.0),
  ]);

  //  Return both arrays even on failure so topsisController can give specific errors
  if (originStops.length === 0 || destStops.length === 0) {
    return {
      success: false,
      message: 'No bus stops found near your locations.',
      originStops, // ← pass actual arrays so controller knows which one is empty
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
