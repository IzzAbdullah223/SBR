import { Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './FavoriteStops.module.css';

const FavoriteStops = ({ favoriteStops, user, onStopClick }) => {
  const { t } = useTranslation();

  // Only render when logged in and has favorites
  if (!user || !favoriteStops || favoriteStops.length === 0) return null;

  return (
    <div className={styles.row}>
      <div className={styles.label}>
        <Star size={12} className={styles.starIcon} />
        <span>{t('stops.myStops')}</span>
        <span className={styles.count}>{favoriteStops.length}</span>
      </div>

      <div className={styles.chipsRail}>
        {favoriteStops.map((stop) => (
          <button
            key={stop.stopId}
            className={styles.chip}
            onClick={() => onStopClick(stop)}
            title={stop.name}
          >
            <MapPin size={11} className={styles.chipIcon} />
            <span className={styles.chipLabel}>
              {stop.name.split(',')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FavoriteStops;