import React from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const Map = ({ 
  origin = { lat: 24.4539, lng: 54.3773 }, // Abu Dhabi coordinates
  destination = null,
  route = null,
  busStops = [],
  liveBusPositions = []
}) => {
  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const center = origin;

  const options = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
    fullscreenControl: true
  };

  // API Key - Replace with your actual key
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={options}
      >
        {/* Origin Marker */}
        <Marker 
          position={origin} 
          label="O"
          title="Origin"
        />

        {/* Destination Marker if exists */}
        {destination && (
          <Marker 
            position={destination} 
            label="D"
            title="Destination"
          />
        )}

        {/* Display route if available */}
        {route && <DirectionsRenderer directions={route} />}

        {/* Bus Stops */}
        {busStops.map((stop, index) => (
          <Marker
            key={index}
            position={stop.position}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/bus.png",
              scaledSize: new window.google.maps.Size(30, 30)
            }}
            title={stop.name}
          />
        ))}

        {/* Live Bus Positions */}
        {liveBusPositions.map((bus, index) => (
          <Marker
            key={`bus-${index}`}
            position={bus.position}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(40, 40)
            }}
            title={`Bus ${bus.id} - ${bus.route}`}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;