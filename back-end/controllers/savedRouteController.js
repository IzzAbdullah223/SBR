

import SavedRoute from '../models/Savedroute.js';

export const getSavedRoutes = async (req, res) => {
  try {
    const routes = await SavedRoute.findByUserId(req.user.id);

    return res.status(200).json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (err) {
    console.error('getSavedRoutes error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved routes.',
    });
  }
};

// ── POST /api/saved-routes ─────────────────────────────────────────────────
// Saves a new journey for the logged-in user
// Body: { routeName, origin: { name, position: { lat, lng } }, destination: { name, position: { lat, lng } } }
// userId comes from the JWT token (req.user.id), never from the request body
export const createSavedRoute = async (req, res) => {
  try {
    const { routeName, origin, destination } = req.body;

    // basic validation
    if (!routeName || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'routeName, origin, and destination are required.',
      });
    }

    if (!origin.name || !origin.position?.lat || !origin.position?.lng) {
      return res.status(400).json({
        success: false,
        message: 'origin must include name and position (lat, lng).',
      });
    }

    if (!destination.name || !destination.position?.lat || !destination.position?.lng) {
      return res.status(400).json({
        success: false,
        message: 'destination must include name and position (lat, lng).',
      });
    }

    const newRoute = new SavedRoute({
      userId: req.user.id,
      routeName,
      origin,
      destination,
    });

    await newRoute.save();

    return res.status(201).json({
      success: true,
      data: newRoute,
      message: 'Journey saved successfully.',
    });
  } catch (err) {
    // duplicate key error — this journey is already saved
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This journey is already in your saved routes.',
      });
    }

    console.error('createSavedRoute error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save route.',
    });
  }
};

// ── DELETE /api/saved-routes/:id ───────────────────────────────────────────
// Deletes a saved journey — only the owner can delete their own routes
export const deleteSavedRoute = async (req, res) => {
  try {
    const route = await SavedRoute.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Saved route not found.',
      });
    }

    // ownership check — users can only delete their own saved routes
    if (route.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorised to delete this route.',
      });
    }

    await route.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Route deleted successfully.',
    });
  } catch (err) {
    console.error('deleteSavedRoute error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete route.',
    });
  }
};