import express from 'express';
import { 
  getAllRoutes, 
  getRouteByNumber, 
} from '../controllers/busRouteController.js';

const router = express.Router();


router.get('/', getAllRoutes);

router.get('/:routeNumber', getRouteByNumber);

export default router;