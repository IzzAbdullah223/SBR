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
    }
  };

  const handleDestinationChange = (e, locationData) => {
    setDestination(e.target.value);
    if (locationData) {
      setDestinationCoords(locationData);
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
    // const response = await fetch('/api/routes/plan', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     origin: originCoords,
    //     destination: destinationCoords,
    //     optimization: optimization
    //   })
    // });
    // 
    // if (!response.ok) {
    //   setRouteError('Failed to find routes. Please try again.');
    //   setIsLoadingRoute(false);
    //   return;
    // }
    //
    // const data = await response.json();
    // setRouteData(data);
    // setIsLoadingRoute(false);
    
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

          <div className={styles.buttonGroup}>
            <button 
              className={styles.locateMeBtn}
              onClick={handleLocateMe}
              disabled={isLocating}
            >
              {isLocating ? '📍 Locating...' : '📍 Locate Me'}
            </button>

            <button 
              className={styles.searchBtn} 
              onClick={handleSearch}
              disabled={isLoadingRoute}
            >
              {isLoadingRoute ? 'Searching...' : 'Search Route'}
            </button>
          </div>

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
        <Map 
          origin={routeData?.origin || userLocation || defaultCenter}
          destination={routeData?.destination}
          userLocation={userLocation}
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