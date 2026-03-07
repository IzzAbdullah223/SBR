const API_BASE_URL = '/api';

const fetchAPI = async (endpoint, options = {}) => {
  try {
    // get token from localStorage — saved there after login/signup
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // attach token if it exists — backend verifyToken reads this
        // format must be "Bearer <token>"
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};


export const authAPI = {
  login: (email, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password, phone) =>
    fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    }),
};


export const busStopsAPI = {
  getAll: () => fetchAPI('/bus-stops'),
  getById: (stopId) => fetchAPI(`/bus-stops/${stopId}`),
  getNearby: (lat, lng, radius = 1) =>
    fetchAPI(`/bus-stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};

export const routesAPI = {
  getAll: () => fetchAPI('/routes'),
  getByNumber: (routeNumber) => fetchAPI(`/routes/${routeNumber}`),
};

export const topsisAPI = {
  findBuses: (origin, destination, weights) =>
    fetchAPI('/find-buses', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, weights }),
    }),
};


export const shapesAPI = {
  // Get shape by GTFS shape ID (e.g. "81:1")
  getById: (shapeId, originStopId, destStopId) => {
    const params = new URLSearchParams();
    if (originStopId) params.append('originStopId', originStopId);
    if (destStopId) params.append('destStopId', destStopId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/shapes/${encodeURIComponent(shapeId)}${query}`);
  },

  // Get shape by route number (e.g. "81") — easier to use from frontend
  getByRouteNumber: (routeNumber) => fetchAPI(`/shapes/route/${encodeURIComponent(routeNumber)}`),
};

const api = {
  busStops: busStopsAPI,
  routes: routesAPI,
  topsis: topsisAPI,
  shapes: shapesAPI, // ✅ NEW
};

export default api;