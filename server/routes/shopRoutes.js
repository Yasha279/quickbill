import express from 'express';
import { shopConfig } from '../config/shop.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/info', protect, (req, res) => {
  res.json({ success: true, data: shopConfig });
});

export default router;
