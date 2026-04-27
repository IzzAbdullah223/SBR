import L from 'leaflet';
import { ICON_COLORS } from './constants';

const createSVGString = (iconType, options = {}) => {
  const { color = '#000000', size = 32, fill = 'none', strokeWidth = 2 } = options;

  const svgs = {
    circle: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
    navigation: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    bus: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
  };

  return svgs[iconType] || svgs.circle;
};

const createLeafletIcon = (iconType, options = {}) => {
  const {
    color = '#000000', size = 32, fill = 'none', strokeWidth = 2,
    className = '', background = 'white', borderRadius = '50%',
  } = options;

  const svgString = createSVGString(iconType, { color, size, fill, strokeWidth });
  const iconHTML = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:${background};border-radius:${borderRadius};box-shadow:0 2px 8px rgba(0,0,0,0.2);">${svgString}</div>`;

  return new L.DivIcon({
    html: iconHTML,
    className: `custom-leaflet-icon ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};


const busStopSVGBody = (pinColor, busColor) => `
  <path fill="${pinColor}" d="M20 0C10.6 0 3 7.6 3 17c0 12.5 17 33 17 33S37 29.5 37 17C37 7.6 29.4 0 20 0z"/>
  <circle cx="20" cy="17" r="12" fill="white"/>
  <g transform="translate(10, 8)" fill="${busColor}">
    <rect x="1" y="0" width="18" height="13" rx="2"/>
    <rect x="3" y="2" width="14" height="7" fill="white"/>
    <circle cx="5" cy="15" r="2"/>
    <circle cx="15" cy="15" r="2"/>
    <rect x="0" y="11" width="20" height="3"/>
  </g>
`;



export const originIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 24 29" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))"><path fill-rule="evenodd" clip-rule="evenodd" fill="#4CAF50" d="M12 0C5.373 0 0 5.373 0 12c0 7.5 12 17 12 17S24 19.5 24 12C24 5.373 18.627 0 12 0z M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>`,
  className: 'custom-leaflet-icon origin-marker',
  iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44],
});

export const destinationIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 24 29" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))"><path fill-rule="evenodd" clip-rule="evenodd" fill="#F44336" d="M12 0C5.373 0 0 5.373 0 12c0 7.5 12 17 12 17S24 19.5 24 12C24 5.373 18.627 0 12 0z M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>`,
  className: 'custom-leaflet-icon destination-marker',
  iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44],
});



export const busStopIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 40 50" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${busStopSVGBody('#0a1628', '#0a1628')}</svg>`,
  className: 'custom-leaflet-icon bus-stop-marker',
  iconSize: [24, 30], iconAnchor: [12, 30], popupAnchor: [0, -30],
});


export const selectedBusStopIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 40 50" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4))">${busStopSVGBody('#f0a500', '#f0a500')}</svg>`,
  className: 'custom-leaflet-icon selected-bus-stop-marker',
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});


export const originStopIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 40 50" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4))">${busStopSVGBody('#4CAF50', '#4CAF50')}</svg>`,
  className: 'custom-leaflet-icon origin-stop-marker',
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});


export const transferStopIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 40 50" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4))">${busStopSVGBody('#f0a500', '#f0a500')}</svg>`,
  className: 'custom-leaflet-icon transfer-stop-marker',
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});


export const destinationStopIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 40 50" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4))">${busStopSVGBody('#F44336', '#F44336')}</svg>`,
  className: 'custom-leaflet-icon destination-stop-marker',
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});



export const userLocationIcon = new L.DivIcon({
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(33,150,243,0.25);animation:userPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#2196F3;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  className: 'custom-leaflet-icon user-location-dot',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

export const busIcon = createLeafletIcon('bus', {
  color: ICON_COLORS.BUS, size: 36, fill: ICON_COLORS.BUS,
  strokeWidth: 2, background: 'white', className: 'bus-marker',
});

export const createRouteIcon = (color) => createLeafletIcon('mapPin', {
  color, size: 24, fill: color, strokeWidth: 2,
  background: 'white', borderRadius: '50% 50% 50% 0', className: 'route-marker',
});

export default {
  originIcon, destinationIcon,
  busStopIcon, selectedBusStopIcon,
  originStopIcon, transferStopIcon, destinationStopIcon,
  userLocationIcon, busIcon, createRouteIcon,
};
/*
"The map is built using Leaflet — an open source JavaScript mapping library — 
with OpenStreetMap tiles as the base layer. Leaflet handles all interactive elements: route polylines, 
custom bus stop markers, and popups. OpenStreetMap provides the underlying map data and tile images. 
The bus stop icons and route markers are custom SVG designs rendered through Leaflet's DivIcon API."
*/