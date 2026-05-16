import { body, param } from 'express-validator';

export const productBodyValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price required'),
  body('stock').optional().isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
];

export const idParamValidation = [param('id').isMongoId().withMessage('Invalid product ID')];

export const restockValidation = [
  param('id').isMongoId(),
  body('quantity').isInt({ min: 1 }).withMessage('Restock quantity must be at least 1'),
];
