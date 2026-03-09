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

    // ✅ FIXED: check order was wrong before.
    // Old code checked BOTH empty first, then origin-only, then dest-only.
    // But routeData.success is false when EITHER array is empty, so the
    // individual checks (NO_ORIGIN_STOPS / NO_DEST_STOPS) never fired —
    // everything fell through to the generic NO_STOPS fallback.
    //
    // Correct order: check each individually first (most specific),
    // then both empty together, then the generic !success fallback last.

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
    // Problem: busGenerator creates 5 departure times per route.
    // If we rank all of them together, TOPSIS compares 5 nearly identical
    // buses (same route, 1-2 min apart) against each other — they crowd out
    // other routes and the ranking becomes meaningless.
    //
    // Fix: pick ONE representative bus per route (the earliest departure)
    // and run TOPSIS on those. This ranks actual different routes against
    // each other. Then after ranking, attach the remaining departures back
    // to each route so the frontend can show "next bus in 4 min, also at..."
    //
    // Group all buses by routeNumber
    const busGroups = {};
    allBuses.forEach(bus => {
      const key = bus.routeNumber;
      if (!busGroups[key]) busGroups[key] = [];
      busGroups[key].push(bus);
    });

    // Sort each group by arrivalTime and pick the first as the representative
    // the representative is what TOPSIS scores — it carries the route's
    // best (earliest) departure as its arrivalTime criterion
    const representatives = Object.values(busGroups).map(group => {
      const sorted = group.sort((a, b) => a.arrivalTime - b.arrivalTime);
      const rep = sorted[0];
      // attach all departures so frontend can show the full schedule
      rep.upcomingDepartures = sorted.map(b => ({
        departureTime: b.departureTime,
        departureTime24: b.departureTime24,
        minutesFromNow: b.arrivalTime,
      }));
      return rep;
    });

    console.log(`📊 Running TOPSIS on ${representatives.length} unique routes`);

    let rankedBuses;
    try {
      rankedBuses = topsisService.rankBuses(representatives, weights);
    } catch (topsisError) {
      console.error('❌ TOPSIS ranking failed:', topsisError);
      rankedBuses = representatives.map(b => ({ ...b, score: 0 }));
    }

    console.log(`⭐ Ranked ${rankedBuses.length} routes using TOPSIS`);

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