/**
 * GEO CALCULATOR SERVICE
 * Handles all geographic calculations
 */

import BusStop from '../models/BusStop.js';

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find bus stops within a given radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>} Array of nearby bus stops
 */
export const findNearbyStops = async (lat, lng, radiusKm = 1.0) => {
  const allStops = await BusStop.find();
  
  const nearbyStops = allStops.filter(stop => {
    const distance = calculateDistance(lat, lng, stop.position.lat, stop.position.lng);
    return distance <= radiusKm;
  });

  return nearbyStops;
};

/**
 * Calculate walking distance from coordinates to a bus stop
 * @param {Object} coords - {lat, lng}
 * @param {Object} busStop - Bus stop object
 * @returns {number} Distance in kilometers (rounded to 2 decimals)
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