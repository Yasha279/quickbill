import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStats = asyncHandler(async (req, res) => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const todayMatch = {
    status: 'confirmed',
    createdAt: { $gte: todayStart, $lte: todayEnd },
  };

  const [todayOrders, allTimeStats, lowStock, recentOrders, bestSelling] = await Promise.all([
    Order.aggregate([
      { $match: todayMatch },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
      .select('name sku stock lowStockThreshold category')
      .limit(10),
    Order.find({ status: 'confirmed' })
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(8),
    Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const today = todayOrders[0] || { revenue: 0, orders: 0 };
  const allTime = allTimeStats[0] || { totalRevenue: 0, totalOrders: 0 };

  const totalProducts = await Product.countDocuments();
  const outOfStock = await Product.countDocuments({ stock: 0 });
  const healthyStock = await Product.countDocuments({
    $expr: { $gt: ['$stock', '$lowStockThreshold'] },
  });

  res.json({
    success: true,
    data: {
      todaySales: today.revenue,
      todayOrders: today.orders,
      totalRevenue: allTime.totalRevenue,
      totalOrders: allTime.totalOrders,
      lowStock,
      lowStockCount: lowStock.length,
      recentOrders,
      bestSelling,
      stockHealth: {
        totalProducts,
        healthy: healthyStock,
        lowStock: lowStock.length,
        outOfStock,
      },
    },
  });
});

export const getCharts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        status: 'confirmed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        status: 'confirmed',
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const categorySales = await Order.aggregate([
    { $match: { status: 'confirmed' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$product.category', 'Other'] },
        revenue: { $sum: '$items.subtotal' },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 8 },
  ]);

  res.json({
    success: true,
    data: { dailyRevenue, monthlyRevenue, categorySales },
  });
});
