/**
 * API SERVICE LAYER
 * All API calls to backend centralized here
 */

const API_BASE_URL = 'http://localhost:3000/api';  

/**
 * Generic fetch wrapper with error handling
 */
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * BUS STOPS API
 */
export const busStopsAPI = {
  /**
   * Get all bus stops
   */
  getAll: async () => {
    return fetchAPI('/bus-stops');
  },

  /**
   * Get single bus stop by ID
   */
  getById: async (stopId) => {
    return fetchAPI(`/bus-stops/${stopId}`);
  },

  /**
   * Get nearby bus stops
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Radius in km (default 1)
   */
  getNearby: async (lat, lng, radius = 1) => {
    return fetchAPI(`/bus-stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },
};

/**
 * ROUTES API
 */
export const routesAPI = {
  /**
   * Get all bus routes
   */
  getAll: async () => {
    return fetchAPI('/routes');
  },

  /**
   * Get single route by route number
   */
  getByNumber: async (routeNumber) => {
    return fetchAPI(`/routes/${routeNumber}`);
  },

  /**
   * Find route between two stops
   * @param {string} fromStopId - Origin stop ID
   * @param {string} toStopId - Destination stop ID
   */
  findRoute: async (fromStopId, toStopId) => {
    return fetchAPI(`/routes/find?from=${fromStopId}&to=${toStopId}`);
  },
};

/**
 * Export combined API object
 */
const api = {
  busStops: busStopsAPI,
  routes: routesAPI,
};

export default api;