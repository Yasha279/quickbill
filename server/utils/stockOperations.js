import Product from '../models/Product.js';
import { AppError } from './AppError.js';

/** Atomic stock deduction — works on standalone MongoDB (no replica set). */
export const deductStock = async (productId, quantity) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );

  if (!product) {
    const existing = await Product.findById(productId);
    if (!existing) throw new AppError('Product not found', 404);
    throw new AppError(
      `Insufficient stock for ${existing.name}. Available: ${existing.stock}`,
      400
    );
  }

  return {
    product,
    previousStock: product.stock + quantity,
    newStock: product.stock,
  };
};

/** Restore stock (cancel order or rollback failed checkout). */
export const restoreStock = async (productId, quantity) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity } },
    { new: true }
  );

  if (!product) return null;

  return {
    product,
    previousStock: product.stock - quantity,
    newStock: product.stock,
  };
};

/** Undo deductions if order creation fails mid-way. */
export const rollbackDeductions = async (deductions) => {
  for (const { productId, quantity } of deductions) {
    await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
  }
};
