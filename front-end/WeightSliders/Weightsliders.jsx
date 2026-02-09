/**
 * WEIGHT SLIDERS COMPONENT
 * Allows user to set importance of each criterion
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

  const handleChange = (criteriaId, value) => {
    onWeightChange(criteriaId, parseInt(value));
  };

  const getPercentage = (value) => {
    return Math.round((value / 100) * 100);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>What matters most to you?</h3>
      <p className={styles.subtitle}>Adjust the sliders based on your preferences</p>

      <div className={styles.slidersContainer}>
        {criteria.map((criterion) => {
          const Icon = criterion.icon;
          const value = weights[criterion.id] || 50;
          const percentage = getPercentage(value);

          return (
            <div key={criterion.id} className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <div className={styles.labelRow}>
                  <Icon size={20} color={criterion.color} />
                  <span className={styles.label}>{criterion.label}</span>
                </div>
                <span 
                  className={styles.percentage}
                  style={{ color: criterion.color }}
                >
                  {percentage}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => handleChange(criterion.id, e.target.value)}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, ${criterion.color} 0%, ${criterion.color} ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`,
                }}
              />

              <p className={styles.description}>{criterion.description}</p>
            </div>
          );
        })}
      </div>

      <div className={styles.note}>
        <p>💡 Tip: Higher values mean more importance in the recommendation</p>
      </div>
    </div>
  );
};

export default WeightSliders;
