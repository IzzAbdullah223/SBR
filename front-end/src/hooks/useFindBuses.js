/**
 
 * Custom hook for finding and ranking buses using TOPSIS
 * Calls: POST /api/find-buses
 * With: { origin: {lat, lng}, destination: {lat, lng}, weights: {...} }
 */

import { useState, useCallback } from 'react';
import api from '../services/Api';

const useFindBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  /**
   * Find and rank buses using TOPSIS
   * @param {Object} origin - { lat, lng }
   * @param {Object} destination - { lat, lng }
   * @param {Object} weights - { time, cost, walkingDistance, transfers } (sum to 1)
   */
  const findBuses = useCallback(async (origin, destination, weights) => {

    // Validate inputs
    if (!origin?.lat || !origin?.lng) {
      setError('Please select a valid origin location');
      return;
    }

    if (!destination?.lat || !destination?.lng) {
      setError('Please select a valid destination location');
      return;
    }

    if (!weights) {
      setError('Weights are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBuses([]);
      setStats(null);

      // Call POST /api/find-buses
      const response = await api.topsis.findBuses(origin, destination, weights);

      if (response.success) {
        setBuses(response.buses);
        setStats(response.stats);
      } else {
        setError(response.message || 'No buses found between these locations');
      }

    } catch (err) {
      console.error('Error finding buses:', err);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }

  }, []);

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setBuses([]);
    setError(null);
    setStats(null);
  }, []);

  return {
    buses,        // Ranked buses array from TOPSIS
    loading,      // Loading state
    error,        // Error message
    stats,        // { directRoutes, transferRoutes, totalBuses }
    findBuses,    // Call this to search
    clearResults, // Call this to reset
  };
};

export default useFindBuses;