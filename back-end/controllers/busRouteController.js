import BusRoute from '../models/BusRoute.js';
import BusStop from '../models/BusStop.js';



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