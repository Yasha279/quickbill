import Order from '../models/Order.js';
import Product from '../models/Product.js';

const buildOrderFilter = (filters) => {
  const mongo = {};
  if (filters.status) mongo.status = filters.status;
  if (filters.paymentMethod) mongo.paymentMethod = filters.paymentMethod;
  if (filters.customerName) {
    mongo.customerName = { $regex: filters.customerName, $options: 'i' };
  }
  if (filters.minTotal != null || filters.maxTotal != null) {
    mongo.grandTotal = {};
    if (filters.minTotal != null) mongo.grandTotal.$gte = filters.minTotal;
    if (filters.maxTotal != null) mongo.grandTotal.$lte = filters.maxTotal;
  }
  if (filters.startDate || filters.endDate) {
    mongo.createdAt = {};
    if (filters.startDate) mongo.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      mongo.createdAt.$lte = end;
    }
  }
  return mongo;
};

const buildProductFilter = (filters) => {
  const mongo = {};
  if (filters.category) mongo.category = { $regex: filters.category, $options: 'i' };
  if (filters.search) {
    mongo.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { sku: { $regex: filters.search, $options: 'i' } },
      { barcode: { $regex: filters.search, $options: 'i' } },
    ];
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    mongo.sellingPrice = {};
    if (filters.minPrice != null) mongo.sellingPrice.$gte = filters.minPrice;
    if (filters.maxPrice != null) mongo.sellingPrice.$lte = filters.maxPrice;
  }
  if (filters.minStock != null || filters.maxStock != null) {
    mongo.stock = {};
    if (filters.minStock != null) mongo.stock.$gte = filters.minStock;
    if (filters.maxStock != null) mongo.stock.$lte = filters.maxStock;
  }
  if (filters.outOfStockOnly) mongo.stock = 0;
  if (filters.lowStockOnly) {
    mongo.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }
  return mongo;
};

export const executeNaturalLanguageQuery = async (parsed) => {
  const { entity, filters, sort, limit } = parsed;
  const sortKey = sort.field;
  const sortDir = sort.order === 'asc' ? 1 : -1;

  if (entity === 'orders') {
    const mongoFilter = buildOrderFilter(filters);
    const [results, count, agg] = await Promise.all([
      Order.find(mongoFilter)
        .populate('cashier', 'name')
        .sort({ [sortKey]: sortDir })
        .limit(limit)
        .lean(),
      Order.countDocuments(mongoFilter),
      Order.aggregate([
        { $match: mongoFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
            avgOrder: { $avg: '$grandTotal' },
          },
        },
      ]),
    ]);

    return {
      entity: 'orders',
      count,
      results,
      summary: {
        totalRevenue: agg[0]?.totalRevenue || 0,
        averageOrder: Math.round((agg[0]?.avgOrder || 0) * 100) / 100,
        showing: results.length,
      },
    };
  }

  if (entity === 'products' || entity === 'inventory') {
    const mongoFilter = buildProductFilter(filters);
    if (entity === 'inventory' && !filters.lowStockOnly && !filters.outOfStockOnly) {
      mongoFilter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    const [results, count] = await Promise.all([
      Product.find(mongoFilter)
        .sort({ [sortKey]: sortDir })
        .limit(limit)
        .lean(),
      Product.countDocuments(mongoFilter),
    ]);

    const stockValue = results.reduce((s, p) => s + p.stock * p.costPrice, 0);

    return {
      entity: entity === 'inventory' ? 'inventory' : 'products',
      count,
      results,
      summary: {
        totalItems: count,
        stockValue,
        showing: results.length,
      },
    };
  }

  return { entity, count: 0, results: [], summary: {} };
};
