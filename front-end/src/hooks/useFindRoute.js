/**
 * USE FIND ROUTE HOOK
 * Custom hook for finding routes between two stops
 */

import { useState, useCallback } from 'react';
import api from '../services/api';

const useFindRoute = () => {
  const [foundRoutes, setFoundRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findRoute = useCallback(async (fromStopId, toStopId) => {
    if (!fromStopId || !toStopId) {
      setError('Both origin and destination are required');
      return;
    }

    if (fromStopId === toStopId) {
      setError('Origin and destination cannot be the same');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFoundRoutes([]);

      const response = await api.routes.findRoute(fromStopId, toStopId);

      if (response.success) {
        setFoundRoutes(response.data);
      } else {
        setError(response.message || 'No route found');
      }
    } catch (err) {
      console.error('Error finding route:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setFoundRoutes([]);
    setError(null);
  }, []);

  return {
    foundRoutes,
    loading,
    error,
    findRoute,
    clearResults,
  };
};

export default useFindRoute;