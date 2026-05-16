import express from 'express';
import { getStats, getCharts } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/stats', getStats);
router.get('/charts', getCharts);

export default router;
