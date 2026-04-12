/**
 * SHAPE CONTROLLER
 * Returns GPS coordinates for a given shapeId, trimmed to the
 * user's actual travel segment (origin stop → destination stop).
 *
 * The controller handles both directions automatically:
 *   - If originIdx < destIdx → user travels same direction as stored shape → simple slice
 *   - If originIdx > destIdx → user travels opposite direction → slice + reverse
 *
 * The caller (useShape.js) always trusts this result and never needs to
 * second-guess the direction by trying the return shape.
 */

import Shape from '../models/Shape.js';
import BusStop from '../models/BusStop.js';

// Find the index of the shape point closest to a lat/lng.
// Uses a longitude-corrected distance to account for the fact that
// 1 degree of longitude ≠ 1 degree of latitude in actual meters.
// At Dubai's latitude (~25°), cos(25°) ≈ 0.906, so longitude degrees
// are about 90% the size of latitude degrees. Without this correction,
// the closest point found can be slightly off, causing the trim to
// start or end a few points away from the actual stop position.
const findClosestIndex = (coordinates, lat, lng) => {
  const cosLat = Math.cos(lat * Math.PI / 180);
  let minDist = Infinity;
  let minIdx  = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const dLat = coordinates[i].lat - lat;
    const dLng = (coordinates[i].lng - lng) * cosLat; // corrected for longitude distortion
    const d = dLat * dLat + dLng * dLng;
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
};

/**
 * GET /api/shapes/:shapeId?originStopId=X&destStopId=Y
 */
export const getShapeById = async (req, res) => {
  try {
    const { shapeId } = req.params;
    const { originStopId, destStopId } = req.query;

    const shape = await Shape.findOne({ shapeId })
      .select('shapeId coordinates pointCount totalDistance');

    if (!shape) {
      return res.status(404).json({ success: false, message: `Shape ${shapeId} not found` });
    }

    const fullLength = shape.coordinates.length;
    let coordinates  = shape.coordinates;
    let trimmed      = false;
    let trimRatio    = 1.0;
    let wasReversed  = false; // true when user travels opposite to stored direction

    if (originStopId && destStopId) {
      const [originStop, destStop] = await Promise.all([
        BusStop.findOne({ stopId: originStopId }).select('position name'),
        BusStop.findOne({ stopId: destStopId   }).select('position name'),
      ]);

      if (originStop && destStop) {
        const originIdx = findClosestIndex(coordinates, originStop.position.lat, originStop.position.lng);
        const destIdx   = findClosestIndex(coordinates, destStop.position.lat,   destStop.position.lng);

        if (originIdx === destIdx) {
          // Both stops snap to the same shape point — shape data is too sparse
          // to distinguish them. Return full shape and let the map show what it can.
          console.warn(`⚠️  Shape ${shapeId}: origin+dest snap to same index ${originIdx} — returning full shape`);

        } else if (originIdx < destIdx) {
          // User travels in the same direction as the stored shape → simple slice
          coordinates = coordinates.slice(originIdx, destIdx + 1);
          trimmed     = true;
          wasReversed = false;

        } else {
          // User travels OPPOSITE to the stored shape direction.
          // This happens when the GTFS snapshot captured the route in one direction
          // but the user is searching the reverse journey.
          // We handle this by slicing the relevant segment and reversing it so the
          // coordinates always flow from the user's origin to their destination.
          coordinates = coordinates.slice(destIdx, originIdx + 1).reverse();
          trimmed     = true;
          wasReversed = true;
        }

        trimRatio = coordinates.length / fullLength;

        console.log(
          `✂️  Shape ${shapeId}: ${fullLength} → ${coordinates.length} pts ` +
          `(ratio=${trimRatio.toFixed(2)}, reversed=${wasReversed}, ` +
          `stops ${originStopId}[${originIdx}] → ${destStopId}[${destIdx}])`
        );
      }
    }

    return res.status(200).json({
      success:    true,
      shapeId:    shape.shapeId,
      pointCount: coordinates.length,
      totalDistance: shape.totalDistance,
      trimmed,
      trimRatio,
      wasReversed, // ← tells useShape the direction was already corrected
      coordinates,
    });

  } catch (error) {
    console.error('❌ Error fetching shape:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching shape' });
  }
};

/**
 * GET /api/shapes/route/:routeNumber
 */
export const getShapeByRouteNumber = async (req, res) => {
  try {
    const { routeNumber } = req.params;
    const { default: BusRoute } = await import('../models/BusRoute.js');

    const route = await BusRoute.findOne({ routeNumber })
      .select('shapeId shapeIdReturn color routeNumber name');

    if (!route) {
      return res.status(404).json({ success: false, message: `Route ${routeNumber} not found` });
    }
    if (!route.shapeId) {
      return res.status(404).json({ success: false, message: `No shape for route ${routeNumber}` });
    }

    const shape = await Shape.findOne({ shapeId: route.shapeId }).select('coordinates pointCount');
    if (!shape) {
      return res.status(404).json({ success: false, message: `Shape data not found for route ${routeNumber}` });
    }

    return res.status(200).json({
      success:     true,
      routeNumber: route.routeNumber,
      routeName:   route.name,
      color:       route.color,
      shapeId:     route.shapeId,
      pointCount:  shape.pointCount,
      coordinates: shape.coordinates,
    });

  } catch (error) {
    console.error('❌ Error fetching shape by route:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};