import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// ✅ FIXED: FitBounds now only fits on first shape load, not on every route switch.
//
// Old behavior: every time shapeCoordinates changed (i.e. every time the user
// clicked a different route card), the map re-fitted to the new shape. This made
// it look like origin/destination changed — the map jumped to wherever the new
// shape happened to start, pushing the origin/destination pins off-screen.
//
// Fix: use a ref to track whether we've already fitted. Only fit once when a shape
// first loads. After that the user can pan/zoom freely without the map jumping.
// The ref resets when shapeCoordinates goes null (new search), so it fits again
// for the next search result.
const FitBounds = ({ coordinates }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    // reset when coordinates are cleared (new search started)
    if (!coordinates || coordinates.length < 2) {
      hasFitted.current = false;
      return;
    }

    // only fit once per shape — don't re-fit when user switches route cards
    if (hasFitted.current) return;

    const latLngs = coordinates.map(c => [c.lat, c.lng]);
    map.fitBounds(latLngs, { padding: [40, 40] });
    hasFitted.current = true;
  }, [coordinates]);

  return null;
};

const MapView = ({
  origin,
  destination,
  userLocation,
  busStops = [],
  selectedRoute = null,
  shapeCoordinates = null,
  shapeCoordinatesLeg2 = null,
  onStopClick,
}) => {
  const isValidCoord = (val) => typeof val === 'number' && !isNaN(val);
  const hasValidOrigin = origin && isValidCoord(origin.lat) && isValidCoord(origin.lng);
  const hasValidDest = destination && isValidCoord(destination?.lat) && isValidCoord(destination?.lng);

  const center = hasValidOrigin
    ? [origin.lat, origin.lng]
    : [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];

  const routeColor = selectedRoute?.color || '#667eea';
  const leg2Color = '#00c9a7';

  const leg1Positions = shapeCoordinates?.length > 1
    ? shapeCoordinates.map(c => [c.lat, c.lng])
    : null;

  const leg2Positions = shapeCoordinatesLeg2?.length > 1
    ? shapeCoordinatesLeg2.map(c => [c.lat, c.lng])
    : null;

  const fallbackPositions = !leg1Positions && hasValidOrigin && hasValidDest
    ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
    : null;

  return (
    <MapContainer
      center={center}
      zoom={MAP_CONFIG.DEFAULT_ZOOM}
      className={styles.mapContainer}
      scrollWheelZoom={true}
      minZoom={MAP_CONFIG.MIN_ZOOM}
      maxZoom={MAP_CONFIG.MAX_ZOOM}
    >
      <TileLayer attribution={MAP_CONFIG.ATTRIBUTION} url={MAP_CONFIG.TILE_LAYER} />

      {hasValidOrigin && (
        <MapBoundsUpdater origin={origin} destination={destination} />
      )}

      {/* Fit map to shape — only on first load, not on every route switch */}
      {leg1Positions && <FitBounds coordinates={shapeCoordinates} />}

      {/* User Location */}
      {userLocation && isValidCoord(userLocation.lat) && isValidCoord(userLocation.lng) && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
          <Popup><div className={styles.popup}><strong>Your Location</strong></div></Popup>
        </Marker>
      )}

      {/* Origin */}
      {hasValidOrigin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className={styles.popup}>
              <strong>Origin</strong>
              <p>{origin.name || 'Starting point'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination */}
      {hasValidDest && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>
            <div className={styles.popup}>
              <strong>Destination</strong>
              <p>{destination.name || 'End point'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Leg 1 shape — real GTFS route */}
      {leg1Positions && (
        <Polyline positions={leg1Positions} color={routeColor} weight={5} opacity={0.85} />
      )}

      {/* Leg 2 shape — transfer route */}
      {leg2Positions && (
        <Polyline positions={leg2Positions} color={leg2Color} weight={5} opacity={0.85} />
      )}

      {/* Fallback dashed line */}
      {fallbackPositions && (
        <Polyline positions={fallbackPositions} color="#667eea" weight={3} opacity={0.5} dashArray="8,12" />
      )}

      {/* Bus Stop Markers */}
      {busStops.map((stop) => {
        if (!stop?.position || !isValidCoord(stop.position.lat) || !isValidCoord(stop.position.lng)) return null;

        const isOnRoute = selectedRoute?.stops?.some(s => s.stopId === stop.stopId)
          || selectedRoute?.originStop?.stopId === stop.stopId
          || selectedRoute?.destinationStop?.stopId === stop.stopId
          || selectedRoute?.transferStop?.stopId === stop.stopId;

        return (
          <Marker
            key={stop.stopId}
            position={[stop.position.lat, stop.position.lng]}
            icon={isOnRoute ? selectedBusStopIcon : busStopIcon}
            eventHandlers={{ click: () => onStopClick && onStopClick(stop) }}
          >
            <Popup>
              <div className={styles.popup}>
                <strong>{stop.name}</strong>
                <p className={styles.stopId}>ID: {stop.stopId}</p>
                {stop.routes?.length > 0 && (
                  <div className={styles.routes}>
                    <p><strong>Routes:</strong></p>
                    <div className={styles.routeBadges}>
                      {stop.routes.map(r => (
                        <span key={r} className={styles.routeBadge}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;