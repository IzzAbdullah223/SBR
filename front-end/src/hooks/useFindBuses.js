import { useState, useCallback } from 'react';
import api from '../services/Api';

// ✅ Maps backend errorCode to a user-friendly message with icon
const getErrorMessage = (errorCode, message) => {
  const errors = {
    INVALID_ORIGIN:     { icon: '📍', text: 'Please select your origin from the dropdown — don\'t just type it.' },
    INVALID_DESTINATION:{ icon: '📍', text: 'Please select your destination from the dropdown — don\'t just type it.' },
    NO_STOPS_BOTH:      { icon: '🚏', text: 'No bus stops found near either location. Try selecting a spot closer to a main road.' },
    NO_ORIGIN_STOPS:    { icon: '🚏', text: 'No bus stops found near your origin. Try a nearby main road or landmark.' },
    NO_DEST_STOPS:      { icon: '🚏', text: 'No bus stops found near your destination. Try a nearby main road or landmark.' },
    NO_STOPS:           { icon: '🚏', text: 'No bus stops found near your locations. Try different areas.' },
    NO_ROUTES:          { icon: '🗺️', text: 'Bus stops found but no routes connect these two locations. Try locations along major roads.' },
    OUT_OF_SERVICE:     { icon: '🕐', text: 'Routes found but no buses are running right now. Dubai RTA buses run from 5:00 AM to 11:30 PM.' },
    SERVER_ERROR:       { icon: '⚙️', text: 'Something went wrong on our end. Please try again.' },
    NETWORK_ERROR:      { icon: '📡', text: 'Cannot reach the server. Please check your connection and try again.' },
    TIMEOUT:            { icon: '⏱️', text: 'The request took too long. Please try again.' },
  };

  const match = errors[errorCode];
  if (match) return `${match.icon} ${match.text}`;
  return `⚠️ ${message || 'Something went wrong. Please try again.'}`;
};

const useFindBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const findBuses = useCallback(async (origin, destination, weights) => {

    // ── Frontend validation ─────────────────────────────────────────────────
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response;
      try {
        response = await api.topsis.findBuses(origin, destination, weights);
        clearTimeout(timeout);
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr.name === 'AbortError') {
          setError(getErrorMessage('TIMEOUT'));
          return;
        }
        setError(getErrorMessage('NETWORK_ERROR'));
        return;
      }

      if (response.success) {
        setBuses(response.buses);
        setStats(response.stats);
      } else {
        // ✅ Use specific errorCode from backend if available
        setError(getErrorMessage(response.errorCode, response.message));
      }

    } catch (err) {
      console.error('Error finding buses:', err);
      setError(getErrorMessage('NETWORK_ERROR'));
    } finally {
      setLoading(false);
    }

  }, []);

  const clearResults = useCallback(() => {
    setBuses([]);
    setError(null);
    setStats(null);
  }, []);

  return { buses, loading, error, stats, findBuses, clearResults };
};

export default useFindBuses;