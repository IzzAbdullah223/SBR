/**
 * MAP ICONS UTILITY
 * Leaflet icon definitions using Lucide React icons
 * NO JSX - Vite compatible
 */

import L from 'leaflet';
import { ICON_COLORS } from './constants';

/**
 * Create SVG string from Lucide icon properties
 */
const createSVGString = (iconType, options = {}) => {
  const {
    color = '#000000',
    size = 32,
    fill = 'none',
    strokeWidth = 2,
  } = options;

  const svgs = {
    mapPinned: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0"/>
        <circle cx="12" cy="8" r="2"/>
        <path d="M8.835 14H5a1 1 0 0 0-.9.7l-2 6c-.1.1-.1.2-.1.3 0 .6.4 1 1 1h18c.6 0 1-.4 1-1 0-.1 0-.2-.1-.3l-2-6a1 1 0 0 0-.9-.7h-3.835"/>
      </svg>
    `,
    circle: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    `,
    mapPin: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `,
    navigation: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
    `,
    bus: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <path d="M9 18h5"/>
        <circle cx="16" cy="18" r="2"/>
      </svg>
    `,
  };

  return svgs[iconType] || svgs.circle;
};

/**
 * Helper: Create Leaflet DivIcon with SVG
 */
const createLeafletIcon = (iconType, options = {}) => {
  const {
    color = '#000000',
    size = 32,
    fill = 'none',
    strokeWidth = 2,
    className = '',
    background = 'white',
    borderRadius = '50%',
  } = options;

  const svgString = createSVGString(iconType, { color, size, fill, strokeWidth });

  const iconHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background: ${background};
      border-radius: ${borderRadius};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    ">
      ${svgString}
    </div>
  `;

  return new L.DivIcon({
    html: iconHTML,
    className: `custom-leaflet-icon ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

/**
 * ORIGIN ICON (Green MapPinned)
 */
export const originIcon = createLeafletIcon('mapPinned', {
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
export const destinationIcon = createLeafletIcon('mapPinned', {
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
export const busStopIcon = createLeafletIcon('circle', {
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
export const selectedBusStopIcon = createLeafletIcon('mapPin', {
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
export const userLocationIcon = createLeafletIcon('navigation', {
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
export const busIcon = createLeafletIcon('bus', {
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
  return createLeafletIcon('mapPin', {
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