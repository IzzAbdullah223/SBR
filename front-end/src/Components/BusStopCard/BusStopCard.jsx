import { MapPin, Bus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './BusStopCard.module.css';

const BusStopCard = ({ stop, loadingStop = false, onClose }) => {
  const { t } = useTranslation();

  if (!stop) return null;

  return (
    <div className={styles.card}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={16} />
      </button>

      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <MapPin size={16} />
        </div>
        <div>
          <h3 className={styles.stopName}>{stop.name}</h3>
          <p className={styles.stopId}>{t('map.stopId')} {stop.stopId}</p>
        </div>
      </div>

      {loadingStop ? (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <p className={styles.sectionLabel}>{t('stopCard.location')}</p>
            <p className={styles.coordinates}>
              {stop.position.lat.toFixed(6)}, {stop.position.lng.toFixed(6)}
            </p>
          </div>

          {stop.routes && stop.routes.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                <Bus size={12} />
                {t('stopCard.availableRoutes', { count: stop.routes.length })}
              </p>
              <div className={styles.routeBadges}>
                {stop.routes.map((route) => (
                  <span key={route.routeNumber ?? route} className={styles.routeBadge}>
                    {route.routeNumber ?? route}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stop.amenities && stop.amenities.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>{t('stopCard.amenities')}</p>
              <ul className={styles.amenitiesList}>
                {stop.amenities.map((amenity, i) => (
                  <li key={i}>{amenity}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BusStopCard;