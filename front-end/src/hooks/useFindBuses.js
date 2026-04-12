import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/Api';

// errorCode categories — used by Home.jsx to style the error box differently
// 'info'  = expected result, not a bug (no routes, out of service, no stops)
// 'error' = something actually went wrong (server error, network down)
export const ERROR_TYPES = {
  INVALID_ORIGIN:      'error',
  INVALID_DESTINATION: 'error',
  SAME_LOCATION:       'error',
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
  const { t } = useTranslation();

  const [buses,     setBuses]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [stats,     setStats]     = useState(null);

  // Maps backend errorCodes to translation keys
  // All errors now go through t() so they appear in the correct language
  const getErrorMessage = useCallback((errorCode, fallbackMessage) => {
    const keyMap = {
      INVALID_ORIGIN:      'errors.invalidOrigin',
      INVALID_DESTINATION: 'errors.invalidDestination',
      SAME_LOCATION:       'errors.sameLocation',
      NO_STOPS_BOTH:       'errors.noStopsBoth',
      NO_ORIGIN_STOPS:     'errors.noOriginStops',
      NO_DEST_STOPS:       'errors.noDestStops',
      NO_STOPS:            'errors.noStops',
      NO_ROUTES:           'errors.noRoutes',
      OUT_OF_SERVICE:      'errors.outOfService',
      SERVER_ERROR:        'errors.serverError',
      NETWORK_ERROR:       'errors.networkError',
    };
    const key = keyMap[errorCode];
    if (key) return t(key);
    return fallbackMessage || t('errors.serverError');
  }, [t]);

  // Point 4 fix: optimizationMode defaults to 'fastest'
  // so behaviour is always predictable if caller forgets to pass it
  const findBuses = useCallback(async (origin, destination, optimizationMode = 'fastest') => {

    // Frontend validation — fast UX checks before hitting the server
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

    // Frontend same-location check — exact equality for instant UX feedback
    // The backend also checks with a 50 metre threshold for robustness
    // so both layers protect against this case
    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setError(getErrorMessage('SAME_LOCATION'));
      setErrorType('error');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setErrorType(null);
      setBuses([]);
      setStats(null);

      const response = await api.topsis.findBuses(origin, destination, optimizationMode);

      if (response.success) {
        setBuses(response.buses);
        setStats(response.stats);
      } else {
        const code = response.errorCode || 'SERVER_ERROR';
        setError(getErrorMessage(code, response.message));
        setErrorType(ERROR_TYPES[code] || 'error');
      }

    } catch (err) {
      console.error('Network error finding buses:', err);
      setError(getErrorMessage('NETWORK_ERROR'));
      setErrorType('error');
    } finally {
      setLoading(false);
    }

  }, [getErrorMessage]);

  const clearResults = useCallback(() => {
    setBuses([]);
    setError(null);
    setErrorType(null);
    setStats(null);
  }, []);

  return { buses, loading, error, errorType, stats, findBuses, clearResults };
};

export default useFindBuses;