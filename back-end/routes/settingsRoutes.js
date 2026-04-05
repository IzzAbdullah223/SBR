import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  updateLanguage,
  clearSavedRoutes,
  deleteAccount,
  getFavoriteStops,
  addFavoriteStop,
  removeFavoriteStop,
} from '../controllers/settingsController.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile',                      getProfile);
router.put('/profile',                      updateProfile);
router.put('/password',                     changePassword);
router.put('/preferences',                  updatePreferences);
router.delete('/saved-routes',              clearSavedRoutes);
router.delete('/account',                   deleteAccount);
router.put('/language',                     updateLanguage);

// Favorite stops
router.get('/favorite-stops',               getFavoriteStops);
router.post('/favorite-stops',              addFavoriteStop);
router.delete('/favorite-stops/:stopId',    removeFavoriteStop);

export default router;