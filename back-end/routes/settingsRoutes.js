/**
 * SETTINGS ROUTES
 * All routes protected by verifyToken — user must be logged in
 */

import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  clearSavedRoutes,
  deleteAccount,
} from '../controllers/settingsController.js';

const router = express.Router();

// all settings routes require authentication
router.use(verifyToken);

router.get('/profile',         getProfile);
router.put('/profile',         updateProfile);
router.put('/password',        changePassword);
router.put('/preferences',     updatePreferences);
router.delete('/saved-routes', clearSavedRoutes);
router.delete('/account',      deleteAccount);

export default router;