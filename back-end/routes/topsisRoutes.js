/**
 * TOPSIS ROUTES
 * Routes for bus finding and MCDM
 */

import express from 'express';
import { findBuses } from '../controllers/topsisController.js';

const router = express.Router();

/**
 * @route   POST /api/find-buses
 * @desc    Find and rank buses using TOPSIS algorithm
 * @access  Public
 */
router.post('/', findBuses);

export default router;