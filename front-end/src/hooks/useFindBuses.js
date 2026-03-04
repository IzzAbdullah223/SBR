// useCallback → saves a FUNCTION
// useMemo     → saves a VALUE (result of a function)

// useCallback(() => doSomething(), [])   returns the function itself
// useMemo(() => doSomething(), [])       returns what the function returns
import { useState, useCallback } from 'react';
import api from '../services/Api';

const getErrorMessage = (errorCode, message) => {
  const errors = {
    INVALID_ORIGIN:      '📍 Please select your origin from the dropdown — don\'t just type it.',
    INVALID_DESTINATION: '📍 Please select your destination from the dropdown — don\'t just type it.',
    NO_STOPS_BOTH:       '🚏 No bus stops found near either location. Try selecting a spot closer to a main road.',
    NO_ORIGIN_STOPS:     '🚏 No bus stops found near your origin. Try a nearby main road or landmark.',
    NO_DEST_STOPS:       '🚏 No bus stops found near your destination. Try a nearby main road or landmark.',
    NO_STOPS:            '🚏 No bus stops found near your locations. Try different areas.',
    NO_ROUTES:           '🗺️ Bus stops were found but no routes connect these two locations. Try locations along major roads.',
    OUT_OF_SERVICE:      '🕐 Routes found but no buses are running right now. Dubai RTA buses run from 5:00 AM to 11:30 PM.',
    SERVER_ERROR:        '⚙️ Something went wrong on our end. Please try again.',
    NETWORK_ERROR:       '📡 Cannot reach the server. Please check your connection and try again.',
  };

  return errors[errorCode] || `⚠️ ${message || 'Something went wrong. Please try again.'}`;
};

const useFindBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const findBuses = useCallback(async (origin, destination, weights) => {//// useCallback saves a function in memory so React doesn't recreate it on every render.
// Without it, every re-render creates a new function object — causing unnecessary re-renders in children.
// Empty [] means create once and never recreate.
// With dependencies [x] — only recreate when x changes.

    // Frontend validation
    if (!origin?.lat || !origin?.lng) {
      setError(getErrorMessage('INVALID_ORIGIN'));
      return;
    }
    if (!destination?.lat || !destination?.lng) {
      setError(getErrorMessage('INVALID_DESTINATION'));
      return;
    }
    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setError('⚠️ Origin and destination cannot be the same place.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBuses([]);
      setStats(null);

     
      const response = await api.topsis.findBuses(origin, destination, weights);

      if (response.success) {
        setBuses(response.buses);
        setStats(response.stats);
      } else {
        // errorCode from backend maps to specific message
        setError(getErrorMessage(response.errorCode, response.message));
      }

    } catch (err) {
      // Only true network errors reach here (server completely down)
      console.error('Network error finding buses:', err);
      setError(getErrorMessage('NETWORK_ERROR'));
    } finally {
      setLoading(false);
    }

  }, []);// [] this empty [] for the useCallback means only calculate it once.

  const clearResults = useCallback(() => {
    setBuses([]);
    setError(null);
    setStats(null);
  }, []);// used later when doing another search to delete every bus results shown in the UI

  return { buses, loading, error, stats, findBuses, clearResults };
};

export default useFindBuses;