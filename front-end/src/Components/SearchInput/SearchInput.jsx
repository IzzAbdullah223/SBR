import { useState, useEffect, useRef } from 'react';
import styles from './SearchInput.module.css';

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;

const SearchInput = ({ value, onChange, placeholder, label }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);//useRef gives you a direct pointer to a real DOM element. Think of it as saying "I want to be able to grab this element later".
  const inputRef = useRef(null);//dropdownRef will point to the dropdown div. inputRef will point to the text input. They start as null and get connected to the actual elements via the ref attribute in JSX later. We need these to detect clicks outside — we can't do that with just React state.


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current/* does the dropdown exist in DOM right now */ && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {//was the click OUTSIDE the dropdown?, was the click OUTSIDE the input too?
        setShowDropdown(false);
      }
    
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


// debounce
  useEffect(() => {
    if (value.length < 2) { // if user typed < 2 char their no point of searching so  stop
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
 
      await searchLocations(value);
    }, 300);//Sets a 300ms timer. If the user keeps typing, this effect runs again which cancels the previous timer and starts a new one. The API call only fires when the user stops typing for 300ms. This is called debouncing — prevents sending a request on every single keystroke.
    return () => clearTimeout(delayDebounce);
  }, [value]);


  const searchLocations = async (query) => {
    if (!LOCATIONIQ_TOKEN || LOCATIONIQ_TOKEN === 'undefined') {
      setError('⚠️ LocationIQ token not configured');
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?` +
        `key=${LOCATIONIQ_TOKEN}` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=ae` +
        `&limit=10` +
        `&accept-language=en` +
        `&normalizecity=1`
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API token');
        throw new Error('Search failed');
      }

      const data = await response.json();

      // Filter for Dubai results bec sometimes the data come not filtered well
      const dubaiResults = data.filter(item => { 
        const displayName = item.display_name?.toLowerCase() || '';
        return displayName.includes('dubai') || displayName.includes('دبي');
      });
   
      // tranform the data into our format.
      const formattedResults = dubaiResults.map(item => ({
        place_id: item.place_id,
        display_name: item.display_name,
        name: item.display_name.split(',')[0].trim(),
        lat: parseFloat(item.lat),// convert string to numbers.
        lng: parseFloat(item.lon),
        type: item.type || 'place',
        address: item.address || {},
        isLocationIQ: true
      }));

      setSuggestions(formattedResults);
      setShowDropdown(formattedResults.length > 0);

    } catch (err) {
      console.error('LocationIQ search error:', err);
      if (err.message === 'Invalid API token') {
        setError('Invalid API token');
      } else {
        setError('Search temporarily unavailable');
      }
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange( // on change here is props from Home.
      { target: { value: suggestion.name } },
      { lat: suggestion.lat, lng: suggestion.lng, fullAddress: suggestion.display_name }
    );
    setShowDropdown(false);
    setSuggestions([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    onChange(e);
    if (e.target.value.length >= 2) setShowDropdown(true);
  };

  return (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          className={styles.searchInput}
          autoComplete="off"
        />

        {isLoading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {error && (
          <div className={styles.errorTooltip}>{error}</div>
        )}

        {showDropdown && suggestions.length > 0 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {suggestions.map((suggestion, index) => {
              const parts = suggestion.display_name.split(',');
              const mainAddress = parts[0].trim();
              const subAddress = parts.slice(1, 3).join(',').trim();
              return (
                <div
                  key={`${suggestion.place_id}-${index}`}
                  className={styles.dropdownItem}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className={styles.locationIcon}>📍</div>
                  <div className={styles.addressInfo}>
                    <div className={styles.mainAddress}>{mainAddress}</div>
                    <div className={styles.subAddress}>{subAddress || suggestion.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showDropdown && !isLoading && !error && suggestions.length === 0 && value.length >= 2 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.noResults}>No locations found in Dubai</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;