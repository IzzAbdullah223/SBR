// SavedRoutes.jsx — Citymapper-inspired two-state design
//
// COLLAPSED → horizontal scrollable chips row (like Citymapper's "Go to Home / Work")
//   clicking any chip instantly loads that journey
//   clicking the bookmark button opens the full panel
//
// EXPANDED → full panel with all saved routes, connector dots, delete on hover

import React from 'react';
import { Bookmark, Trash2, X, ArrowRight } from 'lucide-react';
import styles from './SavedRoutes.module.css';

const SavedRoutes = ({
  savedRoutes,
  loading,
  onDelete,
  onSelectJourney,
  user,
  isOpen,
  onToggle,
}) => {

  // ── COLLAPSED STATE ──────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.collapsedRow}>

          {/* bookmark pill button — opens full panel */}
          <button className={styles.toggleChip} onClick={onToggle} title="View saved routes">
            <Bookmark size={13} className={styles.toggleChipIcon} />
            <span className={styles.toggleChipLabel}>Saved</span>
            {user && savedRoutes.length > 0 && (
              <span className={styles.toggleChipCount}>{savedRoutes.length}</span>
            )}
          </button>

          {/* quick-access chips — one per saved destination */}
          {user && savedRoutes.length > 0 && (
            <div className={styles.chipsRail}>
              {savedRoutes.map((route) => (
                <button
                  key={route._id}
                  className={styles.chip}
                  onClick={() => onSelectJourney(route)}
                  title={`${route.origin?.name} → ${route.destination?.name}`}
                >
                  <div className={styles.chipDot} />
                  {/* show destination name only — origin is implied */}
                  {route.destination?.name?.split(',')[0]}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── EXPANDED STATE ───────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>

        {/* Panel header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleRow}>
            <div className={styles.panelIconBox}>
              <Bookmark size={15} className={styles.panelIcon} />
            </div>
            <span className={styles.panelTitle}>Saved Routes</span>
            {user && savedRoutes.length > 0 && (
              <span className={styles.panelCount}>{savedRoutes.length} saved</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onToggle} title="Close">
            <X size={14} />
          </button>
        </div>

        {/* Not logged in */}
        {!user && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>🔖</div>
            <p className={styles.emptyTitle}>Log in to save routes</p>
            <p className={styles.emptySubtitle}>
              Your favourite journeys will appear here after you sign in.
            </p>
          </div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading saved routes...</p>
          </div>
        )}

        {/* Empty — logged in but nothing saved */}
        {user && !loading && savedRoutes.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>🗺️</div>
            <p className={styles.emptyTitle}>No saved routes yet</p>
            <p className={styles.emptySubtitle}>
              Search for a route and tap <strong>"Save Journey"</strong> to pin it here for quick access.
            </p>
          </div>
        )}

        {/* Route list */}
        {user && !loading && savedRoutes.length > 0 && (
          <div className={styles.list}>
            {savedRoutes.map((route) => (
              <div
                key={route._id}
                className={styles.card}
                onClick={() => onSelectJourney(route)}
                title="Tap to load this journey"
              >
                {/* Connector dots */}
                <div className={styles.connector}>
                  <div className={styles.dotA} />
                  <div className={styles.connLine} />
                  <div className={styles.dotB} />
                </div>

                {/* Origin → Destination */}
                <div className={styles.journey}>
                  <span className={styles.routeFrom}>{route.origin?.name}</span>
                  <span className={styles.routeTo}>{route.destination?.name}</span>
                </div>

                {/* Go arrow (hidden by delete on hover) */}
                <ArrowRight size={15} className={styles.goArrow} />

                {/* Delete — reveals on hover, covers the arrow */}
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(route._id); }}
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SavedRoutes;