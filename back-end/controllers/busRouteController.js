import BusRoute from '../models/BusRoute.js';
import BusStop from '../models/BusStop.js';

/**
 * BUS ROUTE CONTROLLER
 * Contains all business logic for bus route operations
 */

/**
 * Get all bus routes
 */
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await BusRoute.find().select('-__v');
    
    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching routes'
    });
  }
};

/**
 * Get single route by route number
 */
export const getRouteByNumber = async (req, res) => {
  try {
    const route = await BusRoute.findOne({ routeNumber: req.params.routeNumber });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Populate stop details
    const stopIds = route.stops.map(s => s.stopId);
    const stopDetails = await BusStop.find({ stopId: { $in: stopIds } });
    
    const routeWithStopDetails = {
      ...route.toObject(),
      stopDetails: route.stops.map(routeStop => {
        const stopInfo = stopDetails.find(s => s.stopId === routeStop.stopId);
        return {
          ...routeStop,
          ...stopInfo?.toObject()
        };
      })
    };
    
    res.json({
      success: true,
      data: routeWithStopDetails
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching route'
    });
  }
};

/**
 * Find routes between two stops
 */
export const findRouteBetweenStops = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both from and to stop IDs are required'
      });
    }

    // Find routes containing both stops
    const directRoutes = await BusRoute.find({
      'stops.stopId': { $all: [from, to] }
    });

    if (directRoutes.length > 0) {
      // Found direct route(s)
      const routesWithDetails = await Promise.all(
        directRoutes.map(async (route) => {
          const fromIndex = route.stops.findIndex(s => s.stopId === from);
          const toIndex = route.stops.findIndex(s => s.stopId === to);
          
          // Get only stops between from and to
          const relevantStops = route.stops.slice(
            Math.min(fromIndex, toIndex),
            Math.max(fromIndex, toIndex) + 1
          );

          // Get stop details
          const stopIds = relevantStops.map(s => s.stopId);
          const stopDetails = await BusStop.find({ stopId: { $in: stopIds } });

          const distance = calculateRouteDistance(relevantStops, stopDetails);
          const duration = relevantStops[relevantStops.length - 1].timeFromStart - 
                          relevantStops[0].timeFromStart;

          return {
            routeNumber: route.routeNumber,
            name: route.name,
            type: route.type,
            color: route.color,
            stops: relevantStops.map(rs => {
              const detail = stopDetails.find(sd => sd.stopId === rs.stopId);
              return {
                stopId: rs.stopId,
                name: detail?.name || 'Unknown',
                position: detail?.position,
                order: rs.order,
                timeFromStart: rs.timeFromStart
              };
            }),
            fare: route.fare.baseFare,
            distance: parseFloat(distance.toFixed(2)),
            duration: duration,
            schedule: route.schedule
          };
        })
      );

      return res.json({
        success: true,
        routeType: 'direct',
        count: routesWithDetails.length,
        data: routesWithDetails
      });
    }

    // No direct route found
    res.json({
      success: false,
      message: 'No direct route found between these stops',
      suggestion: 'Transfer routes will be available in future updates'
    });

  } catch (error) {
    console.error('Error finding route:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while finding route'
    });
  }
};

/**
 * Helper: Calculate distance using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper: Calculate total route distance
 */
function calculateRouteDistance(routeStops, stopDetails) {
  let totalDistance = 0;
  for (let i = 0; i < routeStops.length - 1; i++) {
    const stop1 = stopDetails.find(s => s.stopId === routeStops[i].stopId);
    const stop2 = stopDetails.find(s => s.stopId === routeStops[i + 1].stopId);
    
    if (stop1 && stop2) {
      totalDistance += calculateDistance(
        stop1.position.lat,
        stop1.position.lng,
        stop2.position.lat,
        stop2.position.lng
      );
    }
  }
  return totalDistance;
}