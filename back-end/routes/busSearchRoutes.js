import express from 'express';
import { findBuses } from '../controllers/busSearchController.js';
import { rankBuses } from '../controllers/topsisController.js';

const router = express.Router();

router.post('/',      findBuses);
router.post('/rank',  rankBuses);

export default router;