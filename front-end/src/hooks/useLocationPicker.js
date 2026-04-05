import { useState, useCallback } from 'react';

/**
 * useLocationPicker
 *
 * Manages the origin and destination for a journey search.
 * Three ways a location can be set:
 *   1. User types → LocationIQ autocomplete → handleOriginChange / handleDestinationChange
 *   2. User picks a saved route → fillFromSavedRoute (programmatic, no LocationIQ)
 *   3. User pins a bus stop → pinStopAsOrigin / pinStopAsDestination (coordinates direct, no LocationIQ)
 *
 * The "pinned" concept: when a bus stop is pinned, the text input is
 * replaced by a pill tag showing the stop name. LocationIQ is bypassed
 * entirely because the stop already has exact coordinates.
 */
const useLocationPicker = () => {
  // Resolved coordinate objects — what gets sent to the TOPSIS API
  const [origin,      setOrigin]      = useState(null); // { lat, lng, name }
  const [destination, setDestination] = useState(null);

  // Text shown in the search input boxes
  const [originInput,      setOriginInput]      = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  // Pinned bus stops — when set, replace the text input with a pill tag
  const [pinnedOrigin, setPinnedOrigin] = useState(null); // bus stop object
  const [pinnedDest,   setPinnedDest]   = useState(null);

  // Prevents LocationIQ from firing when we fill inputs programmatically
  const [programmaticFill, setProgrammaticFill] = useState(false);

  const [inputError, setInputError] = useState(null);

  // ── Typed input handlers (called by SearchInput onChange) ────────────────
  const handleOriginChange = useCallback((e, locationData) => {
    setProgrammaticFill(false);
    setOriginInput(e.target.value);
    setInputError(null);
    setPinnedOrigin(null); // clear any pinned stop if user starts typing
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

  // ── Saved route fill (programmatic — no LocationIQ) ──────────────────────
  const fillFromSavedRoute = useCallback((route) => {
    setProgrammaticFill(true);
    setPinnedOrigin(null);
    setPinnedDest(null);
    setOriginInput(route.origin.name);
    setOrigin({ name: route.origin.name, lat: route.origin.position.lat, lng: route.origin.position.lng });
    setDestinationInput(route.destination.name);
    setDestination({ name: route.destination.name, lat: route.destination.position.lat, lng: route.destination.position.lng });
  }, []);

  // ── Pin a bus stop (bypasses LocationIQ entirely) ────────────────────────
  const pinStopAsOrigin = useCallback((stop) => {
    setPinnedOrigin(stop);
    setPinnedDest(prev => prev); // keep destination unchanged
    setOriginInput('');          // clear text — pill tag shows instead
    setOrigin({ lat: stop.position.lat, lng: stop.position.lng, name: stop.name });
    setInputError(null);
  }, []);

  const pinStopAsDestination = useCallback((stop) => {
    setPinnedDest(stop);
    setDestinationInput('');
    setDestination({ lat: stop.position.lat, lng: stop.position.lng, name: stop.name });
    setInputError(null);
  }, []);

  // ── Clear pinned stops ───────────────────────────────────────────────────
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

  // ── Full reset ───────────────────────────────────────────────────────────
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
    // Resolved coordinates
    origin,
    destination,
    // Text input values
    originInput,
    destinationInput,
    // Pinned stops (null = no pin, show text input; set = show pill tag)
    pinnedOrigin,
    pinnedDest,
    // Flags
    programmaticFill,
    inputError,
    setInputError,
    // Handlers
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