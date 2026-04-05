import { useState, useMemo, useEffect } from 'react';
import MapComponent from '../../Components/Map/Map';
import SearchInput from '../../Components/SearchInput/SearchInput';
import BusResults from '../../Components/BusResults/BusResults';
import SavedRoutes from '../../Components/SavedRoutes/SavedRoutes';
import FavoriteStops from '../../Components/FavoriteStops/FavoriteStops';
import { Search, X } from 'lucide-react';
import { MAP_CONFIG } from '../../utils/constants';
import useFindBuses from '../../hooks/useFindBuses';
import useShape from '../../hooks/useShape';
import useSavedRoutes from '../../hooks/useSavedRoutes';
import useBusStop from '../../hooks/useBusStop';
import useWallet from '../../hooks/useWallet';
import useFavoriteStops from '../../hooks/useFavoriteStop';
import Navbar from '../../Components/NavBar/Navbar';
import Modal from '../../Components/Modal/Modal';
import { SignUp } from '../Authentication/SignUp/SignUp';
import { Login } from '../Authentication/Login/Login';
import styles from './Home.module.css';
import { settingsAPI } from '../../services/Api';
import { useTranslation } from 'react-i18next';

const Home = ({
  user,
  theme = 'light',
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

  const [originInput,      setOriginInput]      = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [origin,           setOrigin]           = useState(null);
  const [destination,      setDestination]      = useState(null);
  const [selectedBus,      setSelectedBus]      = useState(null);
  const [programmaticFill, setProgrammaticFill] = useState(false);
  const [inputError,       setInputError]       = useState(null);

  const [optimizationMode, setOptimizationMode] = useState(
    () => user?.preferences?.optimizationMode || 'fastest'
  );

  useEffect(() => {
    setOptimizationMode(user?.preferences?.optimizationMode || 'fastest');
  }, [user?.preferences?.optimizationMode]);

  const handleModeChange = async (mode) => {
    setOptimizationMode(mode);
    if (user) {
      try { await settingsAPI.updatePreferences(mode); } catch {}
    }
  };

  const { buses, loading, error, errorType, findBuses, clearResults } = useFindBuses();
  const { shapeCoordinates, shapeCoordinatesLeg2 }                   = useShape(selectedBus);
  const { selectedStop, loadingStop, selectStop, clearStop }         = useBusStop();

  // Feature 2 — Nol Wallet
  const { walletBalance } = useWallet(user);

  // Feature 4 — Favorite Stops
  const { favoriteStops, addFavorite, removeFavorite, isFavorite } = useFavoriteStops(user);

  const {
    savedRoutes, loadingSaved, savingKey, saveError, showSaved,
    saveRoute, deleteSavedRoute, toggleSavedPanel, setSaveError, isJourneySaved,
  } = useSavedRoutes(user);

  const isSavingJourney    = !!(origin && destination && savingKey === `${origin.name}__${destination.name}`);
  const journeyAlreadySaved = !!(origin && destination && isJourneySaved(origin.lat, origin.lng, destination.lat, destination.lng));

  const handleOriginChange = (e, locationData) => {
    if (programmaticFill) setProgrammaticFill(false);
    setOriginInput(e.target.value);
    setInputError(null);
    if (locationData?.lat && locationData?.lng) {
      setOrigin({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else setOrigin(null);
  };

  const handleDestinationChange = (e, locationData) => {
    if (programmaticFill) setProgrammaticFill(false);
    setDestinationInput(e.target.value);
    setInputError(null);
    if (locationData?.lat && locationData?.lng) {
      setDestination({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else setDestination(null);
  };

  const handleFindBuses = async () => {
    if (!origin || !destination) {
      setInputError(t('home.selectFromDropdown'));
      return;
    }
    setInputError(null);
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
    setOriginInput('');
    setDestinationInput('');
    setOrigin(null);
    setDestination(null);
    setSelectedBus(null);
    clearStop();
    setSaveError(null);
    setInputError(null);
    clearResults();
  };

  useEffect(() => {
    if (buses?.length > 0 && !selectedBus) setSelectedBus(buses[0]);
  }, [buses, selectedBus]);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    clearStop();
  };

  const handleSaveJourney = async () => {
    if (!origin || !destination) return;
    await saveRoute(origin, destination);
  };

  const handleSelectSavedJourney = (route) => {
    setProgrammaticFill(true);
    setOriginInput(route.origin.name);
    setOrigin({ name: route.origin.name, lat: route.origin.position.lat, lng: route.origin.position.lng });
    setDestinationInput(route.destination.name);
    setDestination({ name: route.destination.name, lat: route.destination.position.lat, lng: route.destination.position.lng });
    if (showSaved) toggleSavedPanel();
  };

  // Feature 4 — clicking a favorite stop chip opens the stop card on the map
  const handleFavoriteStopClick = (stop) => {
    selectStop(stop);
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
      <Navbar
        onSignUpClick={openSignUp}
        onLoginClick={openLogin}
        user={user}
      />

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

            {/* Feature 4 — Favorite stop chips (second row, only when user has favorites) */}
            <FavoriteStops
              favoriteStops={favoriteStops}
              user={user}
              onStopClick={handleFavoriteStopClick}
            />

            <p className={styles.sectionTitle}>{t('home.whereGoing')}</p>
            <SearchInput
              label={t('home.labelOrigin')}
              placeholder={t('home.searchPlaceholderOrigin')}
              value={originInput}
              onChange={handleOriginChange}
              disableSuggestions={programmaticFill}
            />
            <SearchInput
              label={t('home.labelDestination')}
              placeholder={t('home.searchPlaceholderDest')}
              value={destinationInput}
              onChange={handleDestinationChange}
              disableSuggestions={programmaticFill}
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
            {(originInput || destinationInput || buses.length > 0) && (
              <button className={styles.resetBtn} onClick={handleReset} title={t('home.clearAll')}>
                <X size={18} />
              </button>
            )}
          </div>

          {inputError && (
            <div className={`${styles.errorMessage} ${styles.errorBad}`}>
              {inputError}
            </div>
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