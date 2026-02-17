/**
 * BUS RESULTS COMPONENT
 * Displays ranked buses from TOPSIS algorithm
 */

import React from 'react';
import { Clock, DollarSign, MapPin, GitMerge, Star, Award, Navigation, ArrowRight } from 'lucide-react';
import styles from './BusResults.module.css';

const BusResults = ({ buses, onSelectBus, selectedBus, loading }) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Finding best bus routes...</p>
      </div>
    );
  }

  if (!buses || buses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>📍 Enter origin and destination to find buses</p>
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
    if (score >= 0.7) return '#4CAF50'; // Green
    if (score >= 0.4) return '#FF9800'; // Orange
    return '#F44336';                   // Red
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <Star size={24} color="#667eea" />
          Recommended Routes
        </h2>
        <p className={styles.subtitle}>
          {buses.length} buses ranked by your preferences using TOPSIS
        </p>
      </div>

      <div className={styles.resultsContainer}>
        {buses.map((bus, index) => {
          const isSelected = selectedBus?.busId === bus.busId;
          const scoreColor = getScoreColor(bus.score);

          return (
            <div
              key={bus.busId}
              className={`${styles.busCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectBus(bus)}
            >
              {/* Rank Medal */}
              <div className={styles.medal}>
                {getMedalIcon(index)}
              </div>

              {/* Bus Header */}
              <div className={styles.busHeader}>
                <div
                  className={styles.busNumber}
                  style={{ backgroundColor: bus.color || '#667eea' }}
                >
                  {bus.routeNumber}
                </div>
                <div className={styles.busInfo}>
                  <h3>{bus.routeName}</h3>
                  <div className={styles.badges}>
                    <span className={styles.busType}>{bus.routeType}</span>
                    {/* ← NEW: Show journey type badge */}
                    {bus.journeyType === 'transfer' ? (
                      <span className={styles.transferBadge}>🔄 Transfer</span>
                    ) : (
                      <span className={styles.directBadge}>✅ Direct</span>
                    )}
                  </div>
                </div>
              </div>

              {/* TOPSIS Score */}
              <div className={styles.scoreSection}>
                <div className={styles.scoreLabel}>TOPSIS Score</div>
                <div
                  className={styles.score}
                  style={{ color: scoreColor }}
                >
                  {(bus.score * 100).toFixed(1)}%
                </div>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreBarFill}
                    style={{
                      width: `${bus.score * 100}%`,
                      backgroundColor: scoreColor
                    }}
                  />
                </div>
              </div>

              {/* ← FIXED: Correct field names + new fields */}
              <div className={styles.criteria}>

                {/* Departure Time - NEW */}
                <div className={styles.criteriaItem}>
                  <Navigation size={16} color="#667eea" />
                  <span className={styles.criteriaLabel}>Departs:</span>
                  <span className={styles.criteriaValue}>
                    {bus.departureTime || `${bus.arrivalTime} min`}
                  </span>
                </div>

                {/* Arrival Time - FIXED: was bus.time, now bus.arrivalTime */}
                <div className={styles.criteriaItem}>
                  <Clock size={16} color="#667eea" />
                  <span className={styles.criteriaLabel}>Wait:</span>
                  <span className={styles.criteriaValue}>
                    {bus.arrivalTime} min
                  </span>
                </div>

                {/* Travel Time */}
                <div className={styles.criteriaItem}>
                  <Clock size={16} color="#9C27B0" />
                  <span className={styles.criteriaLabel}>Journey:</span>
                  <span className={styles.criteriaValue}>
                    {bus.travelTime} min
                  </span>
                </div>

                {/* Cost */}
                <div className={styles.criteriaItem}>
                  <DollarSign size={16} color="#4CAF50" />
                  <span className={styles.criteriaLabel}>Fare:</span>
                  <span className={styles.criteriaValue}>{bus.cost} AED</span>
                </div>

                {/* Walking */}
                <div className={styles.criteriaItem}>
                  <MapPin size={16} color="#FF9800" />
                  <span className={styles.criteriaLabel}>Walk:</span>
                  <span className={styles.criteriaValue}>
                    {bus.walkingDistance} km ({bus.walkingTime} min)
                  </span>
                </div>

                {/* Transfers */}
                <div className={styles.criteriaItem}>
                  <GitMerge size={16} color="#F44336" />
                  <span className={styles.criteriaLabel}>Transfers:</span>
                  <span className={styles.criteriaValue}>{bus.transfers}</span>
                </div>

              </div>

              {/* Transfer Details - NEW: Show legs for transfer routes */}
              {bus.journeyType === 'transfer' && bus.leg1 && bus.leg2 && (
                <div className={styles.transferDetails}>
                  <div className={styles.leg}>
                    <span className={styles.legBadge} style={{ backgroundColor: bus.color }}>
                      {bus.leg1.routeNumber}
                    </span>
                    <span>{bus.leg1.routeName.substring(0, 25)}...</span>
                    <span>{bus.leg1.departureTime}</span>
                  </div>
                  <ArrowRight size={16} className={styles.legArrow} />
                  <div className={styles.leg}>
                    <span className={styles.legBadge} style={{ backgroundColor: '#667eea' }}>
                      {bus.leg2.routeNumber}
                    </span>
                    <span>{bus.leg2.routeName.substring(0, 25)}...</span>
                    <span>{bus.leg2.departureTime}</span>
                  </div>
                </div>
              )}

              {/* Stop Names */}
              <div className={styles.stopNames}>
                <span className={styles.originStop}>
                  📍 {bus.originStop?.name}
                </span>
                <ArrowRight size={14} />
                <span className={styles.destStop}>
                  🏁 {bus.destinationStop?.name}
                </span>
              </div>

              {/* Action Button */}
              <button className={`${styles.selectButton} ${isSelected ? styles.selectedBtn : ''}`}>
                {isSelected ? 'Selected ✓' : 'View on Map'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusResults;
