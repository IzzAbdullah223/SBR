

const API_BASE_URL = 'http://localhost:5000/api'; 

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
  getAll: async () => {
    return fetchAPI('/bus-stops');
  },

  getById: async (stopId) => {
    return fetchAPI(`/bus-stops/${stopId}`);
  },

  getNearby: async (lat, lng, radius = 1) => {
    return fetchAPI(`/bus-stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },
};

/**
 * ROUTES API
 */
export const routesAPI = {
  getAll: async () => {
    return fetchAPI('/routes');
  },

  getByNumber: async (routeNumber) => {
    return fetchAPI(`/routes/${routeNumber}`);
  },
};

/**
 * TOPSIS API ← ADDED: This is your main feature!
 * POST /api/find-buses
 */
export const topsisAPI = {
  findBuses: async (origin, destination, weights) => {
    return fetchAPI('/find-buses', {
      method: 'POST',
      body: JSON.stringify({
        origin,      // { lat, lng }
        destination, // { lat, lng }
        weights,     // { time, cost, walkingDistance, transfers } - all 0 to 1, sum to 1
      }),
    });
  },
};


const api = {
  busStops: busStopsAPI,
  routes: routesAPI,
  topsis: topsisAPI, // ← ADDED
};

export default api;