import express from 'express';
import busStopRoutes    from './busStopRoutes.js';
import busRouteRoutes   from './busRouteRoutes.js';
import busSearchRoutes  from './busSearchRoutes.js';
import shapeRoutes      from './shapeRoutes.js';
import authRoutes       from './authRoute.js';
import savedRouteRoutes from './savedRoutes.js';
import settingsRoutes   from './settingsRoutes.js';
import walletRoutes     from './walletRoutes.js';

const router = express.Router();

router.use('/bus-stops',    busStopRoutes);
router.use('/routes',       busRouteRoutes);
router.use('/find-buses',   busSearchRoutes);
router.use('/shapes',       shapeRoutes);
router.use('/auth',         authRoutes);
router.use('/saved-routes', savedRouteRoutes);
router.use('/settings',     settingsRoutes);
router.use('/wallet',       walletRoutes);

export default router;