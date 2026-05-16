import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { createOrderValidation, orderIdValidation } from '../validations/orderValidation.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrderValidation, validate, createOrder);
router.get('/', getOrders);
router.get('/:id', orderIdValidation, validate, getOrder);
router.patch('/cancel/:id', orderIdValidation, validate, cancelOrder);

export default router;
