import Product from '../models/Product.js';
import Order from '../models/Order.js';
import {
  generateAIResponse,
  buildDescriptionPrompt,
  buildSalesSummaryPrompt,
  buildRestockPrompt,
  buildTrendPrompt,
} from '../services/aiService.js';
import { parseNaturalLanguageQuery } from '../services/nlQueryParser.js';
import { executeNaturalLanguageQuery } from '../services/nlQueryExecutor.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { shopConfig } from '../config/shop.js';

export const generateDescription = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const prompt = buildDescriptionPrompt(name, category);
  const description = await generateAIResponse(
    `product description task: ${prompt}`
  );
  res.json({ success: true, data: { description } });
});

export const salesSummary = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats = await Order.aggregate([
    { $match: { status: 'confirmed', createdAt: { $gte: todayStart } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const lowStock = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .select('name stock')
    .limit(5);

  const payload = {
    shop: shopConfig.name,
    today: stats[0] || { revenue: 0, orders: 0 },
    lowStockItems: lowStock,
  };

  const prompt = buildSalesSummaryPrompt(payload);
  const summary = await generateAIResponse(`sales summary task: ${prompt}`);

  res.json({ success: true, data: { summary, stats: payload } });
});

export const restockSuggestions = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .select('name sku category stock lowStockThreshold')
    .sort({ stock: 1 })
    .limit(15);

  const prompt = buildRestockPrompt(products);
  const suggestions = await generateAIResponse(`restock task: ${prompt}`);

  res.json({ success: true, data: { suggestions, products } });
});

export const salesTrendInsight = asyncHandler(async (req, res) => {
  const days = 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const chartData = await Order.aggregate([
    {
      $match: { status: 'confirmed', createdAt: { $gte: startDate } },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const prompt = buildTrendPrompt(chartData);
  const insight = await generateAIResponse(prompt);

  res.json({ success: true, data: { insight, chartData } });
});

export const naturalLanguageSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) {
    throw new AppError('Please enter a search question', 400);
  }

  const parsed = await parseNaturalLanguageQuery(query.trim());
  const executed = await executeNaturalLanguageQuery(parsed);

  res.json({
    success: true,
    data: {
      query: query.trim(),
      interpretation: parsed.interpretation,
      parsedQuery: parsed,
      source: parsed.source,
      ...executed,
    },
  });
});
