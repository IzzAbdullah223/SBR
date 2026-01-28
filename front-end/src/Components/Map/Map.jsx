import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup,  useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const originIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="35" height="45" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 0C10.6 0 5 5.6 5 12.5c0 8.8 12.5 27.5 12.5 27.5S30 21.3 30 12.5C30 5.6 24.4 0 17.5 0z" fill="#4CAF50" stroke="white" stroke-width="2"/>
      <circle cx="17.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [35, 45],
  iconAnchor: [17.5, 45],
  popupAnchor: [0, -45],
});

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="35" height="45" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 0C10.6 0 5 5.6 5 12.5c0 8.8 12.5 27.5 12.5 27.5S30 21.3 30 12.5C30 5.6 24.4 0 17.5 0z" fill="#F44336" stroke="white" stroke-width="2"/>
      <circle cx="17.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [35, 45],
  iconAnchor: [17.5, 45],
  popupAnchor: [0, -45],
});

const busStopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" fill="#4CAF50" stroke="white" stroke-width="2"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const busIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="12" fill="#FF5722" stroke="white" stroke-width="2"/>
      <text x="15" y="20" font-size="16" text-anchor="middle" fill="white">🚌</text>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="10" fill="#2196F3" stroke="white" stroke-width="3"/>
      <circle cx="15" cy="15" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Component to handle map bounds updates
function MapBoundsUpdater({ origin, destination, userLocation, defaultCenter }) {
  const map = useMap();

  React.useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 13);
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      map.setView([defaultCenter.lat, defaultCenter.lng], 13);
    }
  }, [map, origin, destination, userLocation, defaultCenter]);

  return null;
}

const Map = ({ defaultCenter, origin, destination, userLocation, busStops = [], liveBusPositions = [] }) => { 
  const center = useMemo(() => {
    if (origin && destination) {
      return [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2];
    }
    if (origin) {
      return [origin.lat, origin.lng];
    }
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    return [defaultCenter.lat, defaultCenter.lng];
  }, [origin, destination, userLocation, defaultCenter]);

  const routePath = useMemo(() => {
    return origin && destination 
      ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
      : [];
  }, [origin, destination]);

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      className={styles.mapContainer}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater 
        origin={origin} 
        destination={destination} 
        userLocation={userLocation}
        defaultCenter={defaultCenter}
      />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
          <Popup>
            <strong>Your Location</strong><br />
            Current position
          </Popup>
        </Marker>
      )}

      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <strong>Origin</strong><br />
            Starting point
          </Popup>
        </Marker>
      )}

      {destination && (
        <>
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <strong>Destination</strong><br />
              End point
            </Popup>
          </Marker>
        </>
      )}

      {busStops.map((stop, index) => (
        <Marker 
          key={`stop-${index}`} 
          position={[stop.position.lat, stop.position.lng]}
          icon={busStopIcon}
        >
          <Popup>
            <strong>Bus Stop</strong><br />
            {stop.name}
          </Popup>
        </Marker>
      ))}

      {liveBusPositions.map((bus, index) => (
        <Marker 
          key={`bus-${index}`} 
          position={[bus.position.lat, bus.position.lng]}
          icon={busIcon}
        >
          <Popup>
            <strong>Bus {bus.id}</strong><br />
            {bus.route}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;