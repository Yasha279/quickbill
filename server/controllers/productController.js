import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, message: 'Product deleted' });
});

export const restockProduct = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { stock: quantity } },
    { new: true }
  );

  if (!product) throw new AppError('Product not found', 404);

  const previousStock = product.stock - quantity;

  await InventoryLog.create({
    productId: product._id,
    type: 'RESTOCK',
    quantity,
    previousStock,
    newStock: product.stock,
    createdBy: req.user._id,
    note: `Restocked ${quantity} units`,
  });

  res.json({ success: true, data: product });
});

export const getLowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  }).sort({ stock: 1 });

  res.json({ success: true, data: products, count: products.length });
});

export const getInventoryLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.productId) filter.productId = req.query.productId;

  const logs = await InventoryLog.find(filter)
    .populate('productId', 'name sku')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 50);

  res.json({ success: true, data: logs });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ success: true, data: categories });
});
