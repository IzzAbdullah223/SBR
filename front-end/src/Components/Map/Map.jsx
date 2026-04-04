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

const SmartBounds = ({ origin, destination, shapeCoordinates, shapeCoordinatesLeg2, shapeKey }) => {
  const map = useMap();
  const lastShapeKey  = useRef(null);
  const lastFittedKey = useRef(null);
  const lastOriginLat = useRef(null);
  const lastOriginLng = useRef(null);
  const lastDestLat   = useRef(null);
  const lastDestLng   = useRef(null);

  const fitToOriginDest = () => {
    if (!origin?.lat || !destination?.lat) return;
    map.fitBounds(
      L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]),
      { paddingTopLeft: [80, 80], paddingBottomRight: [80, 80] }
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

    if (hasShape && shapeKey !== lastShapeKey.current) {
      const allPoints = [
        ...(leg1 ? leg1.map(c => [c.lat, c.lng]) : []),
        ...(leg2 ? leg2.map(c => [c.lat, c.lng]) : []),
      ];
      map.fitBounds(allPoints, { paddingTopLeft: [80, 80], paddingBottomRight: [80, 80] });
      lastShapeKey.current  = shapeKey;
      lastFittedKey.current = shapeKey;
      return;
    }

    if (shapeKey && shapeKey !== lastFittedKey.current) {
      fitToOriginDest();
      lastFittedKey.current = shapeKey;
      return;
    }

    const originChanged = origin?.lat !== lastOriginLat.current || origin?.lng !== lastOriginLng.current;
    const destChanged   = destination?.lat !== lastDestLat.current || destination?.lng !== lastDestLng.current;

    if (origin?.lat && destination?.lat && (originChanged || destChanged)) {
      fitToOriginDest();
      return;
    }

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
  selectedStop = null,
  loadingStop = false,
  onStopClick,
  onStopClose,
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
          <Polyline positions={fallbackPositions} color="#667eea" weight={3} opacity={0.5} dashArray="8,12" />
        )}

        {busStops.map((stop) => {
          if (!stop?.position || !isValidCoord(stop.position.lat) || !isValidCoord(stop.position.lng)) return null;

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
        />
      )}
    </div>
  );
};

export default MapView;