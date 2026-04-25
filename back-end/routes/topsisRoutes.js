import express from 'express';
import { findBuses, rankBuses } from '../controllers/topsisController.js';

const router = express.Router();

router.post('/', findBuses);
router.post('/rank', rankBuses);

export default router;