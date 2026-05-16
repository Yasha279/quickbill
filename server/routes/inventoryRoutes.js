import express from 'express';
import { getLowStock, getInventoryLogs } from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/low-stock', getLowStock);
router.get('/logs', getInventoryLogs);

export default router;
