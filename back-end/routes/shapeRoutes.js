/**
 * SHAPE ROUTES
 * Endpoints for fetching route shape coordinates
 */

import express from 'express';
import { getShapeById, getShapeByRouteNumber } from '../controllers/shapeController.js';

const router = express.Router();

/**
 * @route  GET /api/shapes/route/:routeNumber
 * @desc   Get shape coordinates by bus route number (e.g. "81")
 * @access Public
 */
router.get('/route/:routeNumber', getShapeByRouteNumber);

/**
 * @route  GET /api/shapes/:shapeId
 * @desc   Get shape coordinates by GTFS shape ID
 * @access Public
 */
router.get('/:shapeId', getShapeById);

export default router;