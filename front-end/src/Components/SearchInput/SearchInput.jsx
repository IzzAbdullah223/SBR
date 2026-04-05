import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X } from 'lucide-react';
import styles from './SearchInput.module.css';

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN;

const SearchInput = ({
  value,
  onChange,
  placeholder,
  label,
  disableSuggestions = false,
  pinnedStop  = null,   // bus stop object { stopId, name, position } — replaces input with pill
  onClearPin  = null,   // called when user clicks X on the pinned pill
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [suggestions,   setSuggestions]   = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [error,         setError]         = useState(null);
  const dropdownRef     = useRef(null);
  const inputRef        = useRef(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        inputRef.current   && !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (disableSuggestions || pinnedStop) {
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    if (value.length < 2) { setSuggestions([]); setShowDropdown(false); setError(null); return; }

    const delayDebounce = setTimeout(async () => {
      await searchLocations(value);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [value, disableSuggestions, pinnedStop]);

  const searchLocations = async (query) => {
    if (!LOCATIONIQ_TOKEN || LOCATIONIQ_TOKEN === 'undefined') {
      setError(t('search.tokenError'));
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const lang = isArabic ? 'ar' : 'en';
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?` +
        `key=${LOCATIONIQ_TOKEN}` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=ae` +
        `&limit=10` +
        `&accept-language=${lang}` +
        `&normalizecity=1`
      );
      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API token');
        throw new Error('Search failed');
      }
      const data = await response.json();
      const dubaiResults = data.filter(item => {
        const displayName = item.display_name?.toLowerCase() || '';
        return displayName.includes('dubai') ||
               displayName.includes('دبي')   ||
               displayName.includes('إمارة دبي');
      });
      const formattedResults = dubaiResults.map(item => ({
        place_id:     item.place_id,
        display_name: item.display_name,
        name:         item.display_name.split(',')[0].trim(),
        lat:          parseFloat(item.lat),
        lng:          parseFloat(item.lon),
        type:         item.type || 'place',
        address:      item.address || {},
        isLocationIQ: true,
      }));
      setSuggestions(formattedResults);
      setShowDropdown(formattedResults.length > 0);
    } catch (err) {
      if (err.message === 'Invalid API token') setError(t('search.invalidToken'));
      else setError(t('search.unavailable'));
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    justSelectedRef.current = true;
    onChange(
      { target: { value: suggestion.name } },
      { lat: suggestion.lat, lng: suggestion.lng, fullAddress: suggestion.display_name }
    );
    setShowDropdown(false);
    setSuggestions([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    onChange(e);
    if (!disableSuggestions && e.target.value.length >= 2) setShowDropdown(true);
    else if (e.target.value.length < 2) setShowDropdown(false);
  };

  return (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <div className={styles.inputWrapper}>

        {/* ── Pinned stop pill — replaces the text input ── */}
        {pinnedStop ? (
          <div className={styles.pinnedPill}>
            <MapPin size={13} className={styles.pinnedIcon} />
            <span className={styles.pinnedName}>{pinnedStop.name.split(',')[0]}</span>
            <button
              className={styles.pinnedClear}
              onClick={onClearPin}
              title={t('home.clearPin')}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                if (!disableSuggestions && !justSelectedRef.current && suggestions.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className={styles.searchInput}
              autoComplete="off"
              dir={isArabic ? 'rtl' : 'ltr'}
            />

            {isLoading && (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}

            {error && <div className={styles.errorTooltip}>{error}</div>}

            {showDropdown && suggestions.length > 0 && (
              <div ref={dropdownRef} className={styles.dropdown}>
                {suggestions.map((suggestion, index) => {
                  const parts       = suggestion.display_name.split(',');
                  const mainAddress = parts[0].trim();
                  const subAddress  = parts.slice(1, 3).join(',').trim();
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
                <div className={styles.noResults}>{t('search.noResults')}</div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default SearchInput;