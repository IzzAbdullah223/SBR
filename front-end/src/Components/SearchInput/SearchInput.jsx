import { useState, useEffect, useRef } from 'react';
import styles from './SearchInput.module.css';

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

  // Debounced search function
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      await searchLocations(value);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [value]);

  const searchLocations = async (query) => {
    setIsLoading(true);
    setError(null);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=10` +
      `&countrycodes=ae` +
      `&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SmartBusRoutePlanner/1.0'
        }
      }
    );

    if (!response.ok) {
      setError('Failed to search locations. Please try again.');
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoading(false);
      return;
    }

    const data = await response.json();
    console.log('Search results:', data); // Debug log
    
    // Filter to show only Abu Dhabi results
    const abuDhabiResults = data.filter(item => 
      item.display_name.toLowerCase().includes('abu dhabi') ||
      item.display_name.toLowerCase().includes('أبو ظبي')
    );
    
    console.log('Filtered Abu Dhabi results:', abuDhabiResults); // Debug log
    setSuggestions(abuDhabiResults);
    setShowDropdown(abuDhabiResults.length > 0);
    setIsLoading(false);
  };

  const handleSelectSuggestion = (suggestion) => {
    const displayName = suggestion.display_name.split(',').slice(0, 2).join(',');
    onChange({
      target: {
        value: displayName
      }
    }, {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      fullAddress: suggestion.display_name
    });
    setShowDropdown(false);
    setSuggestions([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    onChange(e);
    if (e.target.value.length >= 3) {
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
        />
        
        {isLoading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {error && (
          <div className={styles.errorTooltip}>
            {error}
          </div>
        )}

        {showDropdown && suggestions.length > 0 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {suggestions.map((suggestion) => {
              const mainAddress = suggestion.display_name.split(',').slice(0, 2).join(',');
              const subAddress = suggestion.display_name.split(',').slice(2, 4).join(',');
              
              return (
                <div
                  key={suggestion.place_id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className={styles.locationIcon}>📍</div>
                  <div className={styles.addressInfo}>
                    <div className={styles.mainAddress}>{mainAddress}</div>
                    <div className={styles.subAddress}>{subAddress}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}s

        {showDropdown && !isLoading && !error && suggestions.length === 0 && value.length >= 3 && (
          <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.noResults}>
              No locations found in Abu Dhabi
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;