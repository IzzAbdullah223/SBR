/**
 * USE BUS STOPS HOOK
 * Custom hook for fetching and managing bus stops
 */

import { useState, useEffect } from 'react';
import api from '../services/Api';

const useBusStops = () => {
  const [busStops, setBusStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusStops();
  }, []);

  const fetchBusStops = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.busStops.getAll();

      if (response.success) {
        setBusStops(response.data);
      } else {
        throw new Error('Failed to fetch bus stops');
      }
    } catch (err) {
      console.error('Error fetching bus stops:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBusStopById = (stopId) => {
    return busStops.find(stop => stop.stopId === stopId);
  };

  const searchBusStops = (searchTerm) => {
    if (!searchTerm) return busStops;
    const term = searchTerm.toLowerCase();
    return busStops.filter(stop =>
      stop.name.toLowerCase().includes(term) ||
      stop.stopId.toLowerCase().includes(term)
    );
  };

  return {
    busStops,
    loading,
    error,
    refetch: fetchBusStops,
    getBusStopById,
    searchBusStops,
  };
};

export default useBusStops;