/**
 * MAP ICONS UTILITY
 * Leaflet icon definitions using Lucide React icons
 */

import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, MapPinned, Navigation, Bus, Circle } from 'lucide-react';
import { ICON_COLORS } from './constants';

/**
 * Helper: Create Leaflet DivIcon from Lucide React component
 */
const createLucideIcon = (IconComponent, options = {}) => {
  const {
    color = '#000000',
    size = 32,
    fill = 'none',
    strokeWidth = 2,
    className = '',
    background = 'transparent',
    borderRadius = '50%',
    padding = 4,
  } = options;

  const iconMarkup = renderToStaticMarkup(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        background: background,
        borderRadius: borderRadius,
        padding: `${padding}px`,
      }}
    >
      <IconComponent
        color={color}
        size={size - padding * 2}
        fill={fill}
        strokeWidth={strokeWidth}
      />
    </div>
  );

  return new L.DivIcon({
    html: iconMarkup,
    className: `custom-leaflet-icon ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

/**
 * ORIGIN ICON (Green MapPinned)
 */
export const originIcon = createLucideIcon(MapPinned, {
  color: ICON_COLORS.ORIGIN,
  size: 40,
  fill: ICON_COLORS.ORIGIN,
  strokeWidth: 2,
  background: 'white',
  borderRadius: '50% 50% 50% 0',
  className: 'origin-marker',
});

/**
 * DESTINATION ICON (Red MapPinned)
 */
export const destinationIcon = createLucideIcon(MapPinned, {
  color: ICON_COLORS.DESTINATION,
  size: 40,
  fill: ICON_COLORS.DESTINATION,
  strokeWidth: 2,
  background: 'white',
  borderRadius: '50% 50% 50% 0',
  className: 'destination-marker',
});

/**
 * BUS STOP ICON (Blue Circle)
 */
export const busStopIcon = createLucideIcon(Circle, {
  color: ICON_COLORS.BUS_STOP,
  size: 20,
  fill: ICON_COLORS.BUS_STOP,
  strokeWidth: 2,
  background: 'white',
  className: 'bus-stop-marker',
});

/**
 * SELECTED BUS STOP ICON (Larger Blue MapPin)
 */
export const selectedBusStopIcon = createLucideIcon(MapPin, {
  color: ICON_COLORS.BUS_STOP,
  size: 32,
  fill: ICON_COLORS.BUS_STOP,
  strokeWidth: 2.5,
  background: 'white',
  borderRadius: '50% 50% 50% 0',
  className: 'selected-bus-stop-marker',
});

/**
 * USER LOCATION ICON (Purple Navigation)
 */
export const userLocationIcon = createLucideIcon(Navigation, {
  color: ICON_COLORS.USER_LOCATION,
  size: 32,
  fill: ICON_COLORS.USER_LOCATION,
  strokeWidth: 2,
  background: 'white',
  className: 'user-location-marker',
});

/**
 * BUS ICON (Orange Bus)
 */
export const busIcon = createLucideIcon(Bus, {
  color: ICON_COLORS.BUS,
  size: 36,
  fill: ICON_COLORS.BUS,
  strokeWidth: 2,
  background: 'white',
  className: 'bus-marker',
});

/**
 * Create custom route icon with specific color
 */
export const createRouteIcon = (color) => {
  return createLucideIcon(MapPin, {
    color: color,
    size: 24,
    fill: color,
    strokeWidth: 2,
    background: 'white',
    borderRadius: '50% 50% 50% 0',
    className: 'route-marker',
  });
};

/**
 * Export all icons
 */
export default {
  originIcon,
  destinationIcon,
  busStopIcon,
  selectedBusStopIcon,
  userLocationIcon,
  busIcon,
  createRouteIcon,
};