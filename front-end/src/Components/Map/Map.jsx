import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  originIcon,
  destinationIcon,
  busStopIcon,
  selectedBusStopIcon,
  userLocationIcon,
} from '../../utils/mapIcons';
import { MAP_CONFIG } from '../../utils/constants';
import styles from './Map.module.css';

// SmartBounds — single source of truth for all map movement.
//
// Priority order:
//   1. Bus selected + shape(s) loaded → fit to ALL shape coordinates (both legs)
//   2. Bus selected but no shape yet → fit to origin+dest pins as placeholder
//   3. Origin/destination changed (new search) → fit to both pins
//   4. Only origin set → center on it
const SmartBounds = ({ origin, destination, shapeCoordinates, shapeCoordinatesLeg2, shapeKey }) => {
  const map = useMap();
  const lastShapeKey    = useRef(null);
  const lastFittedKey   = useRef(null);
  const lastOriginLat   = useRef(null);
  const lastOriginLng   = useRef(null);
  const lastDestLat     = useRef(null);
  const lastDestLng     = useRef(null);

  const fitToOriginDest = () => {
    if (!origin?.lat || !destination?.lat) return;
    map.fitBounds(
      L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]),
      { padding: [60, 60] }
    );
    lastOriginLat.current = origin.lat;
    lastOriginLng.current = origin.lng;
    lastDestLat.current   = destination.lat;
    lastDestLng.current   = destination.lng;
  };

  useEffect(() => {
    const leg1 = shapeCoordinates?.length > 1 ? shapeCoordinates : null;
    const leg2 = shapeCoordinatesLeg2?.length > 1 ? shapeCoordinatesLeg2 : null;
    const hasShape = leg1 || leg2;

    // Priority 1 — shape loaded (or updated) for the current bus
    // Fit to ALL coordinates across both legs so the whole route is visible
    if (hasShape && shapeKey !== lastShapeKey.current) {
      const allPoints = [
        ...(leg1 ? leg1.map(c => [c.lat, c.lng]) : []),
        ...(leg2 ? leg2.map(c => [c.lat, c.lng]) : []),
      ];
      map.fitBounds(allPoints, { padding: [50, 50] });
      lastShapeKey.current  = shapeKey;
      lastFittedKey.current = shapeKey;
      return;
    }

    // Priority 2 — bus just changed but shape hasn't loaded yet
    // Show origin+dest immediately as a placeholder while shape loads
    if (shapeKey && shapeKey !== lastFittedKey.current) {
      fitToOriginDest();
      lastFittedKey.current = shapeKey;
      return;
    }

    // Priority 3 — origin or destination changed (new search, no bus selected yet)
    const originChanged = origin?.lat !== lastOriginLat.current || origin?.lng !== lastOriginLng.current;
    const destChanged   = destination?.lat !== lastDestLat.current || destination?.lng !== lastDestLng.current;

    if (origin?.lat && destination?.lat && (originChanged || destChanged)) {
      fitToOriginDest();
      return;
    }

    // Priority 4 — only origin set
    if (origin?.lat && originChanged && !destination?.lat) {
      map.setView([origin.lat, origin.lng], 13);
      lastOriginLat.current = origin.lat;
      lastOriginLng.current = origin.lng;
    }
  }, [shapeCoordinates, shapeCoordinatesLeg2, shapeKey, origin, destination]);

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
  theme = 'light',
}) => {
  const isValidCoord = (val) => typeof val === 'number' && !isNaN(val);
  const hasValidOrigin = origin && isValidCoord(origin.lat) && isValidCoord(origin.lng);
  const hasValidDest   = destination && isValidCoord(destination?.lat) && isValidCoord(destination?.lng);

  const center = hasValidOrigin
    ? [origin.lat, origin.lng]
    : [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];

  const routeColor = selectedRoute?.color || '#667eea';
  const leg2Color  = '#00c9a7';

  // shapeKey = busId of selected route — SmartBounds moves the map ONLY when this changes
  const shapeKey = selectedRoute?.busId || null;

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
      <TileLayer
        attribution={MAP_CONFIG.ATTRIBUTION}
        url={MAP_CONFIG.TILE_LAYER}
      />

      {/* Unified map bounds controller — single source of truth for all map movement */}
      <SmartBounds
        origin={origin}
        destination={destination}
        shapeCoordinates={shapeCoordinates}
        shapeCoordinatesLeg2={shapeCoordinatesLeg2}
        shapeKey={shapeKey}
      />

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

      {/* Leg 1 — shadow then coloured line so it pops off the map */}
      {leg1Positions && (
        <>
          <Polyline positions={leg1Positions} color="#000000" weight={7} opacity={0.15} />
          <Polyline positions={leg1Positions} color={routeColor} weight={4} opacity={0.9} />
        </>
      )}

      {/* Leg 2 — transfer route second leg in teal */}
      {leg2Positions && (
        <>
          <Polyline positions={leg2Positions} color="#000000" weight={7} opacity={0.15} />
          <Polyline positions={leg2Positions} color={leg2Color} weight={4} opacity={0.9} />
        </>
      )}

      {/* Fallback dashed line when no shape data */}
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