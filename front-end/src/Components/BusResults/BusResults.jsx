import { useEffect, useRef } from 'react';
import { Clock, DollarSign, MapPin, GitMerge, Star, Navigation, ArrowRight, Bookmark, BookmarkCheck, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRouteLabel } from '../../utils/routeLabels';
import styles from './BusResults.module.css';

const BusResults = ({
  buses, onSelectBus, selectedBus, loading,
  onSaveJourney, isSavingJourney, journeyAlreadySaved,
  user, walletBalance = null
}) => {
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

  const getLabelStyle = (color) => {
    if (color === 'gold') return { background: 'rgba(240,165,0,0.15)', color: 'var(--gold)' };
    if (color === 'teal') return { background: 'rgba(0,201,167,0.12)', color: 'var(--teal)' };
    return { background: 'var(--bg-page)', color: 'var(--text-muted)' };
  };

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2>
            <Star size={20} color="#667eea" />
            {t('results.title')}
          </h2>
        </div>

      </div>

      <div className={styles.resultsContainer}>
        {buses.map((bus, index) => {
          const isSelected = selectedBus?.busId === bus.busId;
          const label      = getRouteLabel(bus, buses);

          const routeDisplay = bus.journeyType === 'transfer' && bus.leg1 && bus.leg2
            ? `${bus.leg1.routeNumber} → ${bus.leg2.routeNumber}`
            : bus.routeNumber;

          // Always whole number — both direct (already integer) and transfer (now rounded in backend)
          const ridingTime      = Math.round(bus.travelTime);
          // door-to-door: walk + wait + ride — falls back to riding time if missing
          const totalJourney    = Math.round(bus.totalJourneyTime ?? bus.travelTime);
          // For direct: travelTime IS the riding time. Show it in the board sub-line.
          const directRideLabel = bus.journeyType !== 'transfer' ? ridingTime : null;

          return (
            <div
              key={bus.busId}
              ref={(el) => { cardRefs.current[bus.busId] = el; }}
              className={`${styles.busCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectBus(bus)}
            >
              {user && onSaveJourney && (
                <button
                  className={`${styles.saveIcon} ${journeyAlreadySaved ? styles.saveIconSaved : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSaveJourney(); }}
                  disabled={isSavingJourney || journeyAlreadySaved}
                  title={journeyAlreadySaved ? t('results.saved') : t('results.saveJourney')}
                >
                  {isSavingJourney
                    ? <span className={styles.saveBtnSpinner} />
                    : journeyAlreadySaved
                      ? <BookmarkCheck size={14} />
                      : <Bookmark size={14} />
                  }
                </button>
              )}

              <div className={styles.cardTopRow}>
                <div
                  className={styles.busNumber}
                  style={{ backgroundColor: bus.color || '#667eea' }}
                >
                  {routeDisplay}
                </div>

                <div className={styles.busInfo}>
                  <div className={styles.stopRow}>
                    <span className={styles.stopFrom}>{bus.originStop?.name?.split(',')[0]}</span>
                    <ArrowRight size={11} className={styles.stopArrow} />
                    <span className={styles.stopTo}>{bus.destinationStop?.name?.split(',')[0]}</span>
                  </div>
                  <div className={styles.badges}>
                    {bus.journeyType === 'transfer'
                      ? <span className={styles.transferBadge}>{t('results.transfer')}</span>
                      : <span className={styles.directBadge}>{t('results.direct')}</span>
                    }
                  </div>
                </div>
              </div>

              <div className={styles.topsisLabel} style={getLabelStyle(label.color)}>
                {label.text}
              </div>

              <div className={styles.criteria}>
                <div className={styles.criteriaItem}>
                  <Navigation size={15} color="#667eea" />
                  <span className={styles.criteriaLabel}>{t('results.departs')}</span>
                  <span className={styles.criteriaValue}>
                    {bus.departureTime || `${bus.arrivalTime} ${t('results.minutes')}`}
                  </span>
                </div>

                <div className={styles.criteriaItem}>
                  <Clock size={15} color="#667eea" />
                  <span className={styles.criteriaLabel}>{t('results.wait')}</span>
                  <span className={styles.criteriaValue}>{bus.arrivalTime} {t('results.minutes')}</span>
                </div>

                {/* Riding time only — not door-to-door */}
                <div className={styles.criteriaItem}>
                  <Clock size={15} color="#9C27B0" />
                  <span className={styles.criteriaLabel}>{t('results.journey')}</span>
                  <span className={styles.criteriaValue}>{ridingTime} {t('results.minutes')}</span>
                </div>

                <div className={styles.criteriaItem}>
                  <CreditCard size={15} color="#4CAF50" />
                  <span className={styles.criteriaLabel}>{t('results.fare')}</span>
                  <span className={styles.criteriaValue}>
                    <span className={styles.nolFare}>
                      {t('results.nol')} {bus.nolFare ?? bus.cost} {t('results.aed')}
                    </span>
                    <span className={styles.cashFare}>
                      {t('results.cash')} {bus.cashFare ?? (bus.cost + 1)} {t('results.aed')}
                    </span>
                  </span>
                </div>

                {walletBalance !== null && walletBalance < (bus.nolFare ?? bus.cost) && (
                  <div className={`${styles.criteriaItem} ${styles.balanceWarn}`}>
                    <DollarSign size={13} color="var(--error)" />
                    <span className={styles.warnText}>
                      {t('results.topUpNeeded', {
                        amount: ((bus.nolFare ?? bus.cost) - walletBalance).toFixed(2)
                      })}
                    </span>
                  </div>
                )}

                <div className={styles.criteriaItem}>
                  <MapPin size={15} color="#FF9800" />
                  <span className={styles.criteriaLabel}>{t('results.walk')}</span>
                  <span className={styles.criteriaValue}>
                    {bus.walkingDistance} {t('results.km')} ({bus.walkingTime} {t('results.minutes')})
                  </span>
                </div>

                <div className={styles.criteriaItem}>
                  <GitMerge size={15} color="#F44336" />
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

              {isSelected && (
                <div className={styles.timeline}>

                  <div className={styles.timelineStep}>
                    <div className={`${styles.timelineDot} ${styles.dotWalk}`}>🚶</div>
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineTitle}>
                        {t('results.walkTo')} {bus.originStop?.name}
                      </p>
                      <p className={styles.timelineSub}>
                        {bus.walkingDistance} {t('results.km')} · {bus.walkingTime} {t('results.minutes')}
                      </p>
                    </div>
                  </div>

                  <div className={styles.timelineStep}>
                    <div className={`${styles.timelineDot} ${styles.dotBus}`}>🚌</div>
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineTitle}>
                        {t('results.board')} {bus.journeyType === 'transfer' ? bus.leg1?.routeNumber : bus.routeNumber}
                      </p>
                      <p className={styles.timelineSub}>
                        {bus.journeyType === 'transfer' ? bus.leg1?.routeName : bus.routeName}
                        {bus.journeyType === 'transfer' && bus.leg1?.duration
                          ? ` · ${Math.round(bus.leg1.duration)} ${t('results.minutes')}`
                          : directRideLabel
                          ? ` · ${directRideLabel} ${t('results.minutes')}`
                          : ''
                        }
                      </p>
                    </div>
                    <span className={styles.timelineTime}>{bus.departureTime}</span>
                  </div>

                  {bus.journeyType === 'transfer' && bus.transferStop && (
                    <div className={styles.timelineStep}>
                      <div className={`${styles.timelineDot} ${styles.dotTransfer}`}>🔄</div>
                      <div className={styles.timelineContent}>
                        <p className={styles.timelineTitle}>
                          {t('results.transferAt')} {bus.transferStop?.name}
                        </p>
                        <p className={styles.timelineSub}>
                          {t('results.boardNext')} {bus.leg2?.routeNumber}
                          {bus.leg2?.duration
                            ? ` · ${Math.round(bus.leg2.duration)} ${t('results.minutes')}`
                            : ''
                          }
                        </p>
                      </div>
                      <span className={styles.timelineTime}>{bus.leg2?.departureTime}</span>
                    </div>
                  )}

                  <div className={styles.timelineStep}>
                    <div className={`${styles.timelineDot} ${styles.dotArrive}`}>📍</div>
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineTitle}>
                        {t('results.arrive')} {bus.destinationStop?.name}
                      </p>
                      
                      <p className={styles.timelineSub}>
                        {t('results.totalJourney')} {totalJourney} {t('results.minutes')}
                      </p>
                    </div>
                    {bus.destinationArrivalTime && (
                      <span className={styles.timelineTime}>{bus.destinationArrivalTime}</span>
                    )}
                  </div>

                </div>
              )}

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