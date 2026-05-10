import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import {
  originIcon, destinationIcon,
  busStopIcon, selectedBusStopIcon,
  originStopIcon, transferStopIcon, destinationStopIcon,
  userLocationIcon,
} from '../../utils/mapIcons';
import { MAP_CONFIG } from '../../utils/constants';
import BusStopCard from '../BusStopCard/BusStopCard';
import styles from './Map.module.css';

const DUBAI_BOUNDS = { minLat: 24.7, maxLat: 25.4, minLng: 54.9, maxLng: 55.6 };

const isInDubai = (lat, lng) =>
  lat >= DUBAI_BOUNDS.minLat && lat <= DUBAI_BOUNDS.maxLat &&
  lng >= DUBAI_BOUNDS.minLng && lng <= DUBAI_BOUNDS.maxLng;

// Replaces MapInvalidator — uses ResizeObserver so invalidateSize fires
// exactly when the container gains real dimensions, not after an arbitrary timeout.
const MapResizeObserver = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    // Fix immediately on mount (handles cases where container is already visible)
    map.invalidateSize({ animate: false });

    // Then watch for actual layout changes (visibility toggle, orientation change, etc.)
    const ro = new ResizeObserver(() => {
      const { offsetWidth: w, offsetHeight: h } = container;
      if (w > 0 && h > 0) {
        map.invalidateSize({ animate: false });
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  return null;
};

const SmartBounds = ({ origin, destination, selectedRoute, shapeCoordinates, shapeCoordinatesLeg2, shapeKey }) => {
  const map = useMap();
  const lastShapeKey  = useRef(null);
  const lastOriginLat = useRef(null);
  const lastOriginLng = useRef(null);
  const lastDestLat   = useRef(null);
  const lastDestLng   = useRef(null);

  useEffect(() => {
    if (origin?.lat && destination?.lat && origin.lat === destination.lat && origin.lng === destination.lng) return;

    if (selectedRoute && shapeKey && shapeKey !== lastShapeKey.current) {
      lastShapeKey.current = shapeKey;
      const points = [];
      if (shapeCoordinates?.length > 1)     shapeCoordinates.forEach(c => points.push([c.lat, c.lng]));
      if (shapeCoordinatesLeg2?.length > 1) shapeCoordinatesLeg2.forEach(c => points.push([c.lat, c.lng]));
      if (selectedRoute.originStop?.position)      points.push([selectedRoute.originStop.position.lat, selectedRoute.originStop.position.lng]);
      if (selectedRoute.journeyType === 'transfer' && selectedRoute.transferStop?.position) points.push([selectedRoute.transferStop.position.lat, selectedRoute.transferStop.position.lng]);
      if (selectedRoute.destinationStop?.position) points.push([selectedRoute.destinationStop.position.lat, selectedRoute.destinationStop.position.lng]);
      if (points.length >= 2) { map.fitBounds(points, { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60], maxZoom: 15 }); return; }
      if (origin?.lat && destination?.lat) map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60] });
      return;
    }

    if (selectedRoute && shapeKey === lastShapeKey.current) {
      const hasShape = shapeCoordinates?.length > 1 || shapeCoordinatesLeg2?.length > 1;
      if (hasShape) {
        const points = [];
        if (shapeCoordinates?.length > 1)     shapeCoordinates.forEach(c => points.push([c.lat, c.lng]));
        if (shapeCoordinatesLeg2?.length > 1) shapeCoordinatesLeg2.forEach(c => points.push([c.lat, c.lng]));
        if (selectedRoute.originStop?.position)      points.push([selectedRoute.originStop.position.lat, selectedRoute.originStop.position.lng]);
        if (selectedRoute.journeyType === 'transfer' && selectedRoute.transferStop?.position) points.push([selectedRoute.transferStop.position.lat, selectedRoute.transferStop.position.lng]);
        if (selectedRoute.destinationStop?.position) points.push([selectedRoute.destinationStop.position.lat, selectedRoute.destinationStop.position.lng]);
        if (points.length >= 2) map.fitBounds(points, { paddingTopLeft: [60, 60], paddingBottomRight: [60, 60], maxZoom: 15 });
      }
      return;
    }

    const originChanged = origin?.lat !== lastOriginLat.current || origin?.lng !== lastOriginLng.current;
    const destChanged   = destination?.lat !== lastDestLat.current || destination?.lng !== lastDestLng.current;

    if (origin?.lat && destination?.lat && (originChanged || destChanged)) {
      map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { paddingTopLeft: [80, 80], paddingBottomRight: [80, 80] });
      lastOriginLat.current = origin.lat; lastOriginLng.current = origin.lng;
      lastDestLat.current   = destination.lat; lastDestLng.current = destination.lng;
      return;
    }

    if (origin?.lat && originChanged && !destination?.lat) {
      map.setView([origin.lat, origin.lng], 13);
      lastOriginLat.current = origin.lat; lastOriginLng.current = origin.lng;
    }
  }, [selectedRoute, shapeKey, shapeCoordinates, shapeCoordinatesLeg2, origin, destination]);

  return null;
};

const LocateButton = ({ onLocate, onError }) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) { onError('Location services are not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);
        if (!isInDubai(lat, lng)) { onError('You appear to be outside Dubai. Location tracking requires you to be in Dubai.'); return; }
        map.setView([lat, lng], 15);
        onLocate({ lat, lng });
      },
      (err) => {
        setLocating(false);
        onError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Please enable location access in your browser settings.'
          : 'Unable to get your location. Please try again.');
      },
      { timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <div className={styles.locateBtn} onClick={handleLocate} title="Find my location">
      {locating
        ? <div className={styles.locateSpinner} />
        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" strokeWidth="1.5" strokeDasharray="2 3"/>
          </svg>
      }
    </div>
  );
};

const MapView = ({
  origin, destination, busStops = [],
  selectedRoute = null, shapeCoordinates = null, shapeCoordinatesLeg2 = null,
  selectedStop = null, loadingStop = false,
  onStopClick, onStopClose, isFavorite, onAddFavorite, onRemoveFavorite,
  onSetAsOrigin, onSetAsDestination, user, theme = 'light',
}) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const [userLocation, setUserLocation]   = useState(null);
  const [locationError, setLocationError] = useState(null);

  const isValidCoord   = (val) => typeof val === 'number' && !isNaN(val);
  const hasValidOrigin = origin && isValidCoord(origin.lat) && isValidCoord(origin.lng);
  const hasValidDest   = destination && isValidCoord(destination?.lat) && isValidCoord(destination?.lng);
  const center         = hasValidOrigin ? [origin.lat, origin.lng] : [MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng];
  const routeColor     = selectedRoute?.color || '#667eea';
  const leg2Color      = '#00c9a7';
  const shapeKey       = selectedRoute?.busId || null;

  const leg1Positions     = shapeCoordinates?.length > 1     ? shapeCoordinates.map(c => [c.lat, c.lng])     : null;
  const leg2Positions     = shapeCoordinatesLeg2?.length > 1 ? shapeCoordinatesLeg2.map(c => [c.lat, c.lng]) : null;
  const fallbackPositions = !leg1Positions && hasValidOrigin && hasValidDest
    ? [[origin.lat, origin.lng], [destination.lat, destination.lng]] : null;

  const getStopIcon = (stop) => {
    if (selectedStop?.stopId === stop.stopId)                   return selectedBusStopIcon;
    if (selectedRoute?.originStop?.stopId      === stop.stopId) return originStopIcon;
    if (selectedRoute?.transferStop?.stopId    === stop.stopId) return transferStopIcon;
    if (selectedRoute?.destinationStop?.stopId === stop.stopId) return destinationStopIcon;
    return busStopIcon;
  };

  const showLegend = selectedRoute && busStops.length > 0;

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={center}
        zoom={MAP_CONFIG.DEFAULT_ZOOM}
        className={styles.mapContainer}
        scrollWheelZoom={true}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        preferCanvas={true}
        ref={mapRef}
      >
        {/* ResizeObserver-based invalidator — fires at the exact moment
            the container gains real dimensions, not after a blind timeout */}
        <MapResizeObserver />

        <TileLayer
          attribution={MAP_CONFIG.ATTRIBUTION}
          url={MAP_CONFIG.TILE_LAYER}
          keepBuffer={4}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />

        <SmartBounds
          origin={origin} destination={destination}
          selectedRoute={selectedRoute}
          shapeCoordinates={shapeCoordinates} shapeCoordinatesLeg2={shapeCoordinatesLeg2}
          shapeKey={shapeKey}
        />

        <LocateButton
          onLocate={(coords) => { setUserLocation(coords); setLocationError(null); }}
          onError={(msg) => { setLocationError(msg); setTimeout(() => setLocationError(null), 3000); }}
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup><div className={styles.popup}><strong>{t('map.yourLocation')}</strong></div></Popup>
          </Marker>
        )}

        {hasValidOrigin && !selectedRoute && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup><div className={styles.popup}><strong>{t('map.origin')}</strong><p>{origin.name || t('map.startingPoint')}</p></div></Popup>
          </Marker>
        )}

        {hasValidDest && !selectedRoute && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup><div className={styles.popup}><strong>{t('map.destination')}</strong><p>{destination.name || t('map.endPoint')}</p></div></Popup>
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
          return (
            <Marker
              key={stop.stopId}
              position={[stop.position.lat, stop.position.lng]}
              icon={getStopIcon(stop)}
              eventHandlers={{ click: () => onStopClick && onStopClick(stop) }}
            />
          );
        })}
      </MapContainer>

      {locationError && (
        <div className={styles.locationError} onClick={() => setLocationError(null)}>
          {locationError}
        </div>
      )}

      {showLegend && (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#4CAF50' }} />
            <span>{t('map.board')}</span>
          </div>
          {selectedRoute.journeyType === 'transfer' && (
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f0a500' }} />
              <span>{t('map.transfer')}</span>
            </div>
          )}
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#F44336' }} />
            <span>{t('map.arrive')}</span>
          </div>
        </div>
      )}

      {selectedStop && (
        <BusStopCard
          stop={selectedStop} loadingStop={loadingStop} onClose={onStopClose}
          isFavorite={isFavorite ? isFavorite(selectedStop.stopId) : false}
          onAddFavorite={onAddFavorite} onRemoveFavorite={onRemoveFavorite}
          onSetAsOrigin={onSetAsOrigin} onSetAsDestination={onSetAsDestination}
          user={user}
        />
      )}
    </div>
  );
};

export default MapView;