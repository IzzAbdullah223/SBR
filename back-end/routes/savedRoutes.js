// routes/savedRoutes.js
// Express router for /api/saved-routes
// All 3 endpoints are protected by verifyToken

import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { getSavedRoutes, createSavedRoute, deleteSavedRoute } from '../controllers/savedRouteController.js';

const router = express.Router();

// GET  /api/saved-routes       — get all saved routes for logged-in user
router.get('/',     verifyToken, getSavedRoutes);

// POST /api/saved-routes       — save a new favourite route
router.post('/',    verifyToken, createSavedRoute);

// DELETE /api/saved-routes/:id — remove a saved route by MongoDB _id
router.delete('/:id', verifyToken, deleteSavedRoute);

export default router;