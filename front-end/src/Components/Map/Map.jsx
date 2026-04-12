import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import {
  originIcon,
  destinationIcon,
  busStopIcon,
  selectedBusStopIcon,
  userLocationIcon,
} from '../../utils/mapIcons';
import { MAP_CONFIG } from '../../utils/constants';
import BusStopCard from '../BusStopCard/BusStopCard';
import styles from './Map.module.css';

// ─── SmartBounds ─────────────────────────────────────────────────────────────
//
// When a bus is selected, fits the map to show EVERYTHING at once:
//   - The full shape polyline (leg1 + leg2)
//   - The origin bus stop marker
//   - The transfer bus stop marker (if transfer route)
//   - The destination bus stop marker
//
// When no bus is selected:
//   - Both origin + destination typed → fit to those two points
//   - Only origin typed → center on it at zoom 13
//
// GUARDS:
//   - If origin === destination (same coords) → do NOT move the map.
//     The search already shows an error. Moving the map would be confusing.

const SmartBounds = ({
  origin,
  destination,
  selectedRoute,
  shapeCoordinates,
  shapeCoordinatesLeg2,
  shapeKey,
}) => {
  const map = useMap();
  const lastShapeKey  = useRef(null);
  const lastOriginLat = useRef(null);
  const lastOriginLng = useRef(null);
  const lastDestLat   = useRef(null);
  const lastDestLng   = useRef(null);

  useEffect(() => {

    // ✅ GUARD: same location entered for both origin and destination
    // useFindBuses already blocks the search and shows an error.
    // The map must NOT react — stay exactly where it is.
    if (
      origin?.lat && destination?.lat &&
      origin.lat === destination.lat &&
      origin.lng === destination.lng
    ) return;

    // ── Case 1: bus selected → fit to shape + all key stops ───────────────
    if (selectedRoute && shapeKey && shapeKey !== lastShapeKey.current) {
      lastShapeKey.current = shapeKey;

      const points = [];

      // Add ALL shape polyline points (leg 1)
      if (shapeCoordinates?.length > 1) {
        shapeCoordinates.forEach(c => points.push([c.lat, c.lng]));
      }

      // Add ALL shape polyline points (leg 2 — transfer routes)
      if (shapeCoordinatesLeg2?.length > 1) {
        shapeCoordinatesLeg2.forEach(c => points.push([c.lat, c.lng]));
      }

      // Add key stop markers so they are never cut off by the panel
      if (selectedRoute.originStop?.position) {
        points.push([
          selectedRoute.originStop.position.lat,
          selectedRoute.originStop.position.lng,
        ]);
      }
      if (selectedRoute.journeyType === 'transfer' && selectedRoute.transferStop?.position) {
        points.push([
          selectedRoute.transferStop.position.lat,
          selectedRoute.transferStop.position.lng,
        ]);
      }
      if (selectedRoute.destinationStop?.position) {
        points.push([
          selectedRoute.destinationStop.position.lat,
          selectedRoute.destinationStop.position.lng,
        ]);
      }

      if (points.length >= 2) {
        map.fitBounds(points, {
          paddingTopLeft:     [60, 60],
          paddingBottomRight: [60, 60],
          maxZoom: 15,
        });
        return;
      }

      // Fallback if stop positions are missing
      if (origin?.lat && destination?.lat) {
        map.fitBounds(
          [[origin.lat, origin.lng], [destination.lat, destination.lng]],
          { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60] }
        );
      }
      return;
    }

    // ── Case 1b: same bus, shape just finished loading → re-fit ───────────
    if (selectedRoute && shapeKey === lastShapeKey.current) {
      const hasShape = shapeCoordinates?.length > 1 || shapeCoordinatesLeg2?.length > 1;
      if (hasShape) {
        const points = [];

        if (shapeCoordinates?.length > 1) {
          shapeCoordinates.forEach(c => points.push([c.lat, c.lng]));
        }
        if (shapeCoordinatesLeg2?.length > 1) {
          shapeCoordinatesLeg2.forEach(c => points.push([c.lat, c.lng]));
        }
        if (selectedRoute.originStop?.position) {
          points.push([
            selectedRoute.originStop.position.lat,
            selectedRoute.originStop.position.lng,
          ]);
        }
        if (selectedRoute.journeyType === 'transfer' && selectedRoute.transferStop?.position) {
          points.push([
            selectedRoute.transferStop.position.lat,
            selectedRoute.transferStop.position.lng,
          ]);
        }
        if (selectedRoute.destinationStop?.position) {
          points.push([
            selectedRoute.destinationStop.position.lat,
            selectedRoute.destinationStop.position.lng,
          ]);
        }

        if (points.length >= 2) {
          map.fitBounds(points, {
            paddingTopLeft:     [60, 60],
            paddingBottomRight: [60, 60],
            maxZoom: 15,
          });
        }
      }
      return;
    }

    // ── Case 2: no bus selected, both origin + destination typed ───────────
    const originChanged =
      origin?.lat !== lastOriginLat.current ||
      origin?.lng !== lastOriginLng.current;
    const destChanged =
      destination?.lat !== lastDestLat.current ||
      destination?.lng !== lastDestLng.current;

    if (origin?.lat && destination?.lat && (originChanged || destChanged)) {
      map.fitBounds(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { paddingTopLeft: [80, 80], paddingBottomRight: [80, 80] }
      );
      lastOriginLat.current = origin.lat;
      lastOriginLng.current = origin.lng;
      lastDestLat.current   = destination.lat;
      lastDestLng.current   = destination.lng;
      return;
    }

    // ── Case 3: only origin typed → center on it ───────────────────────────
    if (origin?.lat && originChanged && !destination?.lat) {
      map.setView([origin.lat, origin.lng], 13);
      lastOriginLat.current = origin.lat;
      lastOriginLng.current = origin.lng;
    }

  }, [selectedRoute, shapeKey, shapeCoordinates, shapeCoordinatesLeg2, origin, destination]);

  return null;
};

// ─── MapView ──────────────────────────────────────────────────────────────────
const MapView = ({
  origin,
  destination,
  userLocation,
  busStops = [],
  selectedRoute = null,
  shapeCoordinates = null,
  shapeCoordinatesLeg2 = null,
  selectedStop = null,
  loadingStop = false,
  onStopClick,
  onStopClose,
  isFavorite,
  onAddFavorite,
  onRemoveFavorite,
  onSetAsOrigin,
  onSetAsDestination,
  user,
  theme = 'light',
}) => {
  const { t } = useTranslation();

  const isValidCoord = (val) => typeof val === 'number' && !isNaN(val);
  const hasValidOrigin = origin && isValidCoord(origin.lat) && isValidCoord(origin.lng);
  const hasValidDest   = destination && isValidCoord(destination?.lat) && isValidCoord(destination?.lng);

  const center = hasValidOrigin
    ? [origin.lat, origin.lng]
    : [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];

  const routeColor = selectedRoute?.color || '#667eea';
  const leg2Color  = '#00c9a7';
  const shapeKey   = selectedRoute?.busId || null;

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
    <div className={styles.mapWrapper}>
      <MapContainer
        center={center}
        zoom={MAP_CONFIG.DEFAULT_ZOOM}
        className={styles.mapContainer}
        scrollWheelZoom={true}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
      >
        <TileLayer attribution={MAP_CONFIG.ATTRIBUTION} url={MAP_CONFIG.TILE_LAYER} />

        <SmartBounds
          origin={origin}
          destination={destination}
          selectedRoute={selectedRoute}
          shapeCoordinates={shapeCoordinates}
          shapeCoordinatesLeg2={shapeCoordinatesLeg2}
          shapeKey={shapeKey}
        />

        {userLocation && isValidCoord(userLocation.lat) && isValidCoord(userLocation.lng) && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className={styles.popup}>
                <strong>{t('map.yourLocation')}</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {hasValidOrigin && !selectedRoute && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className={styles.popup}>
                <strong>{t('map.origin')}</strong>
                <p>{origin.name || t('map.startingPoint')}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {hasValidDest && !selectedRoute && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className={styles.popup}>
                <strong>{t('map.destination')}</strong>
                <p>{destination.name || t('map.endPoint')}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {leg1Positions && (
          <>
            <Polyline positions={leg1Positions} color="#000000" weight={7} opacity={0.15} />
            <Polyline positions={leg1Positions} color={routeColor} weight={4} opacity={0.9} />
          </>
        )}

        {leg2Positions && (
          <>
            <Polyline positions={leg2Positions} color="#000000" weight={7} opacity={0.15} />
            <Polyline positions={leg2Positions} color={leg2Color} weight={4} opacity={0.9} />
          </>
        )}

        {fallbackPositions && (
          <Polyline
            positions={fallbackPositions}
            color="#667eea"
            weight={3}
            opacity={0.5}
            dashArray="8,12"
          />
        )}

        {busStops.map((stop) => {
          if (
            !stop?.position ||
            !isValidCoord(stop.position.lat) ||
            !isValidCoord(stop.position.lng)
          ) return null;

          const isSelected = selectedStop?.stopId === stop.stopId;
          const isOnRoute  =
            selectedRoute?.stops?.some(s => s.stopId === stop.stopId) ||
            selectedRoute?.originStop?.stopId      === stop.stopId ||
            selectedRoute?.destinationStop?.stopId === stop.stopId ||
            selectedRoute?.transferStop?.stopId    === stop.stopId;

          return (
            <Marker
              key={stop.stopId}
              position={[stop.position.lat, stop.position.lng]}
              icon={isSelected || isOnRoute ? selectedBusStopIcon : busStopIcon}
              eventHandlers={{
                click: () => onStopClick && onStopClick(stop),
              }}
            />
          );
        })}
      </MapContainer>

      {selectedStop && (
        <BusStopCard
          stop={selectedStop}
          loadingStop={loadingStop}
          onClose={onStopClose}
          isFavorite={isFavorite ? isFavorite(selectedStop.stopId) : false}
          onAddFavorite={onAddFavorite}
          onRemoveFavorite={onRemoveFavorite}
          onSetAsOrigin={onSetAsOrigin}
          onSetAsDestination={onSetAsDestination}
          user={user}
        />
      )}
    </div>
  );
};

export default MapView;