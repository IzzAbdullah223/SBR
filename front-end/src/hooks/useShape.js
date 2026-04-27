import { useState, useEffect } from 'react';
import api from '../services/Api';

// Fetch a shape and trim it between two stops.
// Returns the coordinate array and trimRatio, or null on failure.
const fetchTrimmedShape = async (shapeId, originStopId, destStopId) => {
  if (!shapeId) return null;
  try {
    const res = await api.shapes.getById(shapeId, originStopId, destStopId);
    if (!res.success) return null;
    return { coordinates: res.coordinates, trimRatio: res.trimRatio ?? 1.0 };
  } catch {
    return null;
  }
};

// Fetch the best shape for a route segment.
//
// Strategy:
//   1. Try the outbound shape first — shapeController already reverses it
//      automatically if the user is travelling opposite to the stored direction.
//      So we ALWAYS trust the outbound result if it exists.
//   2. Only if outbound is completely missing do we try the return shape.
//   3. If both are missing, return null — Map.jsx draws a dashed straight line.
//
// Why we removed the trimRatio threshold check:
//   The old code replaced a correctly-reversed outbound shape with the return
//   shape whenever trimRatio > 0.75. This caused the line to jump onto wrong
//   roads because the return shape physically travels different streets.
//   Since our GTFS snapshot only reliably captured one direction per route,
//   the mathematical reversal in shapeController is more trustworthy than
//   switching to a return shape that may have incomplete or mismatched data.
const fetchBestShape = async (shapeId, shapeIdReturn, originStopId, destStopId) => {

  // Step 1 — try outbound shape (handles both directions via auto-reverse)
  if (shapeId) {
    const outbound = await fetchTrimmedShape(shapeId, originStopId, destStopId);
    if (outbound) {
      return outbound.coordinates;
    }
  }

  // Step 2 — outbound missing or failed, try return shape as last resort
  if (shapeIdReturn) {
    const returnShape = await fetchTrimmedShape(shapeIdReturn, originStopId, destStopId);
    if (returnShape) {
      return returnShape.coordinates;
    }
  }

  // Step 3 — both missing, Map.jsx will draw a dashed straight line
  return null;
};

const useShape = (selectedBus) => {
  const [shapeCoordinates, setShapeCoordinates] = useState(null);
  const [shapeCoordinatesLeg2, setShapeCoordinatesLeg2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setShapeCoordinates(null);
    setShapeCoordinatesLeg2(null);
    setError(null);

    if (!selectedBus) return;

    const fetchShape = async () => {
      setLoading(true);
      try {

        // ── Direct route ──────────────────────────────────────────────────
        if (selectedBus.journeyType === 'direct' && selectedBus.shapeId) {
          const originStopId = selectedBus.originStop?.stopId;
          const destStopId   = selectedBus.destinationStop?.stopId;


          const coords = await fetchBestShape(
            selectedBus.shapeId,
            selectedBus.shapeIdReturn,
            originStopId,
            destStopId
          );
          if (coords) {
            setShapeCoordinates(coords);
          }
        }

        // ── Transfer route ────────────────────────────────────────────────
        if (selectedBus.journeyType === 'transfer') {

          // Leg 1: origin → transfer stop
          if (selectedBus.shapeId) {
            const originStopId   = selectedBus.originStop?.stopId;
            const transferStopId = selectedBus.transferStop?.stopId;


            const coords1 = await fetchBestShape(
              selectedBus.shapeId,
              selectedBus.shapeIdReturn,
              originStopId,
              transferStopId
            );
            if (coords1) {
              setShapeCoordinates(coords1);
            }
          }

          // Leg 2: transfer stop → destination
          if (selectedBus.shapeIdLeg2) {
            const transferStopId = selectedBus.transferStop?.stopId;
            const destStopId     = selectedBus.destinationStop?.stopId;


            const coords2 = await fetchBestShape(
              selectedBus.shapeIdLeg2,
              selectedBus.shapeIdLeg2Return,
              transferStopId,
              destStopId
            );
            if (coords2) {
              setShapeCoordinatesLeg2(coords2);
            }
          }
        }

      } catch (err) {
        console.error('❌ Error fetching shape:', err);
        setError('Could not load route shape');
      } finally {
        setLoading(false);
      }
    };

    fetchShape();
  }, [selectedBus?.busId]);

  return { shapeCoordinates, shapeCoordinatesLeg2, loading, error };
};

export default useShape;