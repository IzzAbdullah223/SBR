// SavedRoutes.jsx
// Displays the user's saved/favourite routes in the left sidebar panel
// Shows a "no saved routes" message when the list is empty
// Each card has the route number, origin → destination, and a remove button

import React from 'react';
import { Bookmark, Trash2, Clock, Bus } from 'lucide-react';
import styles from './SavedRoutes.module.css';

const SavedRoutes = ({ savedRoutes, loading, onDelete, user }) => {

  // ── NOT LOGGED IN ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className={styles.emptyState}>
        <Bookmark size={32} className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>Log in to save routes</p>
        <p className={styles.emptySubtitle}>
          Your favourite routes will appear here after you log in.
        </p>
      </div>
    );
  }

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading your saved routes...</p>
      </div>
    );
  }

  // ── EMPTY STATE ────────────────────────────────────────────────────────────
  // user is logged in but has no saved routes yet
  if (!savedRoutes || savedRoutes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Bookmark size={32} className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>No saved routes yet</p>
        <p className={styles.emptySubtitle}>
          Search for a route and click <strong>"Add to Favourites"</strong> to save it here.
        </p>
      </div>
    );
  }

  // ── SAVED ROUTES LIST ──────────────────────────────────────────────────────
  return (
    <div className={styles.list}>
      {savedRoutes.map((route) => (
        <div key={route._id} className={styles.card}>

          {/* Route number badge — coloured with the route's own colour */}
          <div
            className={styles.routeBadge}
            style={{ backgroundColor: route.routeColor || '#667eea' }}
          >
            <Bus size={12} />
            <span>{route.routeNumber}</span>
          </div>

          {/* Route name */}
          <p className={styles.routeName}>{route.routeName}</p>

          {/* Origin and destination */}
          <div className={styles.routeStops}>
            <span className={styles.stopLabel}>From</span>
            <span className={styles.stopName}>{route.origin?.name}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.stopLabel}>To</span>
            <span className={styles.stopName}>{route.destination?.name}</span>
          </div>

          {/* Journey type + estimated time */}
          <div className={styles.meta}>
            {route.journeyType && (
              <span className={styles.metaBadge}>
                {route.journeyType === 'direct' ? '🟢 Direct' : '🔄 Transfer'}
              </span>
            )}
            {route.estimatedTime != null && (
              <span className={styles.metaBadge}>
                <Clock size={11} />
                {route.estimatedTime} min
              </span>
            )}
          </div>

          {/* Delete button */}
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(route._id)}
            title="Remove from favourites"
          >
            <Trash2 size={14} />
          </button>

        </div>
      ))}
    </div>
  );
};

export default SavedRoutes;