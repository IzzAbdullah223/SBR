// savedRouteController.js
// Handles CRUD for a user's saved/favourite bus routes
// All routes are protected — verifyToken runs before these handlers
// req.user is set by verifyToken and contains { id, email } from the JWT

import SavedRoute from '../models/SavedRoute.js';

// ── GET ALL SAVED ROUTES FOR THE LOGGED-IN USER ────────────────────────────
// GET /api/saved-routes
export const getSavedRoutes = async (req, res) => {
  try {
    // req.user.id comes from verifyToken middleware
    const routes = await SavedRoute.findByUserId(req.user.id);
    return res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    console.error('❌ Error fetching saved routes:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching saved routes.' });
  }
};

// ── SAVE A NEW ROUTE ───────────────────────────────────────────────────────
// POST /api/saved-routes
export const createSavedRoute = async (req, res) => {
  try {
    const { routeName, origin, destination, routeNumber, routeColor, journeyType, estimatedTime, fare } = req.body;

    if (!routeName || !origin || !destination) {
      return res.status(400).json({ success: false, message: 'Route name, origin, and destination are required.' });
    }

    // userId comes from the verified JWT — not from the request body
    // this prevents users from saving routes under another user's account
    const savedRoute = await SavedRoute.create({
      userId: req.user.id,
      routeName,
      origin,
      destination,
      routeNumber: routeNumber || null,
      routeColor: routeColor || '#667eea',
      journeyType: journeyType || null,
      estimatedTime: estimatedTime || null,
      fare: fare || null,
    });

    return res.status(201).json({ success: true, data: savedRoute });
  } catch (error) {
    // MongoDB duplicate key — user already has a route with this name
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already saved a route with this name.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('❌ Error saving route:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving route.' });
  }
};

// ── DELETE A SAVED ROUTE ───────────────────────────────────────────────────
// DELETE /api/saved-routes/:id
export const deleteSavedRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await SavedRoute.findById(id);

    if (!route) {
      return res.status(404).json({ success: false, message: 'Saved route not found.' });
    }

    // security check — only the owner can delete their own routes
    if (route.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this route.' });
    }

    await SavedRoute.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Route removed from favourites.' });
  } catch (error) {
    console.error('❌ Error deleting saved route:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting route.' });
  }
};