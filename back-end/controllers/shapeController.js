/**
 * SHAPE CONTROLLER
 * Returns GPS coordinates for a given shapeId, trimmed to the
 * user's actual travel segment (origin stop → destination stop).
 *
 * Returns trimRatio (trimmed / full length) so the caller can decide
 * whether to try the return shape for a tighter segment.
 */

import Shape from '../models/Shape.js';
import BusStop from '../models/BusStop.js';

// Find the index of the shape point closest to a lat/lng
const findClosestIndex = (coordinates, lat, lng) => {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const dLat = coordinates[i].lat - lat;
    const dLng = coordinates[i].lng - lng;
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
    let coordinates = shape.coordinates;
    let trimmed = false;
    let trimRatio = 1.0; // 1.0 = no trim (full shape), 0.1 = trimmed to 10%

    if (originStopId && destStopId) {
      const [originStop, destStop] = await Promise.all([
        BusStop.findOne({ stopId: originStopId }).select('position name'),
        BusStop.findOne({ stopId: destStopId  }).select('position name'),
      ]);

      if (originStop && destStop) {
        const originIdx = findClosestIndex(coordinates, originStop.position.lat, originStop.position.lng);
        const destIdx   = findClosestIndex(coordinates, destStop.position.lat,   destStop.position.lng);

        if (originIdx === destIdx) {
          // Stops snap to same point — return full shape, let caller try return shape
          console.warn(`⚠️  Shape ${shapeId}: origin+dest snap to same index ${originIdx}`);
        } else if (originIdx < destIdx) {
          coordinates = coordinates.slice(originIdx, destIdx + 1);
          trimmed = true;
        } else {
          // Travelling opposite to stored direction — slice and reverse
          coordinates = coordinates.slice(destIdx, originIdx + 1).reverse();
          trimmed = true;
        }

        trimRatio = coordinates.length / fullLength;

        console.log(
          `✂️  Shape ${shapeId}: ${fullLength} → ${coordinates.length} pts ` +
          `(ratio=${trimRatio.toFixed(2)}, stops ${originStopId}[${originIdx}] → ${destStopId}[${destIdx}])`
        );
      }
    }

    return res.status(200).json({
      success: true,
      shapeId: shape.shapeId,
      pointCount: coordinates.length,
      totalDistance: shape.totalDistance,
      trimmed,
      trimRatio,   // ← new: caller uses this to decide if return shape is better
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

    if (!route) return res.status(404).json({ success: false, message: `Route ${routeNumber} not found` });
    if (!route.shapeId) return res.status(404).json({ success: false, message: `No shape for route ${routeNumber}` });

    const shape = await Shape.findOne({ shapeId: route.shapeId }).select('coordinates pointCount');
    if (!shape) return res.status(404).json({ success: false, message: `Shape data not found for route ${routeNumber}` });

    return res.status(200).json({
      success: true,
      routeNumber: route.routeNumber,
      routeName: route.name,
      color: route.color,
      shapeId: route.shapeId,
      pointCount: shape.pointCount,
      coordinates: shape.coordinates,
    });

  } catch (error) {
    console.error('❌ Error fetching shape by route:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};