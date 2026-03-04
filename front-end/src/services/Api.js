const API_BASE_URL = '/api';

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {//'/api' + '/bus-stops/nearby?lat=25.1&lng=55.2'
//= '/api/bus-stops/nearby?lat=25.1&lng=55.2'
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    const data = await response.json();

    return data;
  } catch (error) {
    // Only true network errors reach here (server down, no connection)
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
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