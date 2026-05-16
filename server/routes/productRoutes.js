import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getCategories,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  productBodyValidation,
  idParamValidation,
  restockValidation,
} from '../validations/productValidation.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/categories/list', getCategories);
router.get('/:id', idParamValidation, validate, getProduct);
router.post('/', authorize('admin'), productBodyValidation, validate, createProduct);
router.put('/:id', authorize('admin'), idParamValidation, productBodyValidation, validate, updateProduct);
router.delete('/:id', authorize('admin'), idParamValidation, validate, deleteProduct);
router.patch('/restock/:id', restockValidation, validate, restockProduct);

export default router;
