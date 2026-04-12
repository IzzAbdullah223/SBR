import { useState, useCallback, useEffect } from 'react';

const API_BASE = '/api';

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  return response.json();
};

// Truncate a location name so the combined routeName never exceeds the schema maxlength.
// LocationIQ display names can be very long — e.g. "Zayed University – Knowledge Village Campus"
const truncate = (str, max) => str.length > max ? str.slice(0, max - 1) + '…' : str;

const useSavedRoutes = (user) => {
  const [savedRoutes, setSavedRoutes]   = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingKey, setSavingKey]       = useState(null);
  const [saveError, setSaveError]       = useState(null);
  const [showSaved, setShowSaved]       = useState(false);

  const fetchSavedRoutes = useCallback(async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const data = await authFetch(`${API_BASE}/saved-routes`);
      if (data.success) {
        setSavedRoutes(data.data);
      }
    } catch {
      // silent — panel will just show empty state
    } finally {
      setLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
  if (user?.id) {
    fetchSavedRoutes();
  } else {
    setSavedRoutes([]);
  }
}, [user?.id]); // ✅ FIX: use user.id not whole object — prevents double fetch

  const saveRoute = useCallback(async (origin, destination) => {
    if (!user) {
      setSaveError('Please log in to save routes.');
      return false;
    }

    const journeyKey = `${origin.name}__${destination.name}`;
    setSavingKey(journeyKey);
    setSaveError(null);

    try {
      // Truncate each leg to 48 chars so "A → B" always fits within 100 chars
      const originLabel      = truncate(origin.name,      48);
      const destinationLabel = truncate(destination.name, 48);

      const payload = {
        routeName: `${originLabel} → ${destinationLabel}`,
        origin: {
          name: origin.name,
          position: { lat: origin.lat, lng: origin.lng },
        },
        destination: {
          name: destination.name,
          position: { lat: destination.lat, lng: destination.lng },
        },
      };

      const data = await authFetch(`${API_BASE}/saved-routes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setSavedRoutes((prev) => [data.data, ...prev]);
        return true;
      } else {
        setSaveError(data.message || 'Could not save this route.');
        return false;
      }
    } catch {
      setSaveError('Could not save this route. Please try again.');
      return false;
    } finally {
      setSavingKey(null);
    }
  }, [user]);

  const deleteSavedRoute = useCallback(async (routeId) => {
    if (!user) return;
    try {
      const data = await authFetch(`${API_BASE}/saved-routes/${routeId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSavedRoutes((prev) => prev.filter((r) => r._id !== routeId));
      }
    } catch {
      // silent
    }
  }, [user]);

  const toggleSavedPanel = useCallback(() => {
    setShowSaved((prev) => {
      const next = !prev;
      if (next) fetchSavedRoutes();
      return next;
    });
  }, [fetchSavedRoutes]);

  const isJourneySaved = useCallback((originLat, originLng, destLat, destLng) => {
    return savedRoutes.some(
      (r) =>
        r.origin?.position?.lat === originLat &&
        r.origin?.position?.lng === originLng &&
        r.destination?.position?.lat === destLat &&
        r.destination?.position?.lng === destLng
    );
  }, [savedRoutes]);

  return {
    savedRoutes,
    loadingSaved,
    savingKey,
    saveError,
    showSaved,
    saveRoute,
    deleteSavedRoute,
    toggleSavedPanel,
    setSaveError,
    isJourneySaved,
  };
};

export default useSavedRoutes;