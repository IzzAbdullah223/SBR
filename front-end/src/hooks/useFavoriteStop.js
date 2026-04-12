import { useState, useCallback, useEffect } from 'react';
import { settingsAPI } from '../services/Api';

const useFavoriteStops = (user) => {
  const [favoriteStops,   setFavoriteStops]   = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setLoadingFavorites(true);
    try {
      const result = await settingsAPI.getFavoriteStops();
      if (result?.success) setFavoriteStops(result.data);
    } catch {
      // silent
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

useEffect(() => {
  if (user?.id) {
    fetchFavorites();
  } else {
    setFavoriteStops([]);
  }
}, [user?.id]); // ✅ FIX: use user.id not whole object — prevents double fetch

  const addFavorite = useCallback(async (stop) => {
    try {
      const result = await settingsAPI.addFavoriteStop({
        stopId:   stop.stopId,
        name:     stop.name,
        position: stop.position,
      });
      if (result?.success) setFavoriteStops(result.data);
    } catch {
      // silent — star just won't fill
    }
  }, []);

  const removeFavorite = useCallback(async (stopId) => {
    try {
      const result = await settingsAPI.removeFavoriteStop(stopId);
      if (result?.success) setFavoriteStops(result.data);
    } catch {
      // silent
    }
  }, []);

  const isFavorite = useCallback((stopId) => {
    return favoriteStops.some(s => s.stopId === stopId);
  }, [favoriteStops]);

  return {
    favoriteStops,
    loadingFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
};

export default useFavoriteStops;