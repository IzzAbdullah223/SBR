import { useState, useCallback } from 'react';
const useLocationPicker = () => {
  const [origin,      setOrigin]      = useState(null); 
  const [destination, setDestination] = useState(null);
  const [originInput,      setOriginInput]      = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [pinnedOrigin, setPinnedOrigin] = useState(null); 
  const [pinnedDest,   setPinnedDest]   = useState(null);
  const [programmaticFill, setProgrammaticFill] = useState(false);
  const [inputError, setInputError] = useState(null);
  const handleOriginChange = useCallback((e, locationData) => {
    setProgrammaticFill(false);
    setOriginInput(e.target.value);
    setInputError(null);
    setPinnedOrigin(null); 
    if (locationData?.lat && locationData?.lng) {
      setOrigin({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else {
      setOrigin(null);
    }
  }, []); 
  const handleDestinationChange = useCallback((e, locationData) => {
    setProgrammaticFill(false);
    setDestinationInput(e.target.value);
    setInputError(null);
    setPinnedDest(null);
    if (locationData?.lat && locationData?.lng) {
      setDestination({ lat: locationData.lat, lng: locationData.lng, name: e.target.value });
    } else {
      setDestination(null);
    }
  }, []);
  const fillFromSavedRoute = useCallback((route) => {
    setProgrammaticFill(true);
    setPinnedOrigin(null);
    setPinnedDest(null);
    setOriginInput(route.origin.name);
    setOrigin({ name: route.origin.name, lat: route.origin.position.lat, lng: route.origin.position.lng });
    setDestinationInput(route.destination.name);
    setDestination({ name: route.destination.name, lat: route.destination.position.lat, lng: route.destination.position.lng });
  }, []);
  const pinStopAsOrigin = useCallback((stop) => {
    setPinnedOrigin(stop);
    setPinnedDest(prev => prev); 
    setOriginInput('');          
    setOrigin({ lat: stop.position.lat, lng: stop.position.lng, name: stop.name });
    setInputError(null);
  }, []);
  const pinStopAsDestination = useCallback((stop) => {
    setPinnedDest(stop);
    setDestinationInput('');
    setDestination({ lat: stop.position.lat, lng: stop.position.lng, name: stop.name });
    setInputError(null);
  }, []);
  const clearPinnedOrigin = useCallback(() => {
    setPinnedOrigin(null);
    setOriginInput('');
    setOrigin(null);
  }, []);
  const clearPinnedDest = useCallback(() => {
    setPinnedDest(null);
    setDestinationInput('');
    setDestination(null);
  }, []);
  const resetLocations = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setOriginInput('');
    setDestinationInput('');
    setPinnedOrigin(null);
    setPinnedDest(null);
    setProgrammaticFill(false);
    setInputError(null);
  }, []);
  return {
    origin,
    destination,
    originInput,
    destinationInput,
    pinnedOrigin,
    pinnedDest,
    programmaticFill,
    inputError,
    setInputError,
    handleOriginChange,
    handleDestinationChange,
    fillFromSavedRoute,
    pinStopAsOrigin,
    pinStopAsDestination,
    clearPinnedOrigin,
    clearPinnedDest,
    resetLocations,
  };
};
export default useLocationPicker;