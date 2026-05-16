import express from 'express';
import {
  getSalesReport,
  getInventoryReport,
  exportReport,
  getStaffList,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/export', exportReport);
router.get('/staff', getStaffList);

export default router;
