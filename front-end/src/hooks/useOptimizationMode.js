import { useState, useEffect, useCallback } from 'react';
import { settingsAPI, topsisAPI } from '../services/Api';

const useOptimizationMode = (user, buses, setBuses) => {
  const [optimizationMode, setOptimizationMode] = useState(
    () => user?.preferences?.optimizationMode || 'fastest'
  );
  const [ranking, setRanking] = useState(false);

  useEffect(() => {
    setOptimizationMode(user?.preferences?.optimizationMode || 'fastest');
  }, [user?.preferences?.optimizationMode]);

  const handleModeChange = useCallback(
    async (mode) => {
      setOptimizationMode(mode);

      if (buses && buses.length > 0) {
        setRanking(true);
        try {
          const result = await topsisAPI.rank(buses, mode);
          if (result?.success) setBuses(result.buses);
        } catch {
          // silent — existing order stays if rank fails
        } finally {
          setRanking(false);
        }
      }

      if (user) {
        try {
          await settingsAPI.updatePreferences(mode);
        } catch {}
      }
    },
    [buses, setBuses, user]
  );

  return { optimizationMode, handleModeChange, ranking };
};

export default useOptimizationMode;
