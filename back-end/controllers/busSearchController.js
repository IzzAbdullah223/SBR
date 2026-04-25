import * as routeFinder from '../services/routeFinder.service.js';
import * as busGenerator from '../services/busGenerator.service.js';
import * as topsisService from '../services/topsis.service.js';
import { calculateDistance } from '../services/geoCalculator.service.js';
import { MODE_WEIGHTS, buildRepresentatives } from './topsisController.js';

export const findBuses = async (req, res) => {
  try {
    const { origin, destination, optimizationMode } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ success: false, errorCode: 'MISSING_FIELDS', message: 'Origin and destination are required.' });
    }

    const weights = MODE_WEIGHTS[optimizationMode] || MODE_WEIGHTS.fastest;

    if (!origin.lat || !origin.lng) {
      return res.status(400).json({ success: false, errorCode: 'INVALID_ORIGIN', message: 'Please select your origin from the dropdown suggestions.' });
    }

    if (!destination.lat || !destination.lng) {
      return res.status(400).json({ success: false, errorCode: 'INVALID_DESTINATION', message: 'Please select your destination from the dropdown suggestions.' });
    }

    const distKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    if (distKm < 0.05) {
      return res.status(400).json({ success: false, errorCode: 'SAME_LOCATION', message: 'Origin and destination are too close to each other.' });
    }

    const routeData = await routeFinder.findAllRoutes(origin, destination);

    if (routeData.originStops?.length === 0 && routeData.destStops?.length === 0) {
      return res.status(404).json({ success: false, errorCode: 'NO_STOPS_BOTH', message: 'No bus stops found near your origin or destination. Try selecting a location closer to a main road.' });
    }
    if (routeData.originStops?.length === 0) {
      return res.status(404).json({ success: false, errorCode: 'NO_ORIGIN_STOPS', message: 'No bus stops found near your origin. Try a nearby main road or landmark.' });
    }
    if (routeData.destStops?.length === 0) {
      return res.status(404).json({ success: false, errorCode: 'NO_DEST_STOPS', message: 'No bus stops found near your destination. Try a nearby main road or landmark.' });
    }
    if (!routeData.success) {
      return res.status(404).json({ success: false, errorCode: 'NO_STOPS', message: routeData.message || 'No bus stops found near your locations.' });
    }
    if (routeData.directRoutes.length === 0 && routeData.transferRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_ROUTES',
        message: 'Bus stops were found near both locations, but no routes connect them. Try locations along major roads like Sheikh Zayed Road or Al Wasl Road.',
        debug: { originStops: routeData.originStops.length, destStops: routeData.destStops.length },
      });
    }

    const allBuses = await busGenerator.generateAllBuses(routeData, origin, destination);

    if (allBuses.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'OUT_OF_SERVICE',
        message: 'Routes were found but no buses are currently running. Dubai RTA buses typically operate from 5:00 AM to 11:30 PM on weekdays.',
        debug: { directRoutes: routeData.directRoutes.length, transferRoutes: routeData.transferRoutes.length },
      });
    }

    const representatives = buildRepresentatives(allBuses);

    let rankedBuses;
    try {
      rankedBuses = topsisService.rankBuses(representatives, weights);
    } catch (topsisError) {
      console.error('TOPSIS ranking failed:', topsisError);
      rankedBuses = representatives.map((b) => ({ ...b, score: 0 }));
    }

    return res.status(200).json({
      success: true,
      count: rankedBuses.length,
      buses: rankedBuses,
      stats: {
        directRoutes: routeData.directRoutes.length,
        transferRoutes: routeData.transferRoutes.length,
        totalBuses: rankedBuses.length,
      },
    });
  } catch (error) {
    console.error('Error in findBuses:', error);
    return res.status(500).json({ success: false, errorCode: 'SERVER_ERROR', message: 'Something went wrong on our end. Please try again in a moment.', error: error.message });
  }
};