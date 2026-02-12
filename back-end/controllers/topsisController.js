
import * as routeFinder from '../services/routeFinder.service.js';
import * as busGenerator from '../services/busGenerator.service.js';
import * as topsisService from '../services/topsis.service.js';

/**
 * Find and rank buses using TOPSIS algorithm
 * @route POST /api/find-buses
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

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided',
      });
    }

    console.log('🔍 Finding buses from:', origin, 'to:', destination);

    // Step 1: Find all possible routes (direct + transfer)
    const routeData = await routeFinder.findAllRoutes(origin, destination);

    if (!routeData.success) {
      return res.status(404).json({
        success: false,
        message: routeData.message,
      });
    }

    console.log(`✅ Found ${routeData.originStops.length} origin stops`);
    console.log(`✅ Found ${routeData.destStops.length} destination stops`);
    console.log(`✅ Found ${routeData.directRoutes.length} direct routes`);
    console.log(`✅ Found ${routeData.transferRoutes.length} transfer routes`);

    // Check if any routes found
    if (routeData.directRoutes.length === 0 && routeData.transferRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No routes found between these locations. Try different locations or check back later.',
      });
    }

    // Step 2: Generate buses for all routes
    const allBuses = await busGenerator.generateAllBuses(routeData, origin, destination);

    console.log(`🚌 Generated ${allBuses.length} total buses`);

    if (allBuses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Unable to generate bus schedules. Please try again.',
      });
    }

    // Step 3: Rank buses using TOPSIS
    const rankedBuses = topsisService.rankBuses(allBuses, weights);

    console.log(`⭐ Ranked ${rankedBuses.length} buses using TOPSIS`);
    console.log(`🥇 Top bus: ${rankedBuses[0]?.busId} with score ${rankedBuses[0]?.score}`);

    // Step 4: Return results
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
    console.error('❌ Error in findBuses:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while finding buses',
      error: error.message,
    });
  }
};