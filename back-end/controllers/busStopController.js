import BusStop from '../models/BusStop.js';
import BusRoute from '../models/BusRoute.js';
import { calculateDistance } from '../services/geoCalculator.service.js';



/**
 * Get all bus stops
 */
export const getAllStops = async (req, res) => {
  try {
    const stops = await BusStop.find().select('-__v');
    
    res.json({
      success: true,
      count: stops.length,
      data: stops
    });
  } catch (error) {
    console.error('Error fetching stops:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stops'
    });
  }
};

/**
 * Get single stop by stopId
 */
export const getStopById = async (req, res) => {
  try {
    const stop = await BusStop.findOne({ stopId: req.params.stopId });
    
    if (!stop) {
      return res.status(404).json({
        success: false,
        error: 'Stop not found'
      });
    }

    // Find all routes that include this stop
    const routes = await BusRoute.find({ 'stops.stopId': req.params.stopId });
    
    const stopWithRoutes = {
      ...stop.toObject(),
      routes: routes.map(route => ({
        routeNumber: route.routeNumber,
        name: route.name,
        type: route.type,
        color: route.color,
        direction: route.stops.find(s => s.stopId === req.params.stopId)?.order
      }))
    };
    
    res.json({
      success: true,
      data: stopWithRoutes
    });
  } catch (error) {
    console.error('Error fetching stop:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stop'
    });
  }
};

/**
 * Find nearby stops based on coordinates
 */
export const findNearbyStops = async (req, res) => {
  try {
    const { lat, lng, radius = 1 } = req.query; // radius in km, default 1km
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Get all stops
    const allStops = await BusStop.find();
    
    // Calculate distance for each stop using service
    const stopsWithDistance = allStops.map(stop => {
      const distance = calculateDistance(
        latitude,
        longitude,
        stop.position.lat,
        stop.position.lng
      );
      
      return {
        ...stop.toObject(),
        distance: parseFloat(distance.toFixed(2))
      };
    });

    // Filter stops within radius and sort by distance
    const nearbyStops = stopsWithDistance
      .filter(stop => stop.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: nearbyStops.length,
      searchRadius: searchRadius,
      data: nearbyStops
    });
  } catch (error) {
    console.error('Error finding nearby stops:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while finding nearby stops'
    });
  }
};