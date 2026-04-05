import { useState, useMemo, useEffect } from 'react';
import MapComponent   from '../../Components/Map/Map';
import SearchInput    from '../../Components/SearchInput/SearchInput';
import BusResults     from '../../Components/BusResults/BusResults';
import SavedRoutes    from '../../Components/SavedRoutes/SavedRoutes';
import FavoriteStops  from '../../Components/FavoriteStops/FavoriteStop';
import { Search, X }  from 'lucide-react';
import { MAP_CONFIG }  from '../../utils/constants';

import useFindBuses       from '../../hooks/useFindBuses';
import useShape           from '../../hooks/useShape';
import useSavedRoutes     from '../../hooks/useSavedRoutes';
import useBusStop         from '../../hooks/useBusStop';
import useFavoriteStops   from '../../hooks/useFavoriteStop';
import useLocationPicker  from '../../hooks/useLocationPicker';
import useOptimizationMode from '../../hooks/useOptimizationMode';

import Navbar  from '../../Components/NavBar/Navbar';
import Modal   from '../../Components/Modal/Modal';
import { SignUp } from '../Authentication/SignUp/SignUp';
import { Login }  from '../Authentication/Login/Login';
import styles  from './Home.module.css';
import { useTranslation } from 'react-i18next';

const Home = ({
  user,
  theme = 'light',
  walletBalance = null,
  showLogin,
  showSignUp,
  handleLoginSuccess,
  handleSwitchToSignUp,
  handleSwitchToLogin,
  openLogin,
  openSignUp,
  closeLogin,
  closeSignUp,
}) => {
  const { t } = useTranslation();

  // ── Location picking — origin, destination, pinned stops ─────────────────
  const {
    origin, destination,
    originInput, destinationInput,
    pinnedOrigin, pinnedDest,
    programmaticFill, inputError, setInputError,
    handleOriginChange, handleDestinationChange,
    fillFromSavedRoute,
    pinStopAsOrigin, pinStopAsDestination,
    clearPinnedOrigin, clearPinnedDest,
    resetLocations,
  } = useLocationPicker();

  // ── Optimization mode ─────────────────────────────────────────────────────
  const { optimizationMode, handleModeChange } = useOptimizationMode(user);

  // ── Bus search + shape ────────────────────────────────────────────────────
  const [selectedBus, setSelectedBus] = useState(null);
  const { buses, loading, error, errorType, findBuses, clearResults } = useFindBuses();
  const { shapeCoordinates, shapeCoordinatesLeg2 }                   = useShape(selectedBus);

  // ── Map stop card ─────────────────────────────────────────────────────────
  const { selectedStop, loadingStop, selectStop, clearStop } = useBusStop();

  // ── Feature 4 — Favorite stops ───────────────────────────────────────────
  const { favoriteStops, addFavorite, removeFavorite, isFavorite } = useFavoriteStops(user);

  // ── Saved routes ──────────────────────────────────────────────────────────
  const {
    savedRoutes, loadingSaved, savingKey, saveError, showSaved,
    saveRoute, deleteSavedRoute, toggleSavedPanel, setSaveError, isJourneySaved,
  } = useSavedRoutes(user);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showFavorites, setShowFavorites] = useState(false);

  const isSavingJourney     = !!(origin && destination && savingKey === `${origin.name}__${destination.name}`);
  const journeyAlreadySaved = !!(origin && destination && isJourneySaved(origin.lat, origin.lng, destination.lat, destination.lng));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFindBuses = async () => {
    if (!origin || !destination) {
      setInputError(t('home.selectFromDropdown'));
      return;
    }
    setSelectedBus(null);
    clearStop();
    clearResults();
    setSaveError(null);
    await findBuses(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
      optimizationMode
    );
  };

  const handleReset = () => {
    resetLocations();
    setSelectedBus(null);
    clearStop();
    setSaveError(null);
    clearResults();
  };

  useEffect(() => {
    if (buses?.length > 0 && !selectedBus) setSelectedBus(buses[0]);
  }, [buses, selectedBus]);

  const handleSelectBus = (bus) => { setSelectedBus(bus); clearStop(); };

  const handleSaveJourney = async () => {
    if (!origin || !destination) return;
    await saveRoute(origin, destination);
  };

  const handleSelectSavedJourney = (route) => {
    fillFromSavedRoute(route);
    if (showSaved) toggleSavedPanel();
  };

  // When user taps a favorite stop chip — open its stop card on the map
  const handleFavoriteStopClick = (stop) => selectStop(stop);

  // When user taps "Set as Origin" inside the stop card
  const handleSetStopAsOrigin = (stop) => {
    pinStopAsOrigin(stop);
    clearStop();
  };

  // When user taps "Set as Destination" inside the stop card
  const handleSetStopAsDestination = (stop) => {
    pinStopAsDestination(stop);
    clearStop();
  };

  const mapStops = useMemo(() => {
    if (!selectedBus) return [];
    const stops = [];
    if (selectedBus.originStop)      stops.push(selectedBus.originStop);
    if (selectedBus.transferStop)    stops.push(selectedBus.transferStop);
    if (selectedBus.destinationStop) stops.push(selectedBus.destinationStop);
    return stops;
  }, [selectedBus]);

  const modes = [
    { value: 'fastest',          icon: '🚀', labelKey: 'modes.fastest'     },
    { value: 'cheapest',         icon: '💰', labelKey: 'modes.cheapest'    },
    { value: 'less_walking',     icon: '🚶', labelKey: 'modes.lessWalking' },
    { value: 'fewest_transfers', icon: '🔄', labelKey: 'modes.direct'      },
  ];

  return (
    <div className={styles.container}>
      <Navbar onSignUpClick={openSignUp} onLoginClick={openLogin} user={user} />

      <div className={styles.content}>
        <div className={styles.leftPanel}>

          <div className={styles.sectionTop}>
            {/* Saved journey chips */}
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

            {/* Favorite stop chips */}
            <FavoriteStops
              favoriteStops={favoriteStops}
              user={user}
              onStopClick={handleFavoriteStopClick}
              onDelete={removeFavorite}
              isOpen={showFavorites}
              onToggle={() => setShowFavorites(v => !v)}
            />

            <p className={styles.sectionTitle}>{t('home.whereGoing')}</p>

            {/* Origin — shows pinned pill when a stop is pinned */}
            <SearchInput
              label={t('home.labelOrigin')}
              placeholder={t('home.searchPlaceholderOrigin')}
              value={originInput}
              onChange={handleOriginChange}
              disableSuggestions={programmaticFill}
              pinnedStop={pinnedOrigin}
              onClearPin={clearPinnedOrigin}
            />

            {/* Destination — shows pinned pill when a stop is pinned */}
            <SearchInput
              label={t('home.labelDestination')}
              placeholder={t('home.searchPlaceholderDest')}
              value={destinationInput}
              onChange={handleDestinationChange}
              disableSuggestions={programmaticFill}
              pinnedStop={pinnedDest}
              onClearPin={clearPinnedDest}
            />
          </div>

          <div className={styles.modeCard}>
            <p className={styles.modeLabel}>{t('modes.label')}</p>
            <div className={styles.modeButtons}>
              {modes.map(({ value, icon, labelKey }) => (
                <button
                  key={value}
                  className={`${styles.modeBtn} ${optimizationMode === value ? styles.modeBtnActive : ''}`}
                  onClick={() => handleModeChange(value)}
                >
                  <span className={styles.modeBtnIcon}>{icon}</span>
                  <span className={styles.modeBtnLabel}>{t(labelKey)}</span>
                </button>
              ))}
            </div>
            {!user && (
              <p className={styles.modeHint}>
                <span className={styles.modeLoginLink} onClick={openLogin}>{t('home.logIn')}</span>{' '}
                {t('home.loginToSave')}
              </p>
            )}
          </div>

          <div className={styles.findRow}>
            <button
              className={`${styles.findButton} ${loading ? styles.loading : ''}`}
              onClick={handleFindBuses}
              disabled={!origin || !destination || loading}
            >
              <Search size={20} />
              <span>{loading ? t('home.searching') : t('home.findButton')}</span>
            </button>
            {(originInput || destinationInput || pinnedOrigin || pinnedDest || buses.length > 0) && (
              <button className={styles.resetBtn} onClick={handleReset} title={t('home.clearAll')}>
                <X size={18} />
              </button>
            )}
          </div>

          {inputError && (
            <div className={`${styles.errorMessage} ${styles.errorBad}`}>{inputError}</div>
          )}
          {error && (
            <div className={`${styles.errorMessage} ${errorType === 'info' ? styles.errorInfo : styles.errorBad}`}>
              {error}
            </div>
          )}
          {saveError && (
            <div className={`${styles.errorMessage} ${styles.errorBad}`}>{saveError}</div>
          )}

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
                walletBalance={walletBalance}
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
            selectedStop={selectedStop}
            loadingStop={loadingStop}
            onStopClick={selectStop}
            onStopClose={clearStop}
            isFavorite={isFavorite}
            onAddFavorite={addFavorite}
            onRemoveFavorite={removeFavorite}
            onSetAsOrigin={handleSetStopAsOrigin}
            onSetAsDestination={handleSetStopAsDestination}
            user={user}
            theme={theme}
          />
        </div>
      </div>

      <Modal isOpen={showSignUp} onClose={closeSignUp}>
        <SignUp onLoginSuccess={handleLoginSuccess} onSwitchToLogin={handleSwitchToLogin} />
      </Modal>
      <Modal isOpen={showLogin} onClose={closeLogin}>
        <Login onLoginSuccess={handleLoginSuccess} onSwitchToSignUp={handleSwitchToSignUp} />
      </Modal>
    </div>
  );
};

export default Home;