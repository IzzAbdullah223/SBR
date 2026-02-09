import express from 'express';
import { 
  getAllRoutes, 
  getRouteByNumber, 
  findRouteBetweenStops 
} from '../controllers/busRouteController.js';

const router = express.Router();

router.get('/', getAllRoutes);
router.get('/find', findRouteBetweenStops);
router.get('/:routeNumber', getRouteByNumber);

export default router;