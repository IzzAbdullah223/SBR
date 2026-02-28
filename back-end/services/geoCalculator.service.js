/**
 * GEO CALCULATOR SERVICE
 * Handles all geographic calculations
 */

import BusStop from '../models/BusStop.js';

/**
 * Calculate distance between two points using Haversine formula
 */
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
    return nearbyStops;
  } catch (error) {
    // If $near fails (e.g. index not ready), fall back to in-memory filter
    console.warn('⚠️  $near query failed, falling back to in-memory filter:', error.message);
    const allStops = await BusStop.find({ status: 'active' });
    return allStops.filter(stop => {
      const distance = calculateDistance(lat, lng, stop.position.lat, stop.position.lng);
      return distance <= radiusKm;
    });
  }
};

/**
 * Calculate walking distance from user coordinates to a bus stop
 */
export const calculateWalkingDistance = (coords, busStop) => {
  const distance = calculateDistance(
    coords.lat,
    coords.lng,
    busStop.position.lat,
    busStop.position.lng
  );
  return Math.round(distance * 100) / 100;
};