import { Bookmark, Trash2, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './SavedRoutes.module.css';

const SavedRoutes = ({ savedRoutes, loading, onDelete, onSelectJourney, user, isOpen, onToggle }) => {
  const { t } = useTranslation();

  // ── COLLAPSED STATE ──────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.collapsedRow}>
          <button className={styles.toggleChip} onClick={onToggle} title={t('saved.title')}>
            <Bookmark size={13} className={styles.toggleChipIcon} />
            <span className={styles.toggleChipLabel}>{t('saved.buttonLabel')}</span>
            {user && savedRoutes.length > 0 && (
              <span className={styles.toggleChipCount}>{savedRoutes.length}</span>
            )}
          </button>

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
                  <span>{route.destination?.name?.split(',')[0]}</span>
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

        <div className={styles.panelHeader}>
          <div className={styles.panelTitleRow}>
            <div className={styles.panelIconBox}>
              <Bookmark size={15} className={styles.panelIcon} />
            </div>
            <span className={styles.panelTitle}>{t('saved.title')}</span>
            {user && savedRoutes.length > 0 && (
              <span className={styles.panelCount}>
                {t('saved.savedCount', { count: savedRoutes.length })}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onToggle} title={t('saved.close')}>
            <X size={14} />
          </button>
        </div>

        {!user && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>🔖</div>
            <p className={styles.emptyTitle}>{t('saved.loginToSave')}</p>
            <p className={styles.emptySubtitle}>{t('saved.loginSubtitle')}</p>
          </div>
        )}

        {user && loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>{t('saved.loading')}</p>
          </div>
        )}

        {user && !loading && savedRoutes.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>🗺️</div>
            <p className={styles.emptyTitle}>{t('saved.empty')}</p>
            <p className={styles.emptySubtitle}>{t('saved.emptySubtitle')}</p>
          </div>
        )}

        {user && !loading && savedRoutes.length > 0 && (
          <div className={styles.list}>
            {savedRoutes.map((route) => (
              <div
                key={route._id}
                className={styles.card}
                onClick={() => onSelectJourney(route)}
                title={t('saved.title')}
              >
                <div className={styles.connector}>
                  <div className={styles.dotA} />
                  <div className={styles.connLine} />
                  <div className={styles.dotB} />
                </div>

                <div className={styles.journey}>
                  <span className={styles.routeFrom}>{route.origin?.name}</span>
                  <span className={styles.routeTo}>{route.destination?.name}</span>
                </div>

                <ArrowRight size={15} className={styles.goArrow} />

                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDelete(route._id); }}
                  title={t('saved.remove')}
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