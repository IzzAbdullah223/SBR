import { useState } from "react";
import Map from "../../Map/Map";
import styles from './home.module.css'

const Home = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [preferences, setPreferences] = useState({
    optimization: "fastest",
    language: "en",
    theme: "light"
  });
  const [routeData, setRouteData] = useState(null);

  // Default map center (Abu Dhabi)
  const defaultCenter = { lat: 24.4539, lng: 54.3773 };

  const handleSearch = async () => {
    console.log("Searching route from:", origin, "to:", destination);
    
    // Mock route data
    const mockRoute = {
      origin: { lat: 24.4539, lng: 54.3773 },
      destination: { lat: 24.4810, lng: 54.3581 },
      duration: "45 min",
      fare: "AED 5.00",
      walkingDistance: "800 m",
      transfers: 1,
      routeOptions: [
        { id: 1, type: "fastest", duration: "40 min", fare: "AED 6.00", walking: "1.2 km" },
        { id: 2, type: "cheapest", duration: "55 min", fare: "AED 3.00", walking: "500 m" },
        { id: 3, type: "minimal_walking", duration: "50 min", fare: "AED 4.50", walking: "300 m" }
      ]
    };
    
    setRouteData(mockRoute);
  };

  return (
    <div className={styles.homeContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logoSection}>
          <h2>🚍 Smart Bus Route Planner</h2>
          <p>Abu Dhabi Public Transport</p>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.inputGroup}>
            <label>From</label>
            <input 
              type="text" 
              placeholder="Enter start location" 
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>To</label>
            <input 
              type="text" 
              placeholder="Enter destination" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <button className={styles.searchBtn} onClick={handleSearch}>
            Search Route
          </button>
        </div>

        <div className={styles.preferencesSection}>
          <h3>⚙️ Preferences</h3>
          <div className={styles.preferenceOptions}>
            <label>
              <input 
                type="radio" 
                name="optimization" 
                value="fastest"
                checked={preferences.optimization === "fastest"}
                onChange={(e) => setPreferences({...preferences, optimization: e.target.value})}
              />
              Fastest Route
            </label>
            <label>
              <input 
                type="radio" 
                name="optimization" 
                value="cheapest"
                checked={preferences.optimization === "cheapest"}
                onChange={(e) => setPreferences({...preferences, optimization: e.target.value})}
              />
              Cheapest Route
            </label>
            <label>
              <input 
                type="radio" 
                name="optimization" 
                value="minimal_walking"
                checked={preferences.optimization === "minimal_walking"}
                onChange={(e) => setPreferences({...preferences, optimization: e.target.value})}
              />
              Minimal Walking
            </label>
            <label>
              <input 
                type="radio" 
                name="optimization" 
                value="greenest"
                checked={preferences.optimization === "greenest"}
                onChange={(e) => setPreferences({...preferences, optimization: e.target.value})}
              />
              Greenest Route
            </label>
          </div>

          <div className={styles.languageSelector}>
            <label>Language:</label>
            <select 
              value={preferences.language}
              onChange={(e) => setPreferences({...preferences, language: e.target.value})}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
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

        {/* Virtual Wallet Section */}
        <div className={styles.walletSection}>
          <h3>💳 Virtual Wallet</h3>
          <p>Balance: <strong>AED 25.50</strong></p>
          <button className={styles.rechargeBtn}>Recharge</button>
        </div>
      </div>

      {/* Map Section */}
      <div className={styles.mapSection}>
        <Map 
          origin={routeData?.origin || defaultCenter}
          destination={routeData?.destination}
          busStops={[
            { position: { lat: 24.4600, lng: 54.3700 }, name: "Main Bus Station" },
            { position: { lat: 24.4700, lng: 54.3650 }, name: "City Center Stop" }
          ]}
          liveBusPositions={[
            { position: { lat: 24.4550, lng: 54.3720 }, id: "B101", route: "Route 5" },
            { position: { lat: 24.4750, lng: 54.3600 }, id: "B102", route: "Route 7" }
          ]}
        />
      </div>
    </div>
  );
};

export default Home;