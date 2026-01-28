import styles from './sidebar.module.css';
import SearchInput from '../SearchInput/SearchInput';

const Sidebar = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSearch,
  isLoadingRoute,
  routeError,
  routeData
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logoSection}>
        <h2>🚍 Smart Bus Route Planner</h2>
        <p>Abu Dhabi Public Transport</p>
      </div>

      <div className={styles.searchSection}>
        <SearchInput
          label="From"
          placeholder="Enter start location"
          value={origin}
          onChange={onOriginChange}
        />

        <SearchInput
          label="To"
          placeholder="Enter destination"
          value={destination}
          onChange={onDestinationChange}
        />

        <button 
          className={styles.searchBtn} 
          onClick={onSearch}
          disabled={isLoadingRoute}
        >
          {isLoadingRoute ? 'Searching...' : 'Search Route'}
        </button>

        {routeError && (
          <div className={styles.errorMessage}>
            {routeError}
          </div>
        )}
      </div>

      {/* Route Results Section */}
      {routeData && (
        <div className={styles.resultsSection}>
          <h3>📋 Route Options</h3>
          <div className={styles.routeSummary}>
            <p><strong>Duration:</strong> {routeData.duration}</p>
            <p><strong>Estimated Fare:</strong> {routeData.fare}</p>
            <p><strong>Walking Distance:</strong> {routeData.walkingDistance}</p>
            <p><strong>Transfers:</strong> {routeData.transfers}</p>
          </div>
          
          <div className={styles.routeOptions}>
            {routeData.routeOptions.map(option => (
              <div key={option.id} className={styles.routeOption}>
                <h4>{option.type.replace('_', ' ').toUpperCase()}</h4>
                <p>⏱️ {option.duration}</p>
                <p>💰 {option.fare}</p>
                <p>🚶‍♂️ {option.walking} walking</p>
                <button className={styles.selectBtn}>Select This Route</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;