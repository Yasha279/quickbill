import express from 'express';
import {
  generateDescription,
  salesSummary,
  restockSuggestions,
  salesTrendInsight,
  naturalLanguageSearch,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post(
  '/generate-description',
  body('name').notEmpty(),
  body('category').notEmpty(),
  validate,
  generateDescription
);
router.post('/sales-summary', salesSummary);
router.post('/restock-suggestions', restockSuggestions);
router.get('/trend-insight', salesTrendInsight);
router.post(
  '/natural-search',
  body('query').trim().notEmpty().withMessage('Query is required'),
  validate,
  naturalLanguageSearch
);

export default router;
