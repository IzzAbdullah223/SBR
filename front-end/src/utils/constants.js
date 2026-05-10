export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 25.2048, lng: 55.2708 },
  DEFAULT_ZOOM: 11,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const ICON_COLORS = {
  ORIGIN: '#4CAF50',
  DESTINATION: '#F44336',
  BUS_STOP: '#2196F3',
  USER_LOCATION: '#9C27B0',
  BUS: '#FF5722',
  ROUTE: '#667eea',
};

export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_RESULTS: 10,
};

export default {
  MAP_CONFIG,
  ICON_COLORS,
  SEARCH_CONFIG,
};