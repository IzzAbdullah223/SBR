import { useState, useEffect } from 'react';
import { MapPin, X, Star, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './BusStopCard.module.css';

const getNextDepartures = (frequencyMin, count = 3) => {
  const now = new Date();
  const firstOffset = Math.floor(Math.random() * 5) + 1;
  return Array.from({ length: count }, (_, i) => {
    const minsFromNow = firstOffset + i * frequencyMin;
    const time = new Date(now.getTime() + minsFromNow * 60000);
    return {
      minsFromNow,
      formatted: time.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  });
};

const BusStopCard = ({
  stop,
  loadingStop      = false,
  onClose,
  isFavorite       = false,
  onAddFavorite,
  onRemoveFavorite,
  user,
}) => {
  const { t } = useTranslation();
  const [departures, setDepartures] = useState({});
  const [favPending, setFavPending] = useState(false);

  useEffect(() => {
    if (!stop?.routes?.length) return;
    const board = {};
    stop.routes.forEach(route => {
      const freq = route.schedule?.weekday?.frequency || 15;
      board[route.routeNumber] = getNextDepartures(freq, 3);
    });
    setDepartures(board);
  }, [stop?.routes]);

  const handleFavoriteToggle = async () => {
    if (!user || favPending) return;
    setFavPending(true);
    try {
      isFavorite ? await onRemoveFavorite(stop.stopId) : await onAddFavorite(stop);
    } finally {
      setFavPending(false);
    }
  };

  if (!stop) return null;

  return (
    <div className={styles.card}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={16} />
      </button>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerIcon}><MapPin size={16} /></div>
        <div className={styles.headerText}>
          <h3 className={styles.stopName}>{stop.name}</h3>
          <p className={styles.stopId}>{t('map.stopId')} {stop.stopId}</p>
        </div>
        {user && (
          <button
            className={`${styles.starBtn} ${isFavorite ? styles.starred : ''}`}
            onClick={handleFavoriteToggle}
            disabled={favPending}
            title={isFavorite ? t('stopCard.unfavorite') : t('stopCard.favorite')}
          >
            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {loadingStop ? (
        <div className={styles.loadingRow}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.content}>

          {/* ── Departure Board ── */}
          {stop.routes && stop.routes.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                <Clock size={12} />
                {t('stopCard.nextDepartures')}
              </p>
              <div className={styles.departureBoard}>
                {stop.routes.map((route) => {
                  const deps = departures[route.routeNumber] || [];
                  return (
                    <div key={route.routeNumber} className={styles.departureRow}>
                      <span
                        className={styles.routeBadge}
                        style={{ background: route.color || '#667eea' }}
                      >
                        {route.routeNumber}
                      </span>
                      <div className={styles.departureTimes}>
                        {deps.map((d, i) => (
                          <span key={i} className={styles.departureTime}>
                            {d.minsFromNow < 1
                              ? t('stopCard.now')
                              : d.minsFromNow < 60
                              ? `${d.minsFromNow} ${t('stopCard.min')}`
                              : d.formatted}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Coordinates ── */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>{t('stopCard.location')}</p>
            <p className={styles.coordinates}>
              {stop.position.lat.toFixed(5)}, {stop.position.lng.toFixed(5)}
            </p>
          </div>

          {/* ── Amenities ── */}
          {stop.amenities && stop.amenities.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>{t('stopCard.amenities')}</p>
              <ul className={styles.amenitiesList}>
                {stop.amenities.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusStopCard;