import { body, param } from 'express-validator';

export const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.productId').isMongoId(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'other']),
  body('discount').optional().isFloat({ min: 0 }),
  body('customerName').optional().trim(),
  body('customerPhone').optional().trim(),
];

export const orderIdValidation = [param('id').isMongoId().withMessage('Invalid order ID')];
