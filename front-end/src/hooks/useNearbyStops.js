/**
 * USE NEARBY STOPS HOOK
 * Fetches bus stops near origin AND destination
 * whenever the user selects a location
 */

import { useState, useEffect } from 'react';
import api from '../services/Api';

const useNearbyStops = (origin, destination, radiusKm = 0.8) => {
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Need at least origin to fetch stops
    if (!origin?.lat || !origin?.lng) {
      setNearbyStops([]);
      return;
    }

    const fetchStops = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetches = [];

        // Always fetch stops near origin
        fetches.push(
          api.busStops.getNearby(origin.lat, origin.lng, radiusKm)
        );

        // Also fetch stops near destination if available
        if (destination?.lat && destination?.lng) {
          fetches.push(
            api.busStops.getNearby(destination.lat, destination.lng, radiusKm)
          );
        }

        const results = await Promise.all(fetches);

        // Merge results and remove duplicates by stopId
        const allStops = new Map();
        for (const result of results) {
          if (result.success && result.data) {
            for (const stop of result.data) {
              allStops.set(stop.stopId, stop);
            }
          }
        }

        setNearbyStops(Array.from(allStops.values()));
        console.log(`📍 Found ${allStops.size} nearby stops`);

      } catch (err) {
        console.error('Error fetching nearby stops:', err);
        setError('Could not load nearby stops');
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return { nearbyStops, loading, error };
};

export default useNearbyStops;




































































































