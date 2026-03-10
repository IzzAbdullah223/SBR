// useSavedRoutes.js
// Custom hook that manages the user's saved/favourite routes
// Handles fetching all saved routes and adding a new one
// Used by Home.jsx (to show the list) and BusResults.jsx (to trigger saving)

import { useState, useCallback, useEffect } from 'react';

const useSavedRoutes = (user) => {
  // savedRoutes — array of routes fetched from the backend for this user
  const [savedRoutes, setSavedRoutes] = useState([]);

  // loadingSaved — true while the GET request is in flight
  const [loadingSaved, setLoadingSaved] = useState(false);

  // savingId — holds the busId currently being saved so the button shows a spinner
  // null when nothing is being saved
  const [savingId, setSavingId] = useState(null);

  // saveError — error message shown if saving fails
  const [saveError, setSaveError] = useState(null);

  // showSaved — controls whether the saved routes panel is expanded in the sidebar
  const [showSaved, setShowSaved] = useState(false);

  // ── FETCH SAVED ROUTES ─────────────────────────────────────────────────────
  // Called when the user opens the saved routes panel
  // Also called on mount when user is logged in so BusResults can pre-mark
  // already-saved routes as "Route Saved ✓" without opening the panel first
  // GET /api/saved-routes — protected, requires token
  const fetchSavedRoutes = useCallback(async () => {
    if (!user) return;

    setLoadingSaved(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/saved-routes', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

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

  // ── FETCH ON LOGIN ─────────────────────────────────────────────────────────
  // runs whenever user changes (login / logout / page refresh restore)
  // this makes savedRoutes available immediately so BusResults can check
  // which routes are already saved without the user opening the panel first
  useEffect(() => {
    if (user) {
      fetchSavedRoutes();
    } else {
      // user logged out — clear saved routes from state
      setSavedRoutes([]);
    }
  }, [user]);

  // ── SAVE A ROUTE ───────────────────────────────────────────────────────────
  // Called when the user clicks "Add to Favourites" on a bus result card
  // POST /api/saved-routes — protected, requires token
  // bus         — the full bus result object from useFindBuses
  // origin      — { lat, lng, name } from Home state
  // destination — { lat, lng, name } from Home state
  const saveRoute = useCallback(async (bus, origin, destination) => {
    if (!user) {
      setSaveError('Please log in to save routes.');
      return false;
    }

    setSavingId(bus.busId);
    setSaveError(null);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        routeName: `${bus.routeNumber} — ${origin.name} → ${destination.name}`,
        origin: {
          name: origin.name,
          position: { lat: origin.lat, lng: origin.lng },
        },
        destination: {
          name: destination.name,
          position: { lat: destination.lat, lng: destination.lng },
        },
        routeNumber: bus.routeNumber,
        routeColor: bus.color || '#667eea',
        journeyType: bus.journeyType,
        estimatedTime: bus.arrivalTime,
        fare: bus.fare,
      };

      const response = await fetch('/api/saved-routes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // add the new saved route to local state immediately
        // so the list updates without needing a full refetch
        setSavedRoutes((prev) => [data.data, ...prev]);
        return true;
      } else {
        setSaveError(data.message || 'Could not save this route.');
        return false;
      }
    } catch (err) {
      console.error('Error saving route:', err);
      setSaveError('Could not save this route. Please try again.');
      return false;
    } finally {
      setSavingId(null);
    }
  }, [user]);

  // ── DELETE A SAVED ROUTE ───────────────────────────────────────────────────
  // Called when user clicks the remove (×) button on a saved route card
  // DELETE /api/saved-routes/:id — protected, requires token
  const deleteSavedRoute = useCallback(async (routeId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/saved-routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // remove from local state immediately — no need to refetch
        setSavedRoutes((prev) => prev.filter((r) => r._id !== routeId));
      }
    } catch (err) {
      console.error('Error deleting saved route:', err);
    }
  }, [user]);

  // ── TOGGLE PANEL ───────────────────────────────────────────────────────────
  // Opens or closes the saved routes panel in the sidebar
  // Also triggers a fetch when opening so the list is always fresh
  const toggleSavedPanel = useCallback(() => {
    setShowSaved((prev) => {
      const nextState = !prev;
      if (nextState) fetchSavedRoutes();
      return nextState;
    });
  }, [fetchSavedRoutes]);

  return {
    savedRoutes,
    loadingSaved,
    savingId,
    saveError,
    showSaved,
    saveRoute,
    deleteSavedRoute,
    toggleSavedPanel,
    setSaveError,
  };
};

export default useSavedRoutes;