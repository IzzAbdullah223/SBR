/**
 * USE ROUTES HOOK
 * Custom hook for fetching and managing bus routes
 */

import { useState, useEffect } from 'react';
import api from '../services/Api'; 

const useRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.routes.getAll();

      if (response.success) {
        setRoutes(response.data);
      } else {
        throw new Error('Failed to fetch routes');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRouteByNumber = (routeNumber) => {
    return routes.find(route => route.routeNumber === routeNumber);
  };

  const getRoutesByType = (type) => {
    return routes.filter(route => route.type === type);
  };

  const searchRoutes = (searchTerm) => {
    if (!searchTerm) return routes;
    const term = searchTerm.toLowerCase();
    return routes.filter(route =>
      route.routeNumber.toLowerCase().includes(term) ||
      route.name.toLowerCase().includes(term)
    );
  };

  return {
    routes,
    loading,
    error,
    refetch: fetchRoutes,
    getRouteByNumber,
    getRoutesByType,
    searchRoutes,
  };
};

export default useRoutes;