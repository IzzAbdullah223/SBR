import { useState, useEffect } from 'react';
import api from '../services/Api';

// Threshold: if trimmed segment is more than 75% of the full shape,
// it means the stops are near the two termini and the "trim" didn't help much.
// In that case, try the return shape — it may give a shorter segment.
const TRIM_RATIO_THRESHOLD = 0.75;

// Fetch a shape and trim it between two stops.
// Returns the coordinate array, or null on failure.
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

// Fetch both the outbound and return shapes, return whichever gives a shorter segment.
// Falls back to whichever one succeeds if only one is available.
const fetchBestShape = async (shapeId, shapeIdReturn, originStopId, destStopId) => {
  const outbound = await fetchTrimmedShape(shapeId, originStopId, destStopId);

  // If outbound trim is already tight (< threshold), use it immediately
  if (outbound && outbound.trimRatio < TRIM_RATIO_THRESHOLD) {
    console.log(`✅ Outbound shape ${shapeId} trim ratio ${outbound.trimRatio.toFixed(2)} — using outbound`);
    return outbound.coordinates;
  }

  // Otherwise try the return shape too
  const returnShape = shapeIdReturn
    ? await fetchTrimmedShape(shapeIdReturn, originStopId, destStopId)
    : null;

  if (!outbound && !returnShape) return null;
  if (!outbound) return returnShape.coordinates;
  if (!returnShape) {
    console.log(`⚠️  Shape ${shapeId} trim ratio ${outbound.trimRatio.toFixed(2)} — no return shape, using outbound`);
    return outbound.coordinates;
  }

  // Both available — use whichever gives the shorter (more focused) segment
  if (returnShape.trimRatio < outbound.trimRatio) {
    console.log(`🔄 Return shape ${shapeIdReturn} is better (${returnShape.trimRatio.toFixed(2)} < ${outbound.trimRatio.toFixed(2)})`);
    return returnShape.coordinates;
  }
  console.log(`✅ Outbound shape ${shapeId} is better (${outbound.trimRatio.toFixed(2)} ≤ ${returnShape.trimRatio.toFixed(2)})`);
  return outbound.coordinates;
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

          console.log('🗺️ Fetching direct shape:', selectedBus.shapeId, originStopId, '→', destStopId);

          const coords = await fetchBestShape(
            selectedBus.shapeId,
            selectedBus.shapeIdReturn,
            originStopId,
            destStopId
          );
          if (coords) {
            console.log('✅ Direct shape loaded:', coords.length, 'points');
            setShapeCoordinates(coords);
          }
        }

        // ── Transfer route ────────────────────────────────────────────────
        if (selectedBus.journeyType === 'transfer') {

          // Leg 1: origin → transfer stop
          if (selectedBus.shapeId) {
            const originStopId   = selectedBus.originStop?.stopId;
            const transferStopId = selectedBus.transferStop?.stopId;

            console.log('🗺️ Fetching leg1 shape:', selectedBus.shapeId, originStopId, '→', transferStopId);

            const coords1 = await fetchBestShape(
              selectedBus.shapeId,
              selectedBus.shapeIdReturn,
              originStopId,
              transferStopId
            );
            if (coords1) {
              console.log('✅ Leg1 shape loaded:', coords1.length, 'points');
              setShapeCoordinates(coords1);
            }
          }

          // Leg 2: transfer stop → destination
          if (selectedBus.shapeIdLeg2) {
            const transferStopId = selectedBus.transferStop?.stopId;
            const destStopId     = selectedBus.destinationStop?.stopId;

            console.log('🗺️ Fetching leg2 shape:', selectedBus.shapeIdLeg2, transferStopId, '→', destStopId);

            const coords2 = await fetchBestShape(
              selectedBus.shapeIdLeg2,
              selectedBus.shapeIdLeg2Return,  // ← now available from busGenerator
              transferStopId,
              destStopId
            );
            if (coords2) {
              console.log('✅ Leg2 shape loaded:', coords2.length, 'points');
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