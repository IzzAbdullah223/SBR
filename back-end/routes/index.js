/**
 * MAIN ROUTES INDEX
 * Combines all route modules
 */

import express from 'express';
import busStopRoutes from './busStopRoutes.js';
import busRouteRoutes from './busRouteRoutes.js';
import topsisRoutes from './topsisRoutes.js';
import shapeRoutes from './shapeRoutes.js';
import authRoutes from './authRoute.js';
import savedRouteRoutes from './savedRoutes.js'; // ✅ ADDED — was missing, causing all /api/saved-routes calls to 404

const router = express.Router();

router.use('/bus-stops', busStopRoutes);
router.use('/routes', busRouteRoutes);
router.use('/find-buses', topsisRoutes);
router.use('/shapes', shapeRoutes);
router.use('/auth', authRoutes);
router.use('/saved-routes', savedRouteRoutes); // ✅ ADDED

export default router;