/**
 * MAP COMPONENT
 * Clean map display with bus stops and routes
 * UI ONLY - No business logic
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapBoundsUpdater from './MapBoundsUpdater';
import {
  originIcon,
  destinationIcon,
  busStopIcon,
  selectedBusStopIcon,
  userLocationIcon,
} from '../../utils/mapIcons';
import { MAP_CONFIG } from '../../utils/constants';
import styles from './Map.module.css';

const Map = ({
  origin,
  destination,
  userLocation,
  busStops = [],
  selectedRoute = null,
  onStopClick,
}) => {
  // Show loading if no origin
  if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading map...</p>
      </div>
    );
  }

  // Calculate center point
  const center = destination
    ? [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2]
    : [origin.lat, origin.lng];

  // Calculate route path
  const routePath = destination
    ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
    : [];

  // Get selected route coordinates
  const getRouteCoordinates = () => {
    if (!selectedRoute || !selectedRoute.stops) return [];

    return selectedRoute.stops
      .map(stop => {
        const busStop = busStops.find(bs => bs.stopId === stop.stopId);
        if (!busStop || !busStop.position) return null;
        return [busStop.position.lat, busStop.position.lng];
      })
      .filter(coord => coord !== null);
  };

  return (
    <MapContainer
      center={center}
      zoom={MAP_CONFIG.DEFAULT_ZOOM}
      className={styles.mapContainer}
      scrollWheelZoom={true}
      minZoom={MAP_CONFIG.MIN_ZOOM}
      maxZoom={MAP_CONFIG.MAX_ZOOM}
    >
      {/* Base Map Tiles */}
      <TileLayer
        attribution={MAP_CONFIG.ATTRIBUTION}
        url={MAP_CONFIG.TILE_LAYER}
      />

      {/* Auto-adjust bounds */}
      <MapBoundsUpdater origin={origin} destination={destination} />

      {/* User Location Marker */}
      {userLocation && userLocation.lat && userLocation.lng && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
          <Popup>
            <div className={styles.popup}>
              <strong>Your Location</strong>
              <p>Current position</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Origin Marker */}
      <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
        <Popup>
          <div className={styles.popup}>
            <strong>Origin</strong>
            <p>Starting point</p>
          </div>
        </Popup>
      </Marker>

      {/* Destination Marker */}
      {destination && destination.lat && destination.lng && (
        <>
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className={styles.popup}>
                <strong>Destination</strong>
                <p>End point</p>
              </div>
            </Popup>
          </Marker>

          {/* Direct path line */}
          <Polyline
            positions={routePath}
            color="#667eea"
            weight={3}
            opacity={0.5}
            dashArray="5, 10"
          />
        </>
      )}

      {/* Bus Stop Markers */}
      {busStops && busStops.length > 0 && busStops.map((stop) => {
        // Safety check - skip stops without valid position
        if (!stop || !stop.position || typeof stop.position.lat !== 'number' || typeof stop.position.lng !== 'number') {
          return null;
        }

        const isOnSelectedRoute = selectedRoute?.stops?.some(s => s.stopId === stop.stopId);
        const icon = isOnSelectedRoute ? selectedBusStopIcon : busStopIcon;

        return (
          <Marker
            key={stop.stopId}
            position={[stop.position.lat, stop.position.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onStopClick && onStopClick(stop),
            }}
          >
            <Popup>
              <div className={styles.popup}>
                <strong>{stop.name}</strong>
                <p className={styles.stopId}>ID: {stop.stopId}</p>
                {stop.routes && stop.routes.length > 0 && (
                  <div className={styles.routes}>
                    <p><strong>Routes:</strong></p>
                    <div className={styles.routeBadges}>
                      {stop.routes.map(route => (
                        <span key={route} className={styles.routeBadge}>
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Selected Route Polyline */}
      {selectedRoute && getRouteCoordinates().length > 0 && (
        <Polyline
          positions={getRouteCoordinates()}
          color={selectedRoute.color}
          weight={4}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
};

export default Map;
