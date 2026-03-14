/**
 * WEIGHT SLIDERS COMPONENT
 * Allows user to set importance of each criterion
 * Weights are normalized to always sum to 1.0 for TOPSIS
 *
 * ✅ FIX: Component now keeps its OWN internal raw state (0–100 integers).
 * It sends normalized weights (0–1) UP to the parent via onWeightChange,
 * but does NOT rely on the parent's weights prop for slider display.
 * This prevents the slider from jumping to near-zero when parent stores 0.25.
 */

import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, MapPin, GitMerge } from 'lucide-react';
import styles from './WeightSliders.module.css';

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

const WeightSliders = ({ onWeightChange, initialWeights }) => {
  // Internal raw state (0–100)
  // Seeded from initialWeights if provided (saved from Settings)
  // Falls back to 25/25/25/25 if nothing saved yet
  const [rawWeights, setRawWeights] = useState({
    time:            initialWeights?.time            ?? 25,
    cost:            initialWeights?.cost            ?? 25,
    walkingDistance: initialWeights?.walkingDistance ?? 25,
    transfers:       initialWeights?.transfers       ?? 25,
  });

  // Re-sync sliders when saved preferences arrive from backend
  // Depends on individual values not the object reference — avoids stale comparisons
  useEffect(() => {
    if (!initialWeights) return;
    const synced = {
      time:            initialWeights.time            ?? 25,
      cost:            initialWeights.cost            ?? 25,
      walkingDistance: initialWeights.walkingDistance ?? 25,
      transfers:       initialWeights.transfers       ?? 25,
    };
    setRawWeights(synced);
  }, [
    initialWeights?.time,
    initialWeights?.cost,
    initialWeights?.walkingDistance,
    initialWeights?.transfers,
  ]);

  // Normalize raw weights (0–100 integers) → (0–1 floats) summing to 1.0
  const normalizeWeights = (raw) => {
    const total = Object.values(raw).reduce((sum, val) => sum + val, 0);
    if (total === 0) return { time: 0.25, cost: 0.25, walkingDistance: 0.25, transfers: 0.25 };
    const normalized = {};
    Object.keys(raw).forEach(key => {
      normalized[key] = parseFloat((raw[key] / total).toFixed(4));
    });
    return normalized;
  };

  // Calculate display percentage for the total bar and label
  const getActualPercentage = (criterionId) => {
    const total = Object.values(rawWeights).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 25;
    return Math.round((rawWeights[criterionId] / total) * 100);
  };

  // Handle slider move — update internal state AND notify parent with normalized values
  const handleChange = (criterionId, sliderValue) => {
    const newRaw = {
      ...rawWeights,
      [criterionId]: parseInt(sliderValue),
    };
    setRawWeights(newRaw);
    onWeightChange(normalizeWeights(newRaw));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>What matters most to you?</h3>
      <p className={styles.subtitle}>Adjust the sliders based on your preferences</p>

      <div className={styles.slidersContainer}>
        {criteria.map((criterion) => {
          const Icon = criterion.icon;
          const rawValue = rawWeights[criterion.id];
          const actualPercentage = getActualPercentage(criterion.id);

          return (
            <div key={criterion.id} className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.labelRow}>
                  <Icon size={20} color={criterion.color} />
                  <span className={styles.label}>{criterion.label}</span>
                </div>
                <span className={styles.percentage} style={{ color: criterion.color }}>
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

      {/* Total bar — always sums to 100% */}
      <div className={styles.totalBar}>
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            style={{
              width: `${getActualPercentage(criterion.id)}%`,
              backgroundColor: criterion.color,
              height: '8px',
              transition: 'width 0.3s ease',
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