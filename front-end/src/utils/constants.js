/**
 * CONSTANTS
 * All app-wide constants in one place
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 10000, // 10 seconds
};

// Map Configuration
export const MAP_CONFIG = {
 DEFAULT_CENTER:
  { lat: 25.2048, 
    lng: 55.2708 },

  DEFAULT_ZOOM: 11,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_LAYER_DARK: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

// Icon Colors
export const ICON_COLORS = {
  ORIGIN: '#4CAF50',        // Green
  DESTINATION: '#F44336',   // Red
  BUS_STOP: '#2196F3',      // Blue
  USER_LOCATION: '#9C27B0', // Purple
  BUS: '#FF5722',           // Deep Orange
  ROUTE: '#667eea',         // Purple-Blue
};

// Route Types
export const ROUTE_TYPES = {
  EXPRESS: 'express',
  LOCAL: 'local',
  NIGHT: 'night',
  CIRCULAR: 'circular',
};

// Route Type Colors
export const ROUTE_TYPE_COLORS = {
  express: '#FF5722',
  local: '#4CAF50',
  night: '#9C27B0',
  circular: '#2196F3',
};

// Search Configuration
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  MIN_SEARCH_LENGTH: 2,
  MAX_RESULTS: 10,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  FAVORITES: 'sbr_favorites',
  RECENT_SEARCHES: 'sbr_recent_searches',
  USER_PREFERENCES: 'sbr_preferences',
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_ROUTE_FOUND: 'No direct route found between these stops',
  NETWORK_ERROR: 'Unable to connect to server. Please check your connection.',
  LOCATION_ERROR: 'Unable to get your location. Please enable location services.',
  INVALID_STOP: 'Invalid bus stop selected',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ROUTE_FOUND: 'Route found successfully!',
  FAVORITE_ADDED: 'Added to favorites',
  FAVORITE_REMOVED: 'Removed from favorites',
};

export default {
  API_CONFIG,
  MAP_CONFIG,
  ICON_COLORS,
  ROUTE_TYPES,
  ROUTE_TYPE_COLORS,
  SEARCH_CONFIG,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};