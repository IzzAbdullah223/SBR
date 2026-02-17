
import React, { useState } from 'react';
import Map from '../Components/Map/Map';
import SearchInput from '../Components/SearchInput/SearchInput';
import WeightSliders from '../Components/WeightSliders/WeightSliders';
import BusResults from '../Components/BusResults/BusResults';
import { Search, Bus } from 'lucide-react';
import { MAP_CONFIG } from '../utils/constants';
import api from '../services/api';           // ← ADDED: use Api.js not raw fetch
import useFindBuses from '../hooks/useFindBuses'; // ← ADDED: use the hook
import styles from './Home.module.css';

const Home = () => {
  // Search state
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  // ← FIXED: Default weights normalized (sum to 1.0, not 50,50,50,50)
  const [weights, setWeights] = useState({
    time: 0.25,
    cost: 0.25,
    walkingDistance: 0.25,
    transfers: 0.25,
  });

  // Selected bus for map display
  const [selectedBus, setSelectedBus] = useState(null);

  // ← ADDED: Use the hook instead of manual fetch
  const { buses, loading, error, findBuses, clearResults } = useFindBuses();

  // Handle origin selection from SearchInput
  const handleOriginChange = (e, locationData) => {
    setOriginInput(e.target.value);

    if (locationData && locationData.lat && locationData.lng) {
      setOrigin({
        lat: locationData.lat,
        lng: locationData.lng,
        name: e.target.value,
      });
    } else {
      // User is typing but hasn't selected yet - clear origin coords
      setOrigin(null);
    }
  };

  // Handle destination selection from SearchInput
  const handleDestinationChange = (e, locationData) => {
    setDestinationInput(e.target.value);

    if (locationData && locationData.lat && locationData.lng) {
      setDestination({
        lat: locationData.lat,
        lng: locationData.lng,
        name: e.target.value,
      });
    } else {
      setDestination(null);
    }
  };

  // ← FIXED: WeightSliders now sends full normalized object, not individual values
  const handleWeightChange = (normalizedWeights) => {
    setWeights(normalizedWeights);
  };

  // Find buses using TOPSIS
  const handleFindBuses = async () => {
    if (!origin || !destination) {
      alert('Please select both origin and destination from the dropdown');
      return;
    }

    setSelectedBus(null); // Clear previous selection
    clearResults();       // Clear previous results

    // ← FIXED: Uses useFindBuses hook instead of raw fetch
    await findBuses(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
      weights // Already normalized from WeightSliders
    );

    // Auto-select top bus after search
    // buses updates async so we handle this in useEffect below
  };

  // Auto-select top bus when results come in
  React.useEffect(() => {
    if (buses && buses.length > 0 && !selectedBus) {
      setSelectedBus(buses[0]);
    }
  }, [buses]);

  // Handle bus selection from results list
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
  };

  // Get bus stops to show on map
  // Shows origin + destination stops of selected bus
  const getMapStops = () => {
    if (!selectedBus) return [];

    const stops = [];

    if (selectedBus.originStop) {
      stops.push({
        stopId: selectedBus.originStop.stopId,
        name: selectedBus.originStop.name,
        position: selectedBus.originStop.position,
      });
    }

    if (selectedBus.destinationStop) {
      stops.push({
        stopId: selectedBus.destinationStop.stopId,
        name: selectedBus.destinationStop.name,
        position: selectedBus.destinationStop.position,
      });
    }

    // For transfer routes, add transfer stop too
    if (selectedBus.transferStop) {
      stops.push({
        stopId: selectedBus.transferStop.stopId,
        name: selectedBus.transferStop.name,
        position: selectedBus.transferStop.position,
      });
    }

    return stops;
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - Search & Preferences */}
      <div className={styles.leftPanel}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerIcon}>
              <Bus size={24} />
            </div>
            <h1>Smart <span>Bus</span> Planner</h1>
          </div>
          <div className={styles.headerBadge}>
            Dubai RTA • MCDM Route Recommendation
          </div>
        </div>

        {/* Search Section */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>📍 Where are you going?</p>

          <SearchInput
            label="Origin"
            placeholder="e.g., Dubai Mall, Gold Souk..."
            value={originInput}
            onChange={handleOriginChange}
          />

          <SearchInput
            label="Destination"
            placeholder="e.g., Mall of Emirates, Dubai Marina..."
            value={destinationInput}
            onChange={handleDestinationChange}
          />
        </div>

        {/* Weight Sliders */}
        <div className={styles.section}>
          <WeightSliders
            weights={weights}
            onWeightChange={handleWeightChange}
          />
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

        {/* ← ADDED: Show error in UI instead of alert */}
        {error && (
          <div className={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Results Section */}
        {(buses.length > 0 || loading) && (
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
          busStops={getMapStops()}   // ← FIXED: Passes proper stop objects
          selectedRoute={selectedBus}
          onStopClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Home;
