/**
 * WEIGHT SLIDERS COMPONENT
 * Allows user to set importance of each criterion
 * Weights are normalized to always sum to 1.0 for TOPSIS
 */

import React from 'react';
import { Clock, DollarSign, MapPin, GitMerge } from 'lucide-react';
import styles from './WeightSliders.module.css';

const WeightSliders = ({ weights, onWeightChange }) => {
  const criteria = [
    {
      id: 'time',
      label: 'Travel Time',
      icon: Clock,
      description: 'How important is a shorter journey?',
      color: '#667eea',
    },
    {
      id: 'cost',
      label: 'Fare Cost',
      icon: DollarSign,
      description: 'How important is a lower fare?',
      color: '#4CAF50',
    },
    {
      id: 'walkingDistance',
      label: 'Walking Distance',
      icon: MapPin,
      description: 'How important is a nearby bus stop?',
      color: '#FF9800',
    },
    {
      id: 'transfers',
      label: 'Number of Transfers',
      icon: GitMerge,
      description: 'How important is a direct route?',
      color: '#F44336',
    },
  ];

  /**
   * Normalize all weights to sum to 1.0 for the topsis Algorithm.
   
   */
  const normalizeWeights = (rawWeights) => {
    const total = Object.values(rawWeights).reduce((sum, val) => sum + val, 0);
    if (total === 0) return rawWeights;
    const normalized = {};
    Object.keys(rawWeights).forEach(key => {
      normalized[key] = parseFloat((rawWeights[key] / total).toFixed(4));
    });
    return normalized;
  };

  /**
   * Calculate actual percentage each criterion gets
   * Based on its share of the total
   */
  const getActualPercentage = (criterionId) => {
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 25;
    return Math.round((weights[criterionId] / total) * 100);
  };

  /**
   * Handle slider change
   * Sends normalized weights (0-1) to parent
   */
  const handleChange = (criterionId, sliderValue) => {
    const newRawWeights = {
      ...weights,
      [criterionId]: parseInt(sliderValue)
    };
    // Normalize and send to parent
    const normalized = normalizeWeights(newRawWeights);
    onWeightChange(normalized);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>What matters most to you?</h3>
      <p className={styles.subtitle}>Adjust the sliders based on your preferences</p>

      <div className={styles.slidersContainer}>
        {criteria.map((criterion) => {
          const Icon = criterion.icon;
          const rawValue = weights[criterion.id] || 25;
          const actualPercentage = getActualPercentage(criterion.id);

          return (
            <div key={criterion.id} className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.labelRow}>
                  <Icon size={20} color={criterion.color} />
                  <span className={styles.label}>{criterion.label}</span>
                </div>
                {/* Show actual normalized percentage */}
                <span
                  className={styles.percentage}
                  style={{ color: criterion.color }}
                >
                  {actualPercentage}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={rawValue}
                onChange={(e) => handleChange(criterion.id, e.target.value)}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, ${criterion.color} 0%, ${criterion.color} ${rawValue}%, #e0e0e0 ${rawValue}%, #e0e0e0 100%)`,
                }}
              />

              <p className={styles.description}>{criterion.description}</p>
            </div>
          );
        })}
      </div>

      {/* Show total = 100% always */}
      <div className={styles.totalBar}>
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            style={{
              width: `${getActualPercentage(criterion.id)}%`,
              backgroundColor: criterion.color,
              height: '8px',
              transition: 'width 0.3s ease'
            }}
            title={`${criterion.label}: ${getActualPercentage(criterion.id)}%`}
          />
        ))}
      </div>
      <p className={styles.totalLabel}>Weights always sum to 100%</p>

      <div className={styles.note}>
        <p>💡 Tip: Higher values mean more importance in the recommendation</p>
      </div>
    </div>
  );
};

export default WeightSliders;
