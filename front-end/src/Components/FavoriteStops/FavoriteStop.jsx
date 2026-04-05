import { Star, MapPin, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './FavoriteStops.module.css';

const FavoriteStops = ({ favoriteStops, user, onStopClick, onDelete, isOpen, onToggle }) => {
  const { t } = useTranslation();

  if (!user) return null;

  // ── COLLAPSED STATE ────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.collapsedRow}>
          <button className={styles.toggleChip} onClick={onToggle} title={t('stops.myStops')}>
            <Star size={13} className={styles.toggleChipIcon} />
            <span className={styles.toggleChipLabel}>{t('stops.myStops')}</span>
            {favoriteStops.length > 0 && (
              <span className={styles.toggleChipCount}>{favoriteStops.length}</span>
            )}
          </button>

          {favoriteStops.length > 0 && (
            <div className={styles.chipsRail}>
              {favoriteStops.map((stop) => (
                <button
                  key={stop.stopId}
                  className={styles.chip}
                  onClick={() => onStopClick(stop)}
                  title={stop.name}
                >
                  <div className={styles.chipDot} />
                  <span>{stop.name.split(',')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EXPANDED STATE ─────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>

        <div className={styles.panelHeader}>
          <div className={styles.panelTitleRow}>
            <div className={styles.panelIconBox}>
              <Star size={15} className={styles.panelIcon} />
            </div>
            <span className={styles.panelTitle}>{t('stops.myStops')}</span>
            {favoriteStops.length > 0 && (
              <span className={styles.panelCount}>
                {t('stops.savedCount', { count: favoriteStops.length })}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onToggle} title={t('stops.close')}>
            <X size={14} />
          </button>
        </div>

        {favoriteStops.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>⭐</div>
            <p className={styles.emptyTitle}>{t('stops.empty')}</p>
            <p className={styles.emptySubtitle}>{t('stops.emptySubtitle')}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {favoriteStops.map((stop) => (
              <div
                key={stop.stopId}
                className={styles.card}
                onClick={() => { onStopClick(stop); onToggle(); }}
              >
                <div className={styles.stopIconBox}>
                  <MapPin size={13} className={styles.stopIcon} />
                </div>

                <div className={styles.stopInfo}>
                  <span className={styles.stopName}>{stop.name.split(',')[0]}</span>
                  <span className={styles.stopId}>{stop.stopId}</span>
                </div>

                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(stop.stopId); }}
                  title={t('stops.remove')}
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

export default FavoriteStops;