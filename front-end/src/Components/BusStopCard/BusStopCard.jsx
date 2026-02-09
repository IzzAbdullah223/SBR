/**
 * BUS STOP CARD COMPONENT
 * Displays bus stop details
 */

import React from 'react';
import { MapPin, Bus, X } from 'lucide-react';
import styles from './BusStopCard.module.css';

const BusStopCard = ({ stop, onClose }) => {
  if (!stop) return null;

  return (
    <div className={styles.card}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={20} />
      </button>

      <div className={styles.header}>
        <MapPin size={24} color="#667eea" />
        <div>
          <h3>{stop.name}</h3>
          <p className={styles.stopId}>ID: {stop.stopId}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Location</h4>
          <p className={styles.coordinates}>
            {stop.position.lat.toFixed(6)}, {stop.position.lng.toFixed(6)}
          </p>
        </div>

        {stop.routes && stop.routes.length > 0 && (
          <div className={styles.section}>
            <h4>
              <Bus size={16} />
              Available Routes ({stop.routes.length})
            </h4>
            <div className={styles.routeBadges}>
              {stop.routes.map((route) => (
                <span key={route} className={styles.routeBadge}>
                  {route}
                </span>
              ))}
            </div>
          </div>
        )}

        {stop.amenities && stop.amenities.length > 0 && (
          <div className={styles.section}>
            <h4>Amenities</h4>
            <ul className={styles.amenitiesList}>
              {stop.amenities.map((amenity, index) => (
                <li key={index}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusStopCard;
