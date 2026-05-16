import Order from '../models/Order.js';
import InventoryLog from '../models/InventoryLog.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { shopConfig } from '../config/shop.js';
import { deductStock, restoreStock, rollbackDeductions } from '../utils/stockOperations.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, customerName, customerPhone, paymentMethod, discount = 0 } = req.body;
  const taxRate = shopConfig.taxRate / 100;

  const orderItems = [];
  const deductions = [];
  let subtotal = 0;

  try {
    for (const item of items) {
      const { product, previousStock, newStock } = await deductStock(
        item.productId,
        item.quantity
      );

      deductions.push({ productId: product._id, quantity: item.quantity });

      const unitPrice = product.sellingPrice;
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });

      await InventoryLog.create({
        productId: product._id,
        type: 'SALE',
        quantity: item.quantity,
        previousStock,
        newStock,
        createdBy: req.user._id,
        note: 'Sale',
      });
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * taxRate * 100) / 100;
    const grandTotal = Math.round((taxableAmount + tax) * 100) / 100;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      items: orderItems,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      paymentMethod: paymentMethod || 'cash',
      subtotal,
      tax,
      discount,
      grandTotal,
      status: 'confirmed',
      cashier: req.user._id,
    });

    const populated = await Order.findById(order._id).populate('cashier', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (deductions.length > 0) {
      await rollbackDeductions(deductions);
    }
    throw err;
  }
});

export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.cashier) filter.cashier = req.query.cashier;
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('cashier', 'name email');
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: 'confirmed' },
    {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findById(req.params.id);
    if (!existing) throw new AppError('Order not found', 404);
    throw new AppError('Order is already cancelled', 400);
  }

  for (const item of order.items) {
    const result = await restoreStock(item.productId, item.quantity);
    if (!result) continue;

    await InventoryLog.create({
      productId: item.productId,
      type: 'CANCEL',
      quantity: item.quantity,
      previousStock: result.previousStock,
      newStock: result.newStock,
      createdBy: req.user._id,
      orderId: order._id,
      note: `Order ${order.orderNumber} cancelled`,
    });
  }

  const populated = await Order.findById(order._id).populate('cashier', 'name');
  res.json({ success: true, data: populated });
});
