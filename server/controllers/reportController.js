import XLSX from 'xlsx';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const buildDateFilter = (query) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

export const getSalesReport = asyncHandler(async (req, res) => {
  const filter = { status: 'confirmed', ...buildDateFilter(req.query) };
  if (req.query.cashier) filter.cashier = req.query.cashier;

  const orders = await Order.find(filter)
    .populate('cashier', 'name')
    .sort({ createdAt: -1 });

  let productFilter = {};
  if (req.query.productId) {
    orders.forEach(() => {});
  }

  const summary = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$grandTotal' },
        totalOrders: { $sum: 1 },
        totalTax: { $sum: '$tax' },
        totalDiscount: { $sum: '$discount' },
      },
    },
  ]);

  let filteredOrders = orders;
  if (req.query.productId) {
    filteredOrders = orders.filter((o) =>
      o.items.some((i) => i.productId.toString() === req.query.productId)
    );
  }
  if (req.query.category) {
    const products = await Product.find({ category: req.query.category }).select('_id');
    const ids = new Set(products.map((p) => p._id.toString()));
    filteredOrders = orders.filter((o) =>
      o.items.some((i) => ids.has(i.productId.toString()))
    );
  }

  const bestSelling = await Order.aggregate([
    { $match: filter },
    { $unwind: '$items' },
    ...(req.query.productId
      ? [{ $match: { 'items.productId': req.query.productId } }]
      : []),
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        totalQty: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
  ]);

  res.json({
    success: true,
    data: {
      summary: summary[0] || { totalRevenue: 0, totalOrders: 0, totalTax: 0, totalDiscount: 0 },
      orders: filteredOrders,
      bestSelling,
    },
  });
});

export const getInventoryReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  const products = await Product.find(filter).sort({ stock: 1 });

  const summary = {
    totalProducts: products.length,
    totalStockValue: products.reduce((s, p) => s + p.stock * p.costPrice, 0),
    totalRetailValue: products.reduce((s, p) => s + p.stock * p.sellingPrice, 0),
    lowStockCount: products.filter((p) => p.stock <= p.lowStockThreshold).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  res.json({ success: true, data: { summary, products } });
});

export const exportReport = asyncHandler(async (req, res) => {
  const type = req.query.type || 'sales';
  const filter = { status: 'confirmed', ...buildDateFilter(req.query) };

  let rows = [];
  let sheetName = 'Report';

  if (type === 'sales') {
    sheetName = 'Sales Report';
    const orders = await Order.find(filter).populate('cashier', 'name').sort({ createdAt: -1 });
    rows = orders.map((o) => ({
      'Order #': o.orderNumber,
      Date: o.createdAt.toISOString().split('T')[0],
      Customer: o.customerName,
      Cashier: o.cashier?.name || '',
      Subtotal: o.subtotal,
      Tax: o.tax,
      Discount: o.discount,
      Total: o.grandTotal,
      Payment: o.paymentMethod,
      Status: o.status,
    }));
  } else if (type === 'inventory') {
    sheetName = 'Inventory Report';
    const products = await Product.find().sort({ category: 1, name: 1 });
    rows = products.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      Stock: p.stock,
      'Low Threshold': p.lowStockThreshold,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellingPrice,
      'Stock Value': p.stock * p.costPrice,
    }));
  } else if (type === 'best-selling') {
    sheetName = 'Best Selling';
    const best = await Order.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          Quantity: { $sum: '$items.quantity' },
          Revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { Revenue: -1 } },
    ]);
    rows = best.map((b) => ({ Product: b._id, Quantity: b.Quantity, Revenue: b.Revenue }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=quickbill-${type}-${Date.now()}.xlsx`);
  res.send(buffer);
});

export const getStaffList = asyncHandler(async (req, res) => {
  const staff = await User.find().select('name email role');
  res.json({ success: true, data: staff });
});
