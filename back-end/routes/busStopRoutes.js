import express from 'express';
import { 
  getAllStops, 
  getStopById, 
  findNearbyStops
} from '../controllers/busStopController.js';

const router = express.Router();

router.get('/nearby', findNearbyStops);  // Find stops near coordinates
router.get('/', getAllStops);            // Get all stops
router.get('/:stopId', getStopById);     // Get specific stop

export default router;