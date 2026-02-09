/**
 * HOME PAGE - MCDM BUS ROUTE PLANNER
 * Simple interface: Search → Set preferences → Get recommendations
 */

import React, { useState } from 'react';
import Map from '../Components/Map/Map';
import SearchInput from '../Components/SearchInput/SearchInput';
import WeightSliders from '../Components/WeightSliders/WeightSliders';
import BusResults from '../Components/BusResults/BusResults';
import { Bus, Search } from 'lucide-react';
import { MAP_CONFIG } from '../../utils/constants';
import styles from './Home.module.css';

const Home = () => {
  // Search state
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  // MCDM weights state (default: all equal)
  const [weights, setWeights] = useState({
    time: 50,
    cost: 50,
    walkingDistance: 50,
    transfers: 50,
  });

  // Results state
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Handle origin selection
  const handleOriginChange = (e, locationData) => {
    setOriginInput(e.target.value);
    
    if (locationData && locationData.lat && locationData.lng) {
      setOrigin({
        lat: locationData.lat,
        lng: locationData.lng,
        name: e.target.value,
      });
    }
  };

  // Handle destination selection
  const handleDestinationChange = (e, locationData) => {
    setDestinationInput(e.target.value);
    
    if (locationData && locationData.lat && locationData.lng) {
      setDestination({
        lat: locationData.lat,
        lng: locationData.lng,
        name: e.target.value,
      });
    }
  };

  // Handle weight changes
  const handleWeightChange = (criteriaId, value) => {
    setWeights(prev => ({
      ...prev,
      [criteriaId]: value,
    }));
  };

  // Find buses using TOPSIS
  const handleFindBuses = async () => {
    if (!origin || !destination) {
      alert('Please select both origin and destination');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch('http://localhost:3000/api/find-buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          weights: weights,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBuses(data.buses);
        if (data.buses.length > 0) {
          setSelectedBus(data.buses[0]); // Auto-select top recommendation
        }
      } else {
        alert(data.message || 'No buses found');
        setBuses([]);
      }
    } catch (error) {
      console.error('Error finding buses:', error);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Handle bus selection
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Search & Preferences */}
      <div className={styles.leftPanel}>
        {/* Header */}
        <div className={styles.header}>
          <h1>
            <Bus size={32} />
            Smart Bus Planner
          </h1>
          <p>MCDM-Based Route Recommendation</p>
        </div>

        {/* Search Section */}
        <div className={styles.section}>
          <h2>📍 Where are you going?</h2>
          
          <SearchInput
            label="Origin"
            placeholder="Enter starting location..."
            value={originInput}
            onChange={handleOriginChange}
          />

          <SearchInput
            label="Destination"
            placeholder="Enter destination..."
            value={destinationInput}
            onChange={handleDestinationChange}
          />
        </div>

        {/* Weight Sliders */}
        <div className={styles.section}>
          <WeightSliders weights={weights} onWeightChange={handleWeightChange} />
        </div>

        {/* Find Buses Button */}
        <button 
          className={styles.findButton}
          onClick={handleFindBuses}
          disabled={!origin || !destination || loading}
        >
          <Search size={20} />
          {loading ? 'Searching...' : 'Find Best Bus Routes'}
        </button>

        {/* Results Section */}
        {searched && (
          <div className={styles.section}>
            <BusResults 
              buses={buses}
              onSelectBus={handleSelectBus}
              selectedBus={selectedBus}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className={styles.rightPanel}>
        <Map
          origin={origin || MAP_CONFIG.DEFAULT_CENTER}
          destination={destination}
          busStops={selectedBus?.stops || []}
          selectedRoute={selectedBus}
          onStopClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Home;
