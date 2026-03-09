// useCallback → saves a FUNCTION
// useMemo     → saves a VALUE (result of a function)

// useCallback(() => doSomething(), [])   returns the function itself
// useMemo(() => doSomething(), [])       returns what the function returns
import { useState, useCallback } from 'react';
import api from '../services/Api';

// maps backend errorCodes to human-readable messages shown in the UI
// falls back to the raw backend message if the code isn't recognised
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

// errorCode categories — used by Home.jsx to style the error box differently
// 'info'  = expected result, not a bug (no routes, out of service, no stops)
// 'error' = something actually went wrong (server error, network down)
export const ERROR_TYPES = {
  INVALID_ORIGIN:      'error',
  INVALID_DESTINATION: 'error',
  NO_STOPS_BOTH:       'info',
  NO_ORIGIN_STOPS:     'info',
  NO_DEST_STOPS:       'info',
  NO_STOPS:            'info',
  NO_ROUTES:           'info',
  OUT_OF_SERVICE:      'info',
  SERVER_ERROR:        'error',
  NETWORK_ERROR:       'error',
};

const useFindBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);       // error message string
  const [errorType, setErrorType] = useState(null); // 'info' | 'error' | null
  const [stats, setStats] = useState(null);

  const findBuses = useCallback(async (origin, destination, weights) => {
    // useCallback saves a function in memory so React doesn't recreate it on every render.
    // Without it, every re-render creates a new function object — causing unnecessary re-renders in children.
    // Empty [] means create once and never recreate.
    // With dependencies [x] — only recreate when x changes.

    // Frontend validation — catch obvious issues before hitting the server
    if (!origin?.lat || !origin?.lng) {
      setError(getErrorMessage('INVALID_ORIGIN'));
      setErrorType('error');
      return;
    }
    if (!destination?.lat || !destination?.lng) {
      setError(getErrorMessage('INVALID_DESTINATION'));
      setErrorType('error');
      return;
    }
    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setError('⚠️ Origin and destination cannot be the same place.');
      setErrorType('error');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      setBuses([]);
      setStats(null);

      // fetchData is used here (not fetchAPI) — it always returns the body
      // even on 404/400 so we can read the errorCode and show the right message.
      // see Api.js for why this distinction matters
      const response = await api.topsis.findBuses(origin, destination, weights);

      if (response.success) {
        // happy path — buses found and ranked
        setBuses(response.buses);
        setStats(response.stats);
      } else {
        // errorCode from backend maps to a specific human-readable message
        const code = response.errorCode || 'SERVER_ERROR';
        setError(getErrorMessage(code, response.message));
        setErrorType(ERROR_TYPES[code] || 'error');
      }

    } catch (err) {
      // only true network errors reach here — server completely unreachable
      // (fetchData only throws when fetch() itself throws, not on 4xx/5xx)
      console.error('Network error finding buses:', err);
      setError(getErrorMessage('NETWORK_ERROR'));
      setErrorType('error');
    } finally {
      setLoading(false);
    }

  }, []); // [] this empty [] for the useCallback means only calculate it once.

  const clearResults = useCallback(() => {
    setBuses([]);
    setError(null);
    setErrorType(null);
    setStats(null);
  }, []); // used later when doing another search to delete every bus results shown in the UI

  return { buses, loading, error, errorType, stats, findBuses, clearResults };
};

export default useFindBuses;