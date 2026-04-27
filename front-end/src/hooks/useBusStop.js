import { useState, useCallback } from 'react';
import { busStopsAPI } from '../services/Api';

const useBusStop = () => {
  const [selectedStop, setSelectedStop] = useState(null);
  const [loadingStop, setLoadingStop] = useState(false);

  const selectStop = useCallback(async (basicStop) => {
    if (!basicStop?.stopId) return;

 
    setSelectedStop(basicStop);
    setLoadingStop(true);

    try {
      const result = await busStopsAPI.getById(basicStop.stopId);
      if (result?.success && result?.data) {
        // Replace with full data — now includes routes[] and amenities[]
        setSelectedStop(result.data);
      }
    } catch {
      // Keep showing the basic stop data if the fetch fails
    } finally {
      setLoadingStop(false);
    }
  }, []);

  const clearStop = useCallback(() => {
    setSelectedStop(null);
    setLoadingStop(false);
  }, []);

  return { selectedStop, loadingStop, selectStop, clearStop };
};

export default useBusStop;