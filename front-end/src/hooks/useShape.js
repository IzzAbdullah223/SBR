import { useState, useEffect } from 'react';
import api from '../services/Api';

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
        // ── Direct route ─────────────────────────────────────────────────────
        if (selectedBus.journeyType === 'direct' && selectedBus.shapeId) {
          const originStopId = selectedBus.originStop?.stopId;
          const destStopId = selectedBus.destinationStop?.stopId;

          console.log('🗺️ Fetching trimmed shape:', selectedBus.shapeId, originStopId, '→', destStopId);

          const response = await api.shapes.getById(
            selectedBus.shapeId,
            originStopId,
            destStopId
          );

          if (response.success) {
            console.log('✅ Shape loaded:', response.coordinates?.length, 'points');
            setShapeCoordinates(response.coordinates);
          }
        }

        // ── Transfer route ───────────────────────────────────────────────────
        if (selectedBus.journeyType === 'transfer') {
          if (selectedBus.shapeId) {
            const res1 = await api.shapes.getById(
              selectedBus.shapeId,
              selectedBus.originStop?.stopId,
              selectedBus.transferStop?.stopId  // leg1 ends at transfer stop
            );
            if (res1.success) {
              console.log('✅ Leg1 shape loaded:', res1.coordinates?.length, 'points');
              setShapeCoordinates(res1.coordinates);
            }
          }
          if (selectedBus.shapeIdLeg2) {
            const res2 = await api.shapes.getById(
              selectedBus.shapeIdLeg2,
              selectedBus.transferStop?.stopId,  // leg2 starts at transfer stop
              selectedBus.destinationStop?.stopId
            );
            if (res2.success) {
              console.log('✅ Leg2 shape loaded:', res2.coordinates?.length, 'points');
              setShapeCoordinatesLeg2(res2.coordinates);
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