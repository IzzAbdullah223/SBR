import BusStop from '../models/BusStop.js';

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearbyStops = async (lat, lng, radiusKm = 1.0) => {
  try {
    const nearbyStops = await BusStop.findNearby(lat, lng, radiusKm);

    return nearbyStops.map(stop => ({
      ...stop.toObject(),
      distance: calculateDistance(lat, lng, stop.position.lat, stop.position.lng),
    }));

  } catch (error) {
    console.warn('$near query failed, falling back to in-memory filter:', error.message);
    const allStops = await BusStop.find({ status: 'active' });

    const results = [];
    for (const stop of allStops) {
      const distance = calculateDistance(lat, lng, stop.position.lat, stop.position.lng);
      if (distance <= radiusKm) {
        results.push({ ...stop.toObject(), distance });
      }
    }
    return results;
  }
};

export const calculateWalkingDistance = (coords, busStop) => {
  const distance = calculateDistance(
    coords.lat,
    coords.lng,
    busStop.position.lat,
    busStop.position.lng
  );
  return Math.round(distance * 100) / 100;
};