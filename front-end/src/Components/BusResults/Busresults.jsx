// BusResults.jsx
// Displays the ranked list of bus route results returned by TOPSIS
// Each card now has an "Add to Favourites" button that calls onSaveRoute
// Props:
//   buses        — array of ranked bus objects from useFindBuses
//   onSelectBus  — called when user clicks a card to highlight it on the map
//   selectedBus  — the currently selected bus (for the "selected" card style)
//   loading      — true while the search is in flight (shows spinner)
//   onSaveRoute  — called with (bus) when user clicks "Add to Favourites"
//   savingId     — busId currently being saved (shows spinner on that button)
//   user         — current logged-in user (null hides the favourite button)
//   savedRoutes  — list of already saved routes from useSavedRoutes hook
//                  used to pre-mark buttons as "Route Saved ✓" on load/refresh

import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, MapPin, GitMerge, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import styles from './BusResults.module.css';

// Returns 🥇 🥈 🥉 for top 3, empty string otherwise
const getMedal = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

// Maps TOPSIS score (0–1) to a colour — green = great, gold = ok, red = poor
const getScoreColor = (score) => {
  if (score >= 0.7) return '#00c9a7';
  if (score >= 0.4) return '#f0a500';
  return '#ff4d6d';
};

const BusResults = ({
  buses,
  onSelectBus,
  selectedBus,
  loading,
  onSaveRoute,   // callback(bus) triggered by "Add to Favourites"
  savingId,      // busId currently being saved (for button spinner)
  user,          // null when logged out (hides favourite button)
  savedRoutes,   // array of already saved routes from useSavedRoutes hook
}) => {

  // savedIds — Set of routeNumbers that have been saved
  // we use routeNumber (not busId) because busId changes every search
  // but routeNumber stays the same — so we can match across refreshes
  const [savedIds, setSavedIds] = useState(new Set());

  // whenever savedRoutes list changes (on load, after saving, after deleting)
  // rebuild the savedIds Set from the routeNumbers in savedRoutes
  // this makes the "Route Saved ✓" state persist across refreshes and new searches
  useEffect(() => {
    if (!savedRoutes || savedRoutes.length === 0) {
      setSavedIds(new Set());
      return;
    }
    // build a Set of routeNumbers that are already saved
    // so we can do fast O(1) lookup per card instead of scanning the array each time
    const alreadySaved = new Set(
      savedRoutes.map((r) => r.routeNumber).filter(Boolean)
    );
    setSavedIds(alreadySaved);
  }, [savedRoutes]);

  // wraps the parent's onSaveRoute
  // if the save succeeds, adds the routeNumber to savedIds so the button updates
  const handleSave = async (bus) => {
    const success = await onSaveRoute(bus);
    // onSaveRoute in useSavedRoutes returns true on success, false on failure
    if (success) {
      // use routeNumber so it persists — busId is regenerated on every search
      setSavedIds((prev) => new Set([...prev, bus.routeNumber]));
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Finding your best routes...</p>
      </div>
    );
  }

  if (!buses || buses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No results to display.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h2>🚌 {buses.length} Route{buses.length !== 1 ? 's' : ''} Found</h2>
        <p className={styles.subtitle}>Ranked by your preferences using TOPSIS</p>
      </div>

      <div className={styles.resultsContainer}>
        {buses.map((bus, index) => {
          const isSelected = selectedBus?.busId === bus.busId;
          // true while this specific card's save request is in flight
          const isSaving = savingId === bus.busId;
          // check by routeNumber so it survives page refreshes and new searches
          const isSaved = savedIds.has(bus.routeNumber);

          return (
            <div
              key={bus.busId}
              className={`${styles.busCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectBus(bus)}
            >

              {/* ── Rank badge ── */}
              <div className={styles.medal}>
                {getMedal(index + 1) || (
                  <span className={styles.rank}>#{index + 1}</span>
                )}
              </div>

              {/* ── Bus number + route name ── */}
              <div className={styles.busHeader}>
                <div
                  className={styles.busNumber}
                  style={{ backgroundColor: bus.color || '#667eea' }}
                >
                  {bus.routeNumber}
                </div>
                <div className={styles.busInfo}>
                  <h3>{bus.routeName || `Route ${bus.routeNumber}`}</h3>
                  <div className={styles.badges}>
                    <span className={styles.busType}>
                      {bus.type === '3' ? 'Bus' : 'Transit'}
                    </span>
                    {bus.journeyType === 'direct' ? (
                      <span className={styles.directBadge}>Direct</span>
                    ) : (
                      <span className={styles.transferBadge}>Transfer</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── TOPSIS score bar ── */}
              <div className={styles.scoreSection}>
                <p className={styles.scoreLabel}>TOPSIS Score</p>
                <p className={styles.score} style={{ color: getScoreColor(bus.score) }}>
                  {(bus.score * 100).toFixed(1)}%
                </p>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreBarFill}
                    style={{
                      width: `${bus.score * 100}%`,
                      backgroundColor: getScoreColor(bus.score),
                    }}
                  />
                </div>
              </div>

              {/* ── Criteria grid ── */}
              <div className={styles.criteria}>
                <div className={styles.criteriaItem}>
                  <Clock size={14} color="#667eea" />
                  <span className={styles.criteriaLabel}>Time</span>
                  <span className={styles.criteriaValue}>{bus.arrivalTime} min</span>
                </div>
                <div className={styles.criteriaItem}>
                  <DollarSign size={14} color="#4CAF50" />
                  <span className={styles.criteriaLabel}>Fare</span>
                  <span className={styles.criteriaValue}>{bus.fare} AED</span>
                </div>
                <div className={styles.criteriaItem}>
                  <MapPin size={14} color="#FF9800" />
                  <span className={styles.criteriaLabel}>Walk</span>
                  <span className={styles.criteriaValue}>
                    {bus.walkingDistance != null
                      ? `${(bus.walkingDistance * 1000).toFixed(0)}m`
                      : '—'}
                  </span>
                </div>
                <div className={styles.criteriaItem}>
                  <GitMerge size={14} color="#F44336" />
                  <span className={styles.criteriaLabel}>Transfers</span>
                  <span className={styles.criteriaValue}>{bus.transfers ?? 0}</span>
                </div>
              </div>

              {/* ── Transfer details (only for transfer journeys) ── */}
              {bus.journeyType === 'transfer' && bus.transferStop && (
                <div className={styles.transferDetails}>
                  <div className={styles.leg}>
                    <span
                      className={styles.legBadge}
                      style={{ backgroundColor: bus.color || '#667eea' }}
                    >
                      {bus.routeNumber}
                    </span>
                    <span className={styles.legName}>
                      {bus.originStop?.name || 'Origin stop'}
                    </span>
                  </div>
                  <ArrowRight size={14} className={styles.legArrow} />
                  <div className={styles.leg}>
                    <span
                      className={styles.legBadge}
                      style={{ backgroundColor: bus.colorLeg2 || '#00c9a7' }}
                    >
                      {bus.routeNumberLeg2}
                    </span>
                    <span className={styles.legName}>
                      {bus.transferStop?.name || 'Transfer stop'}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Stop names ── */}
              {(bus.originStop || bus.destinationStop) && (
                <div className={styles.stopNames}>
                  <span className={styles.originStop}>
                    📍 {bus.originStop?.name || '—'}
                  </span>
                  <ArrowRight size={12} />
                  <span className={styles.destStop}>
                    🏁 {bus.destinationStop?.name || '—'}
                  </span>
                </div>
              )}

              {/* ── Action buttons row ── */}
              <div className={styles.actionRow}>

                {/* View on Map button */}
                <button
                  className={`${styles.selectButton} ${isSelected ? styles.selectedBtn : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBus(bus);
                  }}
                >
                  {isSelected ? '✓ Selected' : 'View on Map'}
                </button>

                {/* Add to Favourites — only shown when user is logged in */}
                {user && onSaveRoute && (
                  <button
                    className={`${styles.favouriteButton} ${isSaved ? styles.savedBtn : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // don't allow clicking again if already saved
                      if (!isSaved) handleSave(bus);
                    }}
                    // disabled while saving OR after already saved successfully
                    disabled={isSaving || isSaved}
                    title={isSaved ? 'Already saved to favourites' : 'Add to Favourites'}
                  >
                    {isSaving ? (
                      <span className={styles.savingSpinner} />
                    ) : isSaved ? (
                      <BookmarkCheck size={14} />
                    ) : (
                      <Bookmark size={14} />
                    )}
                    <span>
                      {isSaving ? 'Saving...' : isSaved ? 'Route Saved ✓' : 'Add to Favourites'}
                    </span>
                  </button>
                )}

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusResults;