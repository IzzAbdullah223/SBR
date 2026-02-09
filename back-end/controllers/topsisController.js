/**
 * TOPSIS CONTROLLER
 * Handles bus finding and MCDM ranking
 */

import BusStop from '../models/BusStop.js';
import BusRoute from '../models/BusRoute.js';

/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

/**
 * Find nearby bus stops within radius
 */
const findNearbyStops = async (lat, lng, radiusKm = 0.5) => {
  const allStops = await BusStop.find();
  
  const nearbyStops = allStops.filter(stop => {
    const distance = calculateDistance(lat, lng, stop.position.lat, stop.position.lng);
    return distance <= radiusKm;
  });

  return nearbyStops;
};

/**
 * Generate buses for a route based on frequency
 */
const generateBusesForRoute = (route, currentTime, originStop, destinationStop, originCoords, destCoords) => {
  const buses = [];
  const frequency = route.schedule?.weekday?.frequency || 15; // Default 15 min
  
  // Generate next 5 buses
  for (let i = 0; i < 5; i++) {
    const baseArrival = i * frequency;
    const randomOffset = Math.floor(Math.random() * 3); // 0-2 min random
    const arrivalTime = baseArrival + randomOffset + 1; // At least 1 minute
    
    // Calculate walking distance to origin stop
    const walkingDistance = calculateDistance(
      originCoords.lat,
      originCoords.lng,
      originStop.position.lat,
      originStop.position.lng
    );

    // Generate unique bus ID
    const busId = `${route.routeNumber}-${Date.now()}-${i}`;

    buses.push({
      busId,
      routeNumber: route.routeNumber,
      routeName: route.name,
      routeType: route.type,
      color: route.color,
      arrivalTime, // Minutes until bus arrives
      travelTime: route.stats?.duration || 20, // Journey duration
      cost: route.fare?.baseFare || 3, // Fare
      walkingDistance: Math.round(walkingDistance * 100) / 100, // Round to 2 decimals
      transfers: 0, // Direct route (for now)
      originStop: {
        stopId: originStop.stopId,
        name: originStop.name,
        position: originStop.position,
      },
      destinationStop: {
        stopId: destinationStop.stopId,
        name: destinationStop.name,
        position: destinationStop.position,
      },
      stops: route.stops || [],
    });
  }

  return buses;
};

/**
 * TOPSIS Algorithm Implementation
 */
const runTOPSIS = (buses, weights) => {
  if (buses.length === 0) return [];

  // Normalize weights to sum to 1
  const totalWeight = weights.time + weights.cost + weights.walkingDistance + weights.transfers;
  const normalizedWeights = {
    arrivalTime: weights.time / totalWeight,
    travelTime: weights.time / totalWeight,
    cost: weights.cost / totalWeight,
    walkingDistance: weights.walkingDistance / totalWeight,
    transfers: weights.transfers / totalWeight,
  };

  // Step 1: Create decision matrix
  const criteria = ['arrivalTime', 'travelTime', 'cost', 'walkingDistance', 'transfers'];
  
  // Step 2: Normalize the matrix
  const normalizedMatrix = criteria.map(criterion => {
    const values = buses.map(bus => bus[criterion]);
    const sumOfSquares = values.reduce((sum, val) => sum + val * val, 0);
    const denominator = Math.sqrt(sumOfSquares);
    return values.map(val => val / denominator);
  });

  // Step 3: Apply weights
  const weightedMatrix = criteria.map((criterion, idx) => {
    return normalizedMatrix[idx].map(val => val * normalizedWeights[criterion]);
  });

  // Step 4: Find ideal and negative-ideal solutions
  // All criteria are cost criteria (lower is better)
  const idealSolution = criteria.map((_, idx) => Math.min(...weightedMatrix[idx]));
  const negativeIdealSolution = criteria.map((_, idx) => Math.max(...weightedMatrix[idx]));

  // Step 5: Calculate distances
  const distances = buses.map((_, busIdx) => {
    let distanceToIdeal = 0;
    let distanceToNegative = 0;

    criteria.forEach((_, criterionIdx) => {
      const value = weightedMatrix[criterionIdx][busIdx];
      distanceToIdeal += Math.pow(value - idealSolution[criterionIdx], 2);
      distanceToNegative += Math.pow(value - negativeIdealSolution[criterionIdx], 2);
    });

    return {
      distanceToIdeal: Math.sqrt(distanceToIdeal),
      distanceToNegative: Math.sqrt(distanceToNegative),
    };
  });

  // Step 6: Calculate TOPSIS score
  const busesWithScores = buses.map((bus, idx) => {
    const score = distances[idx].distanceToNegative / 
                  (distances[idx].distanceToIdeal + distances[idx].distanceToNegative);
    
    return {
      ...bus,
      score: Math.round(score * 100) / 100, // Round to 2 decimals
    };
  });

  // Step 7: Sort by score (highest first)
  busesWithScores.sort((a, b) => b.score - a.score);

  return busesWithScores;
};

/**
 * Main function: Find and rank buses
 */
export const findBuses = async (req, res) => {
  try {
    const { origin, destination, weights } = req.body;

    // Validate input
    if (!origin || !destination || !weights) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: origin, destination, weights',
      });
    }

    console.log('Finding buses from:', origin, 'to:', destination);

    // Find nearby stops for origin and destination
    const originStops = await findNearbyStops(origin.lat, origin.lng, 1.0);
    const destinationStops = await findNearbyStops(destination.lat, destination.lng, 1.0);

    console.log(`Found ${originStops.length} stops near origin`);
    console.log(`Found ${destinationStops.length} stops near destination`);

    if (originStops.length === 0 || destinationStops.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No bus stops found near your origin or destination. Try a different location.',
      });
    }

    // Find routes that connect origin and destination stops
    const allRoutes = await BusRoute.find();
    const connectingRoutes = [];

    allRoutes.forEach(route => {
      const routeStopIds = route.stops.map(s => s.stopId);
      
      // Check if route has stops near both origin and destination
      const hasOriginStop = originStops.some(stop => routeStopIds.includes(stop.stopId));
      const hasDestStop = destinationStops.some(stop => routeStopIds.includes(stop.stopId));

      if (hasOriginStop && hasDestStop) {
        // Find which specific stops to use
        const originStop = originStops.find(stop => routeStopIds.includes(stop.stopId));
        const destStop = destinationStops.find(stop => routeStopIds.includes(stop.stopId));
        
        connectingRoutes.push({
          route,
          originStop,
          destStop,
        });
      }
    });

    console.log(`Found ${connectingRoutes.length} connecting routes`);

    if (connectingRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No direct bus routes found between these locations. Try different stops or consider transfers.',
      });
    }

    // Generate buses for each connecting route
    const allBuses = [];
    const currentTime = new Date();

    connectingRoutes.forEach(({ route, originStop, destStop }) => {
      const buses = generateBusesForRoute(route, currentTime, originStop, destStop, origin, destination);
      allBuses.push(...buses);
    });

    console.log(`Generated ${allBuses.length} total buses`);

    // Run TOPSIS algorithm
    const rankedBuses = runTOPSIS(allBuses, weights);

    console.log(`Ranked ${rankedBuses.length} buses using TOPSIS`);

    return res.status(200).json({
      success: true,
      count: rankedBuses.length,
      buses: rankedBuses,
    });

  } catch (error) {
    console.error('Error in findBuses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while finding buses',
      error: error.message,
    });
  }
};