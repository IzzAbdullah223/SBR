/**
 * BUS RESULTS COMPONENT
 * Displays ranked buses from TOPSIS algorithm
 */

import React from 'react';
import { Clock, DollarSign, MapPin, GitMerge, Star, Award } from 'lucide-react';
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
        <p>🔍 Enter origin and destination to find buses</p>
      </div>
    );
  }

  const getMedalIcon = (index) => {
    if (index === 0) return <Award size={24} color="#FFD700" fill="#FFD700" />;
    if (index === 1) return <Award size={24} color="#C0C0C0" fill="#C0C0C0" />;
    if (index === 2) return <Award size={24} color="#CD7F32" fill="#CD7F32" />;
    return null;
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>
          <Star size={24} color="#667eea" />
          Recommended Routes
        </h2>
        <p className={styles.subtitle}>Ranked by your preferences using TOPSIS</p>
      </div>

      <div className={styles.resultsContainer}>
        {buses.map((bus, index) => {
          const isSelected = selectedBus?.routeNumber === bus.routeNumber;
          const scoreColor = getScoreColor(bus.score);

          return (
            <div
              key={bus.routeNumber}
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
                  <h3>{bus.name}</h3>
                  <span className={styles.busType}>{bus.type}</span>
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

              {/* Criteria Details */}
              <div className={styles.criteria}>
                <div className={styles.criteriaItem}>
                  <Clock size={16} color="#667eea" />
                  <span className={styles.criteriaLabel}>Time:</span>
                  <span className={styles.criteriaValue}>{bus.time} min</span>
                </div>

                <div className={styles.criteriaItem}>
                  <DollarSign size={16} color="#4CAF50" />
                  <span className={styles.criteriaLabel}>Fare:</span>
                  <span className={styles.criteriaValue}>{bus.cost} AED</span>
                </div>

                <div className={styles.criteriaItem}>
                  <MapPin size={16} color="#FF9800" />
                  <span className={styles.criteriaLabel}>Walk:</span>
                  <span className={styles.criteriaValue}>{bus.walkingDistance} km</span>
                </div>

                <div className={styles.criteriaItem}>
                  <GitMerge size={16} color="#F44336" />
                  <span className={styles.criteriaLabel}>Transfers:</span>
                  <span className={styles.criteriaValue}>{bus.transfers}</span>
                </div>
              </div>

              {/* Action Button */}
              <button className={styles.selectButton}>
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
