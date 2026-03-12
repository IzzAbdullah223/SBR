// Home.jsx
// Main page — left sidebar (saved routes panel, search, sliders, results) + right map
// Saved Routes panel now sits at the TOP of the left sidebar, collapsible
// "Add to Favourites" saves the journey (origin+destination) not the specific bus
// Clicking a saved journey auto-fills origin + destination fields

import React, { useState, useMemo, useEffect } from 'react';
import MapComponent from '../../Components/Map/Map';
import SearchInput from '../../Components/SearchInput/SearchInput';
import WeightSliders from '../../Components/WeightSliders/WeightSliders';
import BusResults from '../../Components/BusResults/BusResults';
import SavedRoutes from '../../Components/SavedRoutes/SavedRoutes';
import { Search } from 'lucide-react';
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
  // true while input was filled by a saved-route chip — suppresses LocationIQ dropdown
  const [programmaticFill, setProgrammaticFill] = useState(false);
  const [weights, setWeights] = useState({
    time: 0.25, cost: 0.25, walkingDistance: 0.25, transfers: 0.25,
  });

  const { buses, loading, error, errorType, findBuses, clearResults } = useFindBuses();
  const { shapeCoordinates, shapeCoordinatesLeg2 } = useShape(selectedBus);
  const { nearbyStops } = useNearbyStops(origin, destination, 0.8);

  // ── SAVED ROUTES ──────────────────────────────────────────────────────────
  const {
    savedRoutes,
    loadingSaved,
    savingKey,
    saveError,
    showSaved,
    saveRoute,
    deleteSavedRoute,
    toggleSavedPanel,
    setSaveError,
    isJourneySaved,
  } = useSavedRoutes(user);

  // true while the current origin+destination journey save is in flight
  const isSavingJourney = !!(
    origin && destination &&
    savingKey === `${origin.name}__${destination.name}`
  );

  // true if the current origin+destination journey is already saved
  const journeyAlreadySaved = !!(
    origin && destination && isJourneySaved(origin.lat, origin.lng, destination.lat, destination.lng)
  );

  // ── SEARCH HANDLERS ────────────────────────────────────────────────────────

  const handleOriginChange = (e, locationData) => {
    if (programmaticFill) setProgrammaticFill(false); // user is typing — re-enable suggestions
    setOriginInput(e.target.value);
    if (locationData?.lat && locationData?.lng) {
      setOrigin({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else {
      setOrigin(null);
    }
  };

  const handleDestinationChange = (e, locationData) => {
    if (programmaticFill) setProgrammaticFill(false); // user is typing — re-enable suggestions
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
    setSaveError(null);
    await findBuses(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
      weights
    );
  };

  // auto-select first bus result when results arrive
  useEffect(() => {
    if (buses?.length > 0 && !selectedBus) {
      setSelectedBus(buses[0]);
    }
  }, [buses, selectedBus]);

  const handleSelectBus = (bus) => setSelectedBus(bus);

  // ── SAVE JOURNEY HANDLER ───────────────────────────────────────────────────
  // Called when user clicks "Add to Favourites" in BusResults header
  // Saves origin + destination only — no specific bus
  const handleSaveJourney = async () => {
    if (!origin || !destination) return;
    await saveRoute(origin, destination);
  };

  // ── SELECT SAVED JOURNEY ───────────────────────────────────────────────────
  // Called when user clicks a saved route card in the SavedRoutes panel
  // Auto-fills the origin and destination search fields
  // User then presses "Find Best Bus Routes" themselves
  const handleSelectSavedJourney = (route) => {
    // Suppress LocationIQ suggestion dropdown — user didn't type these values
    setProgrammaticFill(true);

    // fill origin
    setOriginInput(route.origin.name);
    setOrigin({
      name: route.origin.name,
      lat: route.origin.position.lat,
      lng: route.origin.position.lng,
    });

    // fill destination
    setDestinationInput(route.destination.name);
    setDestination({
      name: route.destination.name,
      lat: route.destination.position.lat,
      lng: route.destination.position.lng,
    });

    // close the saved routes panel so the user can see the search fields
    if (showSaved) toggleSavedPanel();
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

          {/* ── SEARCH FIELDS + SAVED ROUTES ── */}
          <div className={styles.section}>
            {/* Saved routes chip row sits right above the search title, same padding */}
            <div className={styles.savedRoutesPinned}>
              <SavedRoutes
                savedRoutes={savedRoutes}
                loading={loadingSaved}
                onDelete={deleteSavedRoute}
                onSelectJourney={handleSelectSavedJourney}
                user={user}
                isOpen={showSaved}
                onToggle={toggleSavedPanel}
              />
            </div>
            <p className={styles.sectionTitle}>📍 Where are you going?</p>
            <SearchInput
              label="Origin"
              placeholder="e.g., Dubai Mall, Gold Souk..."
              value={originInput}
              onChange={handleOriginChange}
              disableSuggestions={programmaticFill}
            />
            <SearchInput
              label="Destination"
              placeholder="e.g., Mall of Emirates, Dubai Marina..."
              value={destinationInput}
              onChange={handleDestinationChange}
              disableSuggestions={programmaticFill}
            />
          </div>

          {/* ── WEIGHT SLIDERS ── */}
          <div className={styles.section}>
            <WeightSliders onWeightChange={handleWeightChange} />
          </div>

          {/* ── FIND BUSES BUTTON ── */}
          <button
            className={`${styles.findButton} ${loading ? styles.loading : ''}`}
            onClick={handleFindBuses}
            disabled={!origin || !destination || loading}
          >
            <Search size={20} />
            <span>{loading ? 'Searching...' : 'Find Best Bus Routes'}</span>
          </button>

          {/* search error */}
          {error && (
            <div className={`${styles.errorMessage} ${errorType === 'info' ? styles.errorInfo : styles.errorBad}`}>
              {error}
            </div>
          )}

          {/* save error */}
          {saveError && (
            <div className={`${styles.errorMessage} ${styles.errorBad}`}>
              {saveError}
            </div>
          )}

          {/* ── BUS RESULTS ── */}
          {(buses.length > 0 || loading) && (
            <div className={styles.section}>
              <BusResults
                buses={buses}
                onSelectBus={handleSelectBus}
                selectedBus={selectedBus}
                loading={loading}
                onSaveJourney={handleSaveJourney}
                isSavingJourney={isSavingJourney}
                journeyAlreadySaved={journeyAlreadySaved}
                user={user}
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

      <Modal isOpen={showSignUp} onClose={closeSignUp}>
        <SignUp
          onLoginSuccess={handleLoginSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </Modal>

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