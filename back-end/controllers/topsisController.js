import * as routeFinder from '../services/routeFinder.service.js';
import * as busGenerator from '../services/busGenerator.service.js';
import * as topsisService from '../services/topsis.service.js';

export const findBuses = async (req, res) => {
  try {
    const { origin, destination, weights } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!origin || !destination || !weights) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: 'Origin, destination and weights are required.',
      });
    }

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

    // ── Step 1: Find nearby stops ───────────────────────────────────────────
    console.log('🔍 Finding buses from:', origin, 'to:', destination);

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

    // ✅ Generic fallback — only reached if success:false for some other reason
    if (!routeData.success) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_STOPS',
        message: routeData.message || 'No bus stops found near your locations.',
      });
    }

    console.log(`✅ Found ${routeData.originStops.length} origin stops`);
    console.log(`✅ Found ${routeData.destStops.length} destination stops`);
    console.log(`✅ Found ${routeData.directRoutes.length} direct routes`);
    console.log(`✅ Found ${routeData.transferRoutes.length} transfer routes`);

    // ── Step 2: Check routes found ──────────────────────────────────────────
    if (routeData.directRoutes.length === 0 && routeData.transferRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_ROUTES',
        message: `Bus stops were found near both locations, but no routes connect them. Try locations along major roads like Sheikh Zayed Road or Al Wasl Road.`,
        debug: {
          originStops: routeData.originStops.length,
          destStops: routeData.destStops.length,
        },
      });
    }

    // ── Step 3: Generate buses ──────────────────────────────────────────────
    const allBuses = await busGenerator.generateAllBuses(routeData, origin, destination);

    console.log(`🚌 Generated ${allBuses.length} total buses`);

    if (allBuses.length === 0) {
      return res.status(404).json({
        success: false,
        errorCode: 'OUT_OF_SERVICE',
        message: `Routes were found but no buses are currently running. Dubai RTA buses typically operate from 5:00 AM to 11:30 PM on weekdays.`,
        debug: {
          directRoutes: routeData.directRoutes.length,
          transferRoutes: routeData.transferRoutes.length,
        },
      });
    }

    // ── Step 4: Rank using TOPSIS ───────────────────────────────────────────
    let rankedBuses;
    try {
      rankedBuses = topsisService.rankBuses(allBuses, weights);
    } catch (topsisError) {
      console.error('❌ TOPSIS ranking failed:', topsisError);
      rankedBuses = allBuses.map(b => ({ ...b, score: 0 }));
    }

    console.log(`⭐ Ranked ${rankedBuses.length} buses using TOPSIS`);

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
      errorCode: 'SERVER_ERROR',
      message: 'Something went wrong on our end. Please try again in a moment.',
      error: error.message,
    });
  }
};