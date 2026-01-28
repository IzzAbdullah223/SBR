import { useState } from "react";
import Map from "../../Map/Map";
import SearchInput from "../../SearchInput/SearchInput";
import styles from './home.module.css'

const Home = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [optimization, setOptimization] = useState("fastest");
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Default map center (Abu Dhabi)
  const defaultCenter = { lat: 24.4539, lng: 54.3773 };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your browser permissions.');
        setIsLocating(false);
      }
    );
  };

  const handleOriginChange = (e, locationData) => {
    setOrigin(e.target.value);
    if (locationData) {
      setOriginCoords(locationData);
      // Clear route data when changing origin
      setRouteData(null);
    }
  };

  const handleDestinationChange = (e, locationData) => {
    setDestination(e.target.value);
    if (locationData) {
      setDestinationCoords(locationData);
      // Clear route data when changing destination
      setRouteData(null);
    }
  };

  const handleSearch = async () => {
    if (!originCoords || !destinationCoords) {
      alert("Please select both origin and destination from the dropdown");
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);
    setRouteData(null);

    console.log("Searching route from:", originCoords, "to:", destinationCoords);
    
    // TODO: Replace with actual API call when backend is ready
    // Mock route data using actual coordinates (TEMPORARY - Remove when backend ready)
    setTimeout(() => {
      const mockRoute = {
        origin: originCoords,
        destination: destinationCoords,
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
      setIsLoadingRoute(false);
    }, 1000);
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
          <SearchInput
            label="From"
            placeholder="Enter start location"
            value={origin}
            onChange={handleOriginChange}
          />

          <SearchInput
            label="To"
            placeholder="Enter destination"
            value={destination}
            onChange={handleDestinationChange}
          />

          <button 
            className={styles.searchBtn} 
            onClick={handleSearch}
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

      {/* Map Section */}
      <div className={styles.mapSection}>
        {/* Floating Locate Me Button */}
        <button 
          className={styles.locateMeBtn}
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Locate Me"
        >
          {isLocating ? (
            <svg className={styles.spinIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12.5523 2 13 2.44772 13 3V4.05493C16.9463 4.51608 20 7.81465 20 11.8571V12C20 16.0425 16.9463 19.3411 13 19.8022V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19.8022C7.05369 19.3411 4 16.0425 4 12V11.8571C4 7.81465 7.05369 4.51608 11 4.05493V3C11 2.44772 11.4477 2 12 2Z" fill="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          )}
        </button>

        <Map 
          origin={originCoords || routeData?.origin || userLocation || defaultCenter}
          destination={destinationCoords || routeData?.destination}
          userLocation={userLocation}
          busStops={[]}
          liveBusPositions={[]}
        />
      </div>
    </div>
  );
};

export default Home;