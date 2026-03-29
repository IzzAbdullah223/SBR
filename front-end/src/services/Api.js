const API_BASE_URL = '/api';

const fetchAPI = async (endpoint, options = {}) => {
  try {
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

    // read body as text first — some endpoints (e.g. passport 401) return
    // plain text instead of JSON, calling .json() directly would crash
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // body was plain text (e.g. "Unauthorized") — not JSON, that's fine
      data = null;
    }

    // allowErrorResponse: true — caller wants the body even on 4xx/5xx
    // used by topsisAPI because "no routes found" comes back as 404 but
    // it's a valid expected result with a structured errorCode, not a crash
    // default behaviour (no flag) — throw on non-2xx so catch blocks fire
    if (!response.ok && !options.allowErrorResponse) {
      const error = new Error(data?.message || text || 'Something went wrong. Please try again.');
      error.status = response.status; // attach status so callers check code not message text
      throw error;
    }

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
  findBuses: (origin, destination, optimizationMode) =>
    fetchAPI('/find-buses', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, optimizationMode }),
      // don't throw on 404/400 — return the body so useFindBuses can read
      // response.errorCode and show the correct message (no stops, no routes etc.)
      allowErrorResponse: true,
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
  getByRouteNumber: (routeNumber) =>
    fetchAPI(`/shapes/route/${encodeURIComponent(routeNumber)}`),
};

export const settingsAPI = {
  getProfile:       ()              => fetchAPI('/settings/profile'),
  updateProfile:    (data)          => fetchAPI('/settings/profile',     { method: 'PUT',    body: JSON.stringify(data) }),
  changePassword:   (data)          => fetchAPI('/settings/password',    { method: 'PUT',    body: JSON.stringify(data) }),
  updatePreferences:(optimizationMode) => fetchAPI('/settings/preferences', { method: 'PUT', body: JSON.stringify({ optimizationMode }) }),
  clearSavedRoutes: ()              => fetchAPI('/settings/saved-routes',{ method: 'DELETE' }),
  deleteAccount:    (password)      => fetchAPI('/settings/account',     { method: 'DELETE', body: JSON.stringify({ password }) }),
};

const api = {
  auth: authAPI,
  busStops: busStopsAPI,
  routes: routesAPI,
  topsis: topsisAPI,
  shapes: shapesAPI,
  settings: settingsAPI,
};

export default api;