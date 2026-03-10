// Home.jsx
// Main page — left sidebar (search, sliders, results, saved routes) + right map panel
// Changes in this version:
//   - useSavedRoutes hook wired in
//   - "My Saved Routes" toggle button in the sidebar
//   - SavedRoutes panel rendered below bus results
//   - BusResults receives onSaveRoute, savingId, user, and savedRoutes props

import React, { useState, useMemo, useEffect } from 'react';
import MapComponent from '../../Components/Map/Map';
import SearchInput from '../../Components/SearchInput/SearchInput';
import WeightSliders from '../../Components/WeightSliders/WeightSliders';
import BusResults from '../../Components/BusResults/BusResults';
import SavedRoutes from '../../Components/savedRoutes/SavedRoutes';
import { Search, Bookmark } from 'lucide-react';
import { MAP_CONFIG } from '../../utils/constants';
import useFindBuses from '../../hooks/useFindBuses';
import useShape from '../../hooks/useShape';
import useNearbyStops from '../../hooks/useNearbyStops';
import useAuth from '../../hooks/useAuth';
import useSavedRoutes from '../../hooks/useSavedRoutes';
import Navbar from '../../Components/NavBar/Navbar';
import Modal from '../../Components/Modal/Modal';
import { SignUp } from '../Authentication/SignUp/SignUp';
import { Login } from '../Authentication/Login/Login';
import styles from './Home.module.css';

const Home = () => {

  const {
    user,
    showLogin,
    showSignUp,
    handleLoginSuccess,
    handleLogout,
    handleSwitchToSignUp,
    handleSwitchToLogin,
    openLogin,
    openSignUp,
    closeLogin,
    closeSignUp,
  } = useAuth();

  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [weights, setWeights] = useState({
    time: 0.25, cost: 0.25, walkingDistance: 0.25, transfers: 0.25,
  });

  const { buses, loading, error, errorType, findBuses, clearResults } = useFindBuses();
  const { shapeCoordinates, shapeCoordinatesLeg2 } = useShape(selectedBus);
  const { nearbyStops } = useNearbyStops(origin, destination, 0.8);

  // ── SAVED ROUTES ──────────────────────────────────────────────────────────
  // useSavedRoutes manages fetching, saving, and deleting favourite routes
  // user is passed so the hook can attach the JWT token to every request
  // savedRoutes is also passed to BusResults so it can pre-mark already-saved
  // routes as "Route Saved ✓" on load and after page refresh
  const {
    savedRoutes,
    loadingSaved,
    savingId,
    saveError,
    showSaved,
    saveRoute,
    deleteSavedRoute,
    toggleSavedPanel,
    setSaveError,
  } = useSavedRoutes(user);

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
    // clear any leftover save errors when the user starts a new search
    setSaveError(null);
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
  }, [buses, selectedBus]);

  const handleSelectBus = (bus) => setSelectedBus(bus);

  // ── SAVE ROUTE HANDLER ─────────────────────────────────────────────────────
  // Called by BusResults when user clicks "Add to Favourites" on a card
  // Returns true/false so BusResults knows whether to mark the button as saved
  const handleSaveRoute = async (bus) => {
    if (!origin || !destination) return false;
    // return the result so BusResults knows if the save succeeded
    // BusResults uses this to switch the button to "Route Saved ✓"
    return await saveRoute(bus, origin, destination);
  };

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
        onSignUpClick={openSignUp}
        onLoginClick={openLogin}
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

          {/* errorType 'info' = expected result (no routes, out of service) — softer styling
              errorType 'error' = real problem (server down, network) — red warning styling
              messages from useFindBuses already include their own emoji, don't add another */}
          {error && (
            <div className={`${styles.errorMessage} ${errorType === 'info' ? styles.errorInfo : styles.errorBad}`}>
              {error}
            </div>
          )}

          {/* saveError — shown when "Add to Favourites" fails (e.g. duplicate route name) */}
          {saveError && (
            <div className={`${styles.errorMessage} ${styles.errorBad}`}>
              {saveError}
            </div>
          )}

          {(buses.length > 0 || loading) && (
            <div className={styles.section}>
              {/* BusResults receives savedRoutes so it can pre-mark already-saved
                  routes as "Route Saved ✓" on load and after page refresh */}
              <BusResults
                buses={buses}
                onSelectBus={handleSelectBus}
                selectedBus={selectedBus}
                loading={loading}
                onSaveRoute={handleSaveRoute}
                savingId={savingId}
                user={user}
                savedRoutes={savedRoutes}
              />
            </div>
          )}

          {/* ── SAVED ROUTES SECTION ──────────────────────────────────────────
              Always visible at the bottom of the sidebar so users can access
              their saved routes at any time, even before searching */}
          <div className={styles.section}>
            <button
              className={styles.savedRoutesToggle}
              onClick={toggleSavedPanel}
            >
              <Bookmark size={16} />
              <span>My Saved Routes</span>
              {/* chevron rotates when the panel is open */}
              <span className={`${styles.chevron} ${showSaved ? styles.chevronOpen : ''}`}>
                ▾
              </span>
            </button>

            {/* Collapsible panel — only rendered when showSaved is true */}
            {showSaved && (
              <div className={styles.savedPanel}>
                <SavedRoutes
                  savedRoutes={savedRoutes}
                  loading={loadingSaved}
                  onDelete={deleteSavedRoute}
                  user={user}
                />
              </div>
            )}
          </div>

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
      <Modal isOpen={showSignUp} onClose={closeSignUp}>
        <SignUp
          onLoginSuccess={handleLoginSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </Modal>

      {/* login modal */}
      <Modal isOpen={showLogin} onClose={closeLogin}>
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      </Modal>

    </div>
  );
};

export default Home;