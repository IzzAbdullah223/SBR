/**
 * MAP BOUNDS UPDATER COMPONENT
 * Handles automatic map bounds adjustment
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MapBoundsUpdater = ({ origin, destination }) => {
  const map = useMap();

  useEffect(() => {
    if (destination && origin) {
      // If both origin and destination exist, fit bounds to show both
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      // If only origin exists, center on it
      map.setView([origin.lat, origin.lng], 13);
    }
  }, [map, origin, destination]);

  return null;
};

export default MapBoundsUpdater;
