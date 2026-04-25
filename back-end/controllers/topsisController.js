import * as routeFinder from '../services/routeFinder.service.js';
import * as busGenerator from '../services/busGenerator.service.js';
import * as topsisService from '../services/topsis.service.js';
import { calculateDistance } from '../services/geoCalculator.service.js';

const MODE_WEIGHTS = {
  fastest:          { totalJourneyTime: 0.70, cost: 0.15, walkingDistance: 0.05, transfers: 0.10 },
  cheapest:         { totalJourneyTime: 0.15, cost: 0.65, walkingDistance: 0.10, transfers: 0.10 },
  less_walking:     { totalJourneyTime: 0.15, cost: 0.10, walkingDistance: 0.65, transfers: 0.10 },
  fewest_transfers: { totalJourneyTime: 0.20, cost: 0.15, walkingDistance: 0.10, transfers: 0.55 },
};
 
const REQUIRED_CRITERIA = ['totalJourneyTime', 'cost', 'walkingDistance', 'transfers'];

export const findBuses = async (req, res) => {
  try {
    const { origin, destination, optimizationMode } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: 'Origin and destination are required.',
      });
    }

    const weights = MODE_WEIGHTS[optimizationMode] || MODE_WEIGHTS.fastest;

    if (!origin.lat || !origin.lng) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_ORIGIN',
        message: 'Please select your origin from the dropdown suggestions.',
      });
    }

    if (!destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_DESTINATION',
        message: 'Please select your destination from the dropdown suggestions.',
      });
    }

    const distKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    if (distKm < 0.05) {
      return res.status(400).json({
        success: false,
        errorCode: 'SAME_LOCATION',
        message: 'Origin and destination are too close to each other.',
      });
    }

    const routeData = await routeFinder.findAllRoutes(origin, destination);

    if (routeData.originStops?.length === 0 && routeData.destStops?.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_STOPS_BOTH',
        message: 'No bus stops found near your origin or destination. Try selecting a location closer to a main road.',
      });
    }

    if (routeData.originStops?.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_ORIGIN_STOPS',
        message: 'No bus stops found near your origin. Try a nearby main road or landmark.',
      });
    }

    if (routeData.destStops?.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_DEST_STOPS',
        message: 'No bus stops found near your destination. Try a nearby main road or landmark.',
      });
    }

    if (!routeData.success) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_STOPS',
        message: routeData.message || 'No bus stops found near your locations.',
      });
    }

    if (routeData.directRoutes.length === 0 && routeData.transferRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_ROUTES',
        message: 'Bus stops were found near both locations, but no routes connect them. Try locations along major roads like Sheikh Zayed Road or Al Wasl Road.',
        debug: {
          originStops: routeData.originStops.length,
          destStops: routeData.destStops.length,
        },
      });
    }

    const allBuses = await busGenerator.generateAllBuses(routeData, origin, destination);

    if (allBuses.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'OUT_OF_SERVICE',
        message: 'Routes were found but no buses are currently running. Dubai RTA buses typically operate from 5:00 AM to 11:30 PM on weekdays.',
        debug: {
          directRoutes: routeData.directRoutes.length,
          transferRoutes: routeData.transferRoutes.length,
        },
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
    return res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: 'Something went wrong on our end. Please try again in a moment.',
      error: error.message,
    });
  }
};

// POST /api/find-buses/rank
// Receives already-generated buses from the frontend and re-ranks them
// with a different optimization mode. No DB calls — pure TOPSIS math.
export const rankBuses = (req, res) => {
  try {
    const { buses, optimizationMode } = req.body;

    if (!Array.isArray(buses) || buses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'buses must be a non-empty array.',
      });
    }

    const invalid = buses.some(b =>
      REQUIRED_CRITERIA.some(c => b[c] == null || isNaN(b[c]))
    );
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: 'Each bus must have arrivalTime, travelTime, cost, walkingDistance and transfers.',
      });
    }

    const weights = MODE_WEIGHTS[optimizationMode] || MODE_WEIGHTS.fastest;
    const ranked  = topsisService.rankBuses(buses, weights);

    return res.status(200).json({
      success: true,
      count: ranked.length,
      buses: ranked,
    });
  } catch (error) {
    console.error('Error in rankBuses:', error);
    return res.status(500).json({
      success: false,
      message: 'Ranking failed. Please try again.',
    });
  }
};

// Picks one representative per route (earliest departure) and attaches
// all upcoming departures to it for the frontend schedule display.
const buildRepresentatives = (allBuses) => {
  const busGroups = {};
  allBuses.forEach((bus) => {
    if (!busGroups[bus.routeNumber]) busGroups[bus.routeNumber] = [];
    busGroups[bus.routeNumber].push(bus);
  });

  return Object.values(busGroups).map((group) => {
    const sorted = group.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const rep = sorted[0];
    rep.upcomingDepartures = sorted.map((b) => ({
      departureTime:   b.departureTime,
      departureTime24: b.departureTime24,
      minutesFromNow:  b.arrivalTime,
    }));
    return rep;
  });
};