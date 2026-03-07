import React, { useState, useMemo, useEffect } from 'react';
import MapComponent from '../../Components/Map/Map';
import SearchInput from '../../Components/SearchInput/SearchInput';
import WeightSliders from '../../Components/WeightSliders/WeightSliders';
import BusResults from '../../Components/BusResults/BusResults';
import { Search } from 'lucide-react';
import { MAP_CONFIG } from '../../utils/constants';
import useFindBuses from '../../hooks/useFindBuses';
import useShape from '../../hooks/useShape';
import useNearbyStops from '../../hooks/useNearbyStops';
import Navbar from '../../Components/NavBar/Navbar';
import Modal from '../../Components/Modal/Modal';
import { SignUp } from '../Authentication/SignUp/SignUp';
import { Login } from '../Authentication/Login/Login';
import styles from './Home.module.css';

const Home = () => {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [weights, setWeights] = useState({
    time: 0.25, cost: 0.25, walkingDistance: 0.25, transfers: 0.25,
  });

  const { buses, loading, error, findBuses, clearResults } = useFindBuses();
  const { shapeCoordinates, shapeCoordinatesLeg2 } = useShape(selectedBus);
  const { nearbyStops } = useNearbyStops(origin, destination, 0.8);

  // ── RESTORE USER ON PAGE REFRESH ──────────────────────────────────────────
  // runs once when the app loads
  // if a token exists in localStorage the user was previously logged in
  // decode it and restore their state so they don't have to login again
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // no token — user was never logged in

    try {
      // JWT = header.payload.signature — we decode the middle part (payload)
      // atob decodes base64 back to readable JSON
      const payload = JSON.parse(atob(token.split('.')[1]));

      // payload.exp is expiry in seconds, Date.now() is milliseconds
      if (payload.exp * 1000 > Date.now()) {
        setUser(payload.user); // restore user state
      } else {
        localStorage.removeItem('token'); // token expired — clean up
      }
    } catch {
      localStorage.removeItem('token'); // token malformed — clean up
    }
  }, []); // empty array = only runs once on mount

  // ── AUTH HANDLERS ──────────────────────────────────────────────────────────

  // called by both Login and SignUp on success
  // token already saved in localStorage by Login/SignUp before this is called
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser); // show user in navbar
    setShowLogin(false);   // close login modal
    setShowSignUp(false);  // close signup modal
  };

  // called when user clicks logout in navbar
  const handleLogout = () => {
    localStorage.removeItem('token'); // clear token so refresh doesn't restore them
    setUser(null);                    // clear user — navbar goes back to login/signup buttons
  };

  // ── SEARCH HANDLERS ────────────────────────────────────────────────────────

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

  // auto-select first bus result when results come in
  useEffect(() => {
    if (buses?.length > 0 && !selectedBus) {
      setSelectedBus(buses[0]);
    }
  }, [buses]);

  const handleSelectBus = (bus) => setSelectedBus(bus);

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

      <Navbar
        onSignUpClick={() => setShowSignUp(true)}
        onLoginClick={() => setShowLogin(true)}
        user={user}
        onLogout={handleLogout}
      />

      <div className={styles.content}>
        <div className={styles.leftPanel}>

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

      {/* signup modal — passes onLoginSuccess so signup auto-logs user in */}
      <Modal isOpen={showSignUp} onClose={() => setShowSignUp(false)}>
        <SignUp onLoginSuccess={handleLoginSuccess} />
      </Modal>

      {/* login modal */}
      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Modal>

    </div>
  );
};

export default Home;