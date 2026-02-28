import React, { useState, useMemo } from 'react';
import MapComponent from '../Components/Map/Map';
import SearchInput from '../Components/SearchInput/SearchInput';
import WeightSliders from '../Components/WeightSliders/WeightSliders';
import BusResults from '../Components/BusResults/BusResults';
import { Search, Bus } from 'lucide-react';
import { MAP_CONFIG } from '../utils/constants';
import useFindBuses from '../hooks/useFindBuses';
import useShape from '../hooks/useShape';               // ✅ NEW
import useNearbyStops from '../hooks/useNearbyStops';   // ✅ NEW
import styles from './Home.module.css';

const Home = () => {
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);

  const [weights, setWeights] = useState({
    time: 0.25, cost: 0.25, walkingDistance: 0.25, transfers: 0.25,
  });

  const { buses, loading, error, findBuses, clearResults } = useFindBuses();

  // ✅ NEW: Fetch real route shape when user selects a bus
  const { shapeCoordinates, shapeCoordinatesLeg2 } = useShape(selectedBus);

  // ✅ NEW: Fetch nearby stops as soon as origin/destination are selected
  const { nearbyStops } = useNearbyStops(origin, destination, 0.8);

  const handleOriginChange = (e, locationData) => {
    setOriginInput(e.target.value);
    if (locationData?.lat && locationData?.lng) {
      setOrigin({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else {
      setOrigin(null);
    }
  };

  const handleDestinationChange = (e, locationData) => {
    setDestinationInput(e.target.value);
    if (locationData?.lat && locationData?.lng) {
      setDestination({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else {
      setDestination(null);
    }
  };

  const handleWeightChange = (normalizedWeights) => setWeights(normalizedWeights);

  const handleFindBuses = async () => {
    if (!origin || !destination) {
      alert('Please select both origin and destination from the dropdown');
      return;
    }
    setSelectedBus(null);
    clearResults();
    await findBuses(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
      weights
    );
  };

  // Auto-select top ranked bus
  React.useEffect(() => {
    if (buses?.length > 0 && !selectedBus) {
      setSelectedBus(buses[0]);
    }
  }, [buses]);

  const handleSelectBus = (bus) => setSelectedBus(bus);

  // ✅ NEW: Merge nearby stops with selected route stops for the map
  // Shows both nearby stops (context) AND stops on the selected route (highlighted)
  // ✅ useMemo prevents new array on every render (stops infinite loop)
  const mapStops = useMemo(() => {
    const stopMap = new Map();
    for (const stop of nearbyStops) {
      stopMap.set(stop.stopId, stop);
    }
    if (selectedBus) {
      if (selectedBus.originStop) stopMap.set(selectedBus.originStop.stopId, selectedBus.originStop);
      if (selectedBus.destinationStop) stopMap.set(selectedBus.destinationStop.stopId, selectedBus.destinationStop);
      if (selectedBus.transferStop) stopMap.set(selectedBus.transferStop.stopId, selectedBus.transferStop);
    }
    return Array.from(stopMap.values());
  }, [nearbyStops, selectedBus]);

  return (
    <div className={styles.container}>
      {/* ── Left Panel ── */}
      <div className={styles.leftPanel}>

        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerIcon}><Bus size={24} /></div>
            <h1>Smart <span>Bus</span> Planner</h1>
          </div>
          <div className={styles.headerBadge}>
            Dubai RTA • MCDM Route Recommendation
          </div>
        </div>

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

        <div className={styles.section}>
          <WeightSliders onWeightChange={handleWeightChange} />
        </div>

        <button
          className={`${styles.findButton} ${loading ? styles.loading : ''}`}
          onClick={handleFindBuses}
          disabled={!origin || !destination || loading}
        >
          <Search size={20} />
          <span>{loading ? 'Searching...' : 'Find Best Bus Routes'}</span>
        </button>

        {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

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

      {/* ── Right Panel - Map ── */}
      <div className={styles.rightPanel}>
        <MapComponent
          origin={origin || MAP_CONFIG.DEFAULT_CENTER}
          destination={destination}
          busStops={mapStops}
          selectedRoute={selectedBus}
          shapeCoordinates={shapeCoordinates}
          shapeCoordinatesLeg2={shapeCoordinatesLeg2}
          onStopClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Home;