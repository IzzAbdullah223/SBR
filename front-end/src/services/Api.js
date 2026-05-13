const API_BASE_URL =import.meta.env.VITE_API_URL

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok && !options.allowErrorResponse) {
      const error = new Error(
        data?.message || text || 'Something went wrong. Please try again.'
      );
      error.status = response.status;
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
     getProfile: () => fetchAPI('/settings/profile'),
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
      allowErrorResponse: true,
    }),

  rank: (buses, optimizationMode) =>
    fetchAPI('/find-buses/rank', {
      method: 'POST',
      body: JSON.stringify({ buses, optimizationMode }),
    }),
};

export const shapesAPI = {
  getById: (shapeId, originStopId, destStopId) => {
    const params = new URLSearchParams();
    if (originStopId) params.append('originStopId', originStopId);
    if (destStopId) params.append('destStopId', destStopId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/shapes/${encodeURIComponent(shapeId)}${query}`);
  },
  getByRouteNumber: (routeNumber) =>
    fetchAPI(`/shapes/route/${encodeURIComponent(routeNumber)}`),
};


export const savedRoutesAPI = {
  getAll: () => fetchAPI('/saved-routes'),
  create: (payload) =>
    fetchAPI('/saved-routes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  delete: (id) => fetchAPI(`/saved-routes/${id}`, { method: 'DELETE' }),
};

export const settingsAPI = {
  getProfile: () => fetchAPI('/settings/profile'),
  updateProfile: (data) =>
    fetchAPI('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data) =>
    fetchAPI('/settings/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePreferences: (optimizationMode) =>
    fetchAPI('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify({ optimizationMode }),
    }),
  updateLanguage: (language) =>
    fetchAPI('/settings/language', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    }),
  clearSavedRoutes: () =>
    fetchAPI('/settings/saved-routes', { method: 'DELETE' }),
  deleteAccount: (password) =>
    fetchAPI('/settings/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),
  getFavoriteStops: () => fetchAPI('/settings/favorite-stops'),
  addFavoriteStop: (stop) =>
    fetchAPI('/settings/favorite-stops', {
      method: 'POST',
      body: JSON.stringify(stop),
    }),
  removeFavoriteStop: (stopId) =>
    fetchAPI(`/settings/favorite-stops/${stopId}`, { method: 'DELETE' }),
};

export const walletAPI = {
  getWallet: () => fetchAPI('/wallet'),
  recharge: (amount) =>
    fetchAPI('/wallet/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  getTransactions: (limit) =>
    fetchAPI(`/wallet/transactions?limit=${limit || 10}`),
};

const api = {
  auth: authAPI,
  busStops: busStopsAPI,
  routes: routesAPI,
  topsis: topsisAPI,
  shapes: shapesAPI,
  savedRoutes: savedRoutesAPI,
  settings: settingsAPI,
  wallet: walletAPI,
};

export default api;
