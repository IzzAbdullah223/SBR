import { useEffect, useRef } from 'react';
import { Clock, DollarSign, MapPin, GitMerge, Star, Award, Navigation, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './BusResults.module.css';

const BusResults = ({ buses, onSelectBus, selectedBus, loading, onSaveJourney, isSavingJourney, journeyAlreadySaved, user }) => {
  const { t } = useTranslation();
  const cardRefs = useRef({});

  useEffect(() => {
    if (!selectedBus?.busId) return;
    const el = cardRefs.current[selectedBus.busId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedBus?.busId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('results.findingRoutes')}</p>
      </div>
    );
  }

  if (!buses || buses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('results.emptyState')}</p>
      </div>
    );
  }

  const getMedalIcon = (index) => {
    if (index === 0) return <Award size={24} color="#FFD700" fill="#FFD700" />;
    if (index === 1) return <Award size={24} color="#C0C0C0" fill="#C0C0C0" />;
    if (index === 2) return <Award size={24} color="#CD7F32" fill="#CD7F32" />;
    return <span className={styles.rank}>#{index + 1}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return '#4CAF50';
    if (score >= 0.4) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2>
            <Star size={24} color="#667eea" />
            {t('results.title')}
          </h2>
          {user && onSaveJourney && (
            <button
              className={`${styles.saveBtn} ${journeyAlreadySaved ? styles.saveBtnSaved : ''}`}
              onClick={onSaveJourney}
              disabled={isSavingJourney || journeyAlreadySaved}
              title={journeyAlreadySaved ? t('results.saved') : t('results.saveJourney')}
            >
              {isSavingJourney ? (
                <span className={styles.saveBtnSpinner} />
              ) : journeyAlreadySaved ? (
                <BookmarkCheck size={15} />
              ) : (
                <Bookmark size={15} />
              )}
              <span>{journeyAlreadySaved ? t('results.saved') : t('results.saveJourney')}</span>
            </button>
          )}
        </div>
        <p className={styles.subtitle}>
          {t('results.subtitle', { count: buses.length })}
        </p>
      </div>

      <div className={styles.resultsContainer}>
        {buses.map((bus, index) => {
          const isSelected = selectedBus?.busId === bus.busId;
          const scoreColor = getScoreColor(bus.score);

          return (
            <div
              key={bus.busId}
              ref={(el) => { cardRefs.current[bus.busId] = el; }}
              className={`${styles.busCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectBus(bus)}
            >
              <div className={styles.medal}>{getMedalIcon(index)}</div>

              <div className={styles.busHeader}>
                <div className={styles.busNumber} style={{ backgroundColor: bus.color || '#667eea' }}>
                  {bus.routeNumber}
                </div>
                <div className={styles.busInfo}>
                  <h3>{bus.routeName}</h3>
                  <div className={styles.badges}>
                    <span className={styles.busType}>{bus.routeType}</span>
                    {bus.journeyType === 'transfer' ? (
                      <span className={styles.transferBadge}>{t('results.transfer')}</span>
                    ) : (
                      <span className={styles.directBadge}>{t('results.direct')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.scoreSection}>
                <div className={styles.scoreLabel}>{t('results.topsisScore')}</div>
                <div className={styles.score} style={{ color: scoreColor }}>
                  {(bus.score * 100).toFixed(1)}%
                </div>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreBarFill}
                    style={{ width: `${bus.score * 100}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>

              <div className={styles.criteria}>
                <div className={styles.criteriaItem}>
                  <Navigation size={16} color="#667eea" />
                  <span className={styles.criteriaLabel}>{t('results.departs')}</span>
                  <span className={styles.criteriaValue}>
                    {bus.departureTime || `${bus.arrivalTime} ${t('results.minutes')}`}
                  </span>
                </div>

                <div className={styles.criteriaItem}>
                  <Clock size={16} color="#667eea" />
                  <span className={styles.criteriaLabel}>{t('results.wait')}</span>
                  <span className={styles.criteriaValue}>{bus.arrivalTime} {t('results.minutes')}</span>
                </div>

                <div className={styles.criteriaItem}>
                  <Clock size={16} color="#9C27B0" />
                  <span className={styles.criteriaLabel}>{t('results.journey')}</span>
                  <span className={styles.criteriaValue}>{bus.travelTime} {t('results.minutes')}</span>
                </div>

                <div className={styles.criteriaItem}>
                  <DollarSign size={16} color="#4CAF50" />
                  <span className={styles.criteriaLabel}>{t('results.fare')}</span>
                  <span className={styles.criteriaValue}>{bus.cost} {t('results.aed')}</span>
                </div>

                <div className={styles.criteriaItem}>
                  <MapPin size={16} color="#FF9800" />
                  <span className={styles.criteriaLabel}>{t('results.walk')}</span>
                  <span className={styles.criteriaValue}>
                    {bus.walkingDistance} {t('results.km')} ({bus.walkingTime} {t('results.minutes')})
                  </span>
                </div>

                <div className={styles.criteriaItem}>
                  <GitMerge size={16} color="#F44336" />
                  <span className={styles.criteriaLabel}>{t('results.transfers')}</span>
                  <span className={styles.criteriaValue}>{bus.transfers}</span>
                </div>
              </div>

              {bus.upcomingDepartures && bus.upcomingDepartures.length > 1 && (
                <div className={styles.upcomingDepartures}>
                  <span className={styles.upcomingLabel}>{t('results.alsoDeparts')}</span>
                  <div className={styles.upcomingTimes}>
                    {bus.upcomingDepartures.slice(1).map((dep, i) => (
                      <span key={i} className={styles.upcomingTime}>
                        {dep.departureTime}
                        <span className={styles.upcomingWait}>+{dep.minutesFromNow} {t('results.minutes')}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {bus.journeyType === 'transfer' && bus.leg1 && bus.leg2 && (
                <div className={styles.transferDetails}>
                  <div className={styles.leg}>
                    <span className={styles.legBadge} style={{ backgroundColor: bus.color }}>
                      {bus.leg1.routeNumber}
                    </span>
                    <span className={styles.legName}>{bus.leg1.routeName}</span>
                    <span>{bus.leg1.departureTime}</span>
                  </div>
                  <ArrowRight size={16} className={styles.legArrow} />
                  <div className={styles.leg}>
                    <span className={styles.legBadge} style={{ backgroundColor: '#667eea' }}>
                      {bus.leg2.routeNumber}
                    </span>
                    <span className={styles.legName}>{bus.leg2.routeName}</span>
                    <span>{bus.leg2.departureTime}</span>
                  </div>
                </div>
              )}

              <div className={styles.stopNames}>
                <span className={styles.originStop}>📍 {bus.originStop?.name}</span>
                <ArrowRight size={14} />
                <span className={styles.destStop}>🏁 {bus.destinationStop?.name}</span>
              </div>

              <button className={`${styles.selectButton} ${isSelected ? styles.selectedBtn : ''}`}>
                {isSelected ? t('results.selected') : t('results.viewOnMap')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusResults;