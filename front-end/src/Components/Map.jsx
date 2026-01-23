import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Component to handle map bounds updates
function MapBoundsUpdater({ origin, destination }) {
  const map = useMap();

  React.useEffect(() => {
    if (destination) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([origin.lat, origin.lng], 13);
    }
  }, [map, origin, destination]);

  return null;
}

const Map = ({ origin, destination, busStops = [], liveBusPositions = [] }) => {
  // Validate origin prop
  if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#e5e7eb',
        color: '#6b7280'
      }}>
        Loading map...
      </div>
    );
  }

  const center = useMemo(() => {
    if (destination) {
      return [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2];
    }
    return [origin.lat, origin.lng];
  }, [origin, destination]);

  const routePath = useMemo(() => {
    return destination 
      ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
      : [];
  }, [origin, destination]);

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater origin={origin} destination={destination} />

      <Marker position={[origin.lat, origin.lng]}>
        <Popup>
          <strong>Origin</strong><br />
          Starting point
        </Popup>
      </Marker>

      {destination && (
        <>
          <Marker position={[destination.lat, destination.lng]}>
            <Popup>
              <strong>Destination</strong><br />
              End point
            </Popup>
          </Marker>

          <Polyline 
            positions={routePath} 
            color="blue" 
            weight={3} 
            opacity={0.7} 
          />
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