/**
 * SHAPE CONTROLLER
 * Returns GPS coordinates for a given shapeId
 */

import Shape from '../models/Shape.js';
import BusStop from '../models/BusStop.js';

// Helper: find index of closest shape point to a lat/lng
const findClosestPointIndex = (coordinates, lat, lng) => {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const dLat = coordinates[i].lat - lat;
    const dLng = coordinates[i].lng - lng;
    const dist = dLat * dLat + dLng * dLng; // no need for sqrt
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }
  return minIdx;
};

/**
 * GET /api/shapes/:shapeId
 * Optional query params: originStopId, destStopId
 * Returns trimmed coordinates between origin and destination stops
 */
export const getShapeById = async (req, res) => {
  try {
    const { shapeId } = req.params;
    const { originStopId, destStopId } = req.query;

    const shape = await Shape.findOne({ shapeId }).select('shapeId coordinates pointCount totalDistance');

    if (!shape) {
      return res.status(404).json({
        success: false,
        message: `Shape ${shapeId} not found`,
      });
    }

    let coordinates = shape.coordinates;

    // ✅ Trim to segment between origin and destination stops
    if (originStopId && destStopId) {
      const [originStop, destStop] = await Promise.all([
        BusStop.findOne({ stopId: originStopId }).select('position'),
        BusStop.findOne({ stopId: destStopId }).select('position'),
      ]);

      if (originStop && destStop) {
        const originIdx = findClosestPointIndex(coordinates, originStop.position.lat, originStop.position.lng);
        const destIdx = findClosestPointIndex(coordinates, destStop.position.lat, destStop.position.lng);

        // Make sure we go in the right direction (origin before dest)
        const startIdx = Math.min(originIdx, destIdx);
        const endIdx = Math.max(originIdx, destIdx);

        coordinates = coordinates.slice(startIdx, endIdx + 1);
        console.log(`✂️  Trimmed shape ${shapeId}: ${shape.coordinates.length} → ${coordinates.length} points (stops ${originStopId} → ${destStopId})`);
      }
    }

    return res.status(200).json({
      success: true,
      shapeId: shape.shapeId,
      pointCount: coordinates.length,
      totalDistance: shape.totalDistance,
      coordinates,
    });

  } catch (error) {
    console.error('❌ Error fetching shape:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching shape',
    });
  }
};

/**
 * GET /api/shapes/route/:routeNumber
 */
export const getShapeByRouteNumber = async (req, res) => {
  try {
    const { routeNumber } = req.params;
    const { default: BusRoute } = await import('../models/BusRoute.js');

    const route = await BusRoute.findOne({ routeNumber }).select('shapeId shapeIdReturn color routeNumber name');

    if (!route) {
      return res.status(404).json({ success: false, message: `Route ${routeNumber} not found` });
    }

    if (!route.shapeId) {
      return res.status(404).json({ success: false, message: `No shape available for route ${routeNumber}` });
    }

    const shape = await Shape.findOne({ shapeId: route.shapeId }).select('coordinates pointCount');

    if (!shape) {
      return res.status(404).json({ success: false, message: `Shape data not found for route ${routeNumber}` });
    }

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
    return res.status(500).json({ success: false, message: 'Server error while fetching route shape' });
  }
};