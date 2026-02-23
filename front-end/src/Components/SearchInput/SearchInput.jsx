import { useState, useEffect, useRef } from 'react';
import styles from './SearchInput.module.css';



const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;

const SearchInput = ({ value, onChange, placeholder, label }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      await searchLocations(value);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [value]);

  const searchLocations = async (query) => {
    // Check if token is configured
    if (!LOCATIONIQ_TOKEN || LOCATIONIQ_TOKEN === 'undefined') {
      setError('⚠️ LocationIQ token not configured. Check .env file.');
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // LocationIQ Autocomplete API
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?` +
        `key=${LOCATIONIQ_TOKEN}` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=ae` +                    // UAE only
        `&limit=8` +                            // Max 8 results
        `&accept-language=en` +                 // English
        `&normalizecity=1` +                    // Normalize city names
        `&viewbox=54.8,24.7,55.6,25.4` +       // Dubai bounding box
        `&bounded=1`                            // Strict bounding
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API token');
        }
        throw new Error('Search failed');
      }

      const data = await response.json();

      // Filter for Dubai results
      const dubaiResults = data.filter(item => {
        const displayName = item.display_name.toLowerCase();
        return displayName.includes('dubai') || displayName.includes('دبي');
      });

      // Transform LocationIQ format to our format
      const formattedResults = dubaiResults.map(item => ({
        place_id: item.place_id,
        display_name: item.display_name,
        name: item.display_name.split(',')[0].trim(),
        lat: parseFloat(item.lat),
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
        setError('Invalid API token. Check your .env file.');
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
    // Use the short name for display
    const displayName = suggestion.name;

    onChange({
      target: { value: displayName }
    }, {
      lat: suggestion.lat,
      lng: suggestion.lng,
      fullAddress: suggestion.display_name
    });

    setShowDropdown(false);
    setSuggestions([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    onChange(e);
    if (e.target.value.length >= 2) {
      setShowDropdown(true);
    }
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
              // Split address for display
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
                    <div className={styles.mainAddress}>
                      {mainAddress}
                    </div>
                    <div className={styles.subAddress}>
                      {subAddress || suggestion.type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showDropdown && !isLoading && !error && suggestions.length === 0 && value.length >= 2 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.noResults}>
              No locations found in Dubai
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
