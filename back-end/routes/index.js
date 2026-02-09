/**
 * MAIN ROUTES INDEX
 * Combines all route modules
 */

import express from 'express';
import busStopRoutes from './busStopRoutes.js';
import busRouteRoutes from './busRouteRoutes.js';
import topsisRoutes from './topsisRoutes.js';

const router = express.Router();

/**
 * BUS STOPS ROUTES
 */
router.use('/bus-stops', busStopRoutes);

/**
 * BUS ROUTES ROUTES
 */
router.use('/routes', busRouteRoutes);

/**
 * TOPSIS / FIND BUSES ROUTES
 */
router.use('/find-buses', topsisRoutes);

export default router;