// useSavedRoutes.js
// Manages the user's saved journeys (origin + destination pairs)
// Uses Api.js fetchAPI for consistent token injection + error handling
// instead of raw fetch() calls

import { useState, useCallback, useEffect } from 'react';

const API_BASE = '/api';

// helper — same token-injecting fetch used everywhere else
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

const useSavedRoutes = (user) => {
  const [savedRoutes, setSavedRoutes]   = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingKey, setSavingKey]       = useState(null);
  const [saveError, setSaveError]       = useState(null);
  const [showSaved, setShowSaved]       = useState(false);

  // ── FETCH SAVED ROUTES ─────────────────────────────────────────────────────
  const fetchSavedRoutes = useCallback(async () => {
    if (!user) return;
    setLoadingSaved(true);
    try {
      const data = await authFetch(`${API_BASE}/saved-routes`);
      if (data.success) {
        setSavedRoutes(data.data);
      } else {
        console.error('Failed to fetch saved routes:', data.message);
      }
    } catch (err) {
      console.error('Error fetching saved routes:', err);
    } finally {
      setLoadingSaved(false);
    }
  }, [user]);

  // fetch when user logs in, clear when user logs out
  useEffect(() => {
    if (user) {
      fetchSavedRoutes();
    } else {
      setSavedRoutes([]);
    }
  }, [user]);

  // ── SAVE A JOURNEY ─────────────────────────────────────────────────────────
  const saveRoute = useCallback(async (origin, destination) => {
    if (!user) {
      setSaveError('Please log in to save routes.');
      return false;
    }

    const journeyKey = `${origin.name}__${destination.name}`;
    setSavingKey(journeyKey);
    setSaveError(null);

    try {
      const payload = {
        routeName: `${origin.name} → ${destination.name}`,
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
        // add to local state immediately — no refetch needed
        setSavedRoutes((prev) => [data.data, ...prev]);
        return true;
      } else {
        // 409 = already saved — show friendly message not a hard error
        const msg = data.message || 'Could not save this route.';
        setSaveError(msg);
        return false;
      }
    } catch (err) {
      console.error('Error saving route:', err);
      setSaveError('Could not save this route. Please try again.');
      return false;
    } finally {
      setSavingKey(null);
    }
  }, [user]);

  // ── DELETE A SAVED ROUTE ───────────────────────────────────────────────────
  const deleteSavedRoute = useCallback(async (routeId) => {
    if (!user) return;
    try {
      const data = await authFetch(`${API_BASE}/saved-routes/${routeId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        // remove from local state — no refetch needed
        setSavedRoutes((prev) => prev.filter((r) => r._id !== routeId));
      }
    } catch (err) {
      console.error('Error deleting saved route:', err);
    }
  }, [user]);

  // ── TOGGLE PANEL ───────────────────────────────────────────────────────────
  const toggleSavedPanel = useCallback(() => {
    setShowSaved((prev) => {
      const next = !prev;
      if (next) fetchSavedRoutes(); // refresh every time panel opens
      return next;
    });
  }, [fetchSavedRoutes]);

  // ── CHECK IF JOURNEY IS ALREADY SAVED ──────────────────────────────────────
  // ✅ FIXED: match by lat/lng coordinates not name strings
  // Name strings from LocationIQ can have slight variations ("Dubai Mall" vs
  // "Dubai Mall, Dubai") causing false negatives. Coordinates are exact.
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