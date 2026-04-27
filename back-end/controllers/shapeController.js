import Shape from '../models/Shape.js';
import BusStop from '../models/BusStop.js';
const findClosestIndex = (coordinates, lat, lng) => {
  const cosLat = Math.cos(lat * Math.PI / 180);
  let minDist = Infinity;
  let minIdx  = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const dLat = coordinates[i].lat - lat;
    const dLng = (coordinates[i].lng - lng) * cosLat; 
    const d = dLat * dLat + dLng * dLng;
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
};
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
    let wasReversed  = false; 
    if (originStopId && destStopId) {
      const [originStop, destStop] = await Promise.all([
        BusStop.findOne({ stopId: originStopId }).select('position name'),
        BusStop.findOne({ stopId: destStopId   }).select('position name'),
      ]);
      if (originStop && destStop) {
        const originIdx = findClosestIndex(coordinates, originStop.position.lat, originStop.position.lng);
        const destIdx   = findClosestIndex(coordinates, destStop.position.lat,   destStop.position.lng);
        if (originIdx === destIdx) {
        } else if (originIdx < destIdx) {
          coordinates = coordinates.slice(originIdx, destIdx + 1);
          trimmed     = true;
          wasReversed = false;
        } else {
          coordinates = coordinates.slice(destIdx, originIdx + 1).reverse();
          trimmed     = true;
          wasReversed = true;
        }
        trimRatio = coordinates.length / fullLength;
      }
    }
    return res.status(200).json({
      success:    true,
      shapeId:    shape.shapeId,
      pointCount: coordinates.length,
      totalDistance: shape.totalDistance,
      trimmed,
      trimRatio,
      wasReversed, 
      coordinates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error while fetching shape' });
  }
};
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};