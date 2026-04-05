import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/Api';

/**
 * useOptimizationMode
 * Manages the selected TOPSIS optimization mode.
 * Syncs with the user's saved preference and persists changes to the backend.
 */
const useOptimizationMode = (user) => {
  const [optimizationMode, setOptimizationMode] = useState(
    () => user?.preferences?.optimizationMode || 'fastest'
  );

  // Sync when user logs in or preference changes remotely
  useEffect(() => {
    setOptimizationMode(user?.preferences?.optimizationMode || 'fastest');
  }, [user?.preferences?.optimizationMode]);

  const handleModeChange = async (mode) => {
    setOptimizationMode(mode);
    if (user) {
      try { await settingsAPI.updatePreferences(mode); } catch {}
    }
  };

  return { optimizationMode, handleModeChange };
};

export default useOptimizationMode;