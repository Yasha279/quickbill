import { generateAIResponse } from './aiService.js';

const SCHEMA = `{
  "entity": "orders" | "products" | "inventory",
  "filters": {
    "minTotal": number or null,
    "maxTotal": number or null,
    "startDate": "YYYY-MM-DD" or null,
    "endDate": "YYYY-MM-DD" or null,
    "status": "confirmed" | "cancelled" or null,
    "paymentMethod": "cash" | "card" | "upi" | "other" or null,
    "customerName": string or null,
    "category": string or null,
    "search": string or null,
    "lowStockOnly": boolean,
    "outOfStockOnly": boolean,
    "minStock": number or null,
    "maxStock": number or null,
    "minPrice": number or null,
    "maxPrice": number or null
  },
  "sort": { "field": "createdAt" | "grandTotal" | "name" | "stock" | "sellingPrice", "order": "asc" | "desc" },
  "limit": number (max 100),
  "interpretation": "short plain English of what you understood"
}`;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const toDateStr = (d) => d.toISOString().split('T')[0];

const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const sanitizeParsed = (raw) => {
  const entity = ['orders', 'products', 'inventory'].includes(raw?.entity)
    ? raw.entity
    : 'orders';

  const f = raw?.filters || {};
  const filters = {
    minTotal: typeof f.minTotal === 'number' ? f.minTotal : null,
    maxTotal: typeof f.maxTotal === 'number' ? f.maxTotal : null,
    startDate: f.startDate || null,
    endDate: f.endDate || null,
    status: ['confirmed', 'cancelled'].includes(f.status) ? f.status : null,
    paymentMethod: ['cash', 'card', 'upi', 'other'].includes(f.paymentMethod)
      ? f.paymentMethod
      : null,
    customerName: f.customerName || null,
    category: f.category || null,
    search: f.search || null,
    lowStockOnly: Boolean(f.lowStockOnly),
    outOfStockOnly: Boolean(f.outOfStockOnly),
    minStock: typeof f.minStock === 'number' ? f.minStock : null,
    maxStock: typeof f.maxStock === 'number' ? f.maxStock : null,
    minPrice: typeof f.minPrice === 'number' ? f.minPrice : null,
    maxPrice: typeof f.maxPrice === 'number' ? f.maxPrice : null,
  };

  const sortFields = {
    orders: ['createdAt', 'grandTotal'],
    products: ['name', 'stock', 'sellingPrice', 'createdAt'],
    inventory: ['stock', 'name', 'sellingPrice'],
  };
  const field = sortFields[entity]?.includes(raw?.sort?.field) ? raw.sort.field : sortFields[entity][0];
  const order = raw?.sort?.order === 'asc' ? 'asc' : 'desc';
  const limit = Math.min(Math.max(parseInt(raw?.limit, 10) || 50, 1), 100);

  return {
    entity,
    filters,
    sort: { field, order },
    limit,
    interpretation: raw?.interpretation || 'Query processed',
  };
};

/** Rule-based parser when LLM is unavailable */
export const ruleBasedParse = (query, now = new Date()) => {
  const q = query.toLowerCase().trim();
  const filters = {};
  let entity = 'orders';
  let interpretation = '';

  if (
    /product|item|sku|catalog/.test(q) &&
    !/order|sale|bill|transaction|revenue/.test(q)
  ) {
    entity = /inventory|stock|restock|low stock|out of stock/.test(q) ? 'inventory' : 'products';
  }
  if (/inventory|low stock|out of stock|restock/.test(q) && !/order|sale/.test(q)) {
    entity = 'inventory';
  }

  const above = q.match(/(?:above|over|more than|greater than|>=)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  const below = q.match(/(?:below|under|less than|<=)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  const between = q.match(/between\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);

  if (entity === 'orders') {
    if (above) {
      filters.minTotal = Number(above[1]);
      interpretation += `Orders above ₹${above[1]}. `;
    }
    if (below) {
      filters.maxTotal = Number(below[1]);
      interpretation += `Orders below ₹${below[1]}. `;
    }
    if (between) {
      filters.minTotal = Number(between[1]);
      filters.maxTotal = Number(between[2]);
      interpretation += `Orders between ₹${between[1]} and ₹${between[2]}. `;
    }
    if (/cancel/.test(q)) {
      filters.status = 'cancelled';
      interpretation += 'Cancelled orders. ';
    } else if (/confirm/.test(q)) {
      filters.status = 'confirmed';
    }
    if (/\bcash\b/.test(q)) filters.paymentMethod = 'cash';
    if (/\bcard\b/.test(q)) filters.paymentMethod = 'card';
    if (/\bupi\b/.test(q)) filters.paymentMethod = 'upi';
  } else {
    if (above) {
      filters.minPrice = Number(above[1]);
      interpretation += `Price above ₹${above[1]}. `;
    }
    if (below) {
      filters.maxPrice = Number(below[1]);
      interpretation += `Price below ₹${below[1]}. `;
    }
    if (/out of stock|zero stock|no stock/.test(q)) {
      filters.outOfStockOnly = true;
      interpretation += 'Out of stock items. ';
    }
    if (/low stock/.test(q)) {
      filters.lowStockOnly = true;
      interpretation += 'Low stock items. ';
    }
  }

  const range = getDateRange(q, now);
  if (range) {
    filters.startDate = toDateStr(range.start);
    filters.endDate = toDateStr(range.end);
    interpretation += `Date range: ${filters.startDate} to ${filters.endDate}. `;
  }

  const catMatch = q.match(/(?:category|in)\s+([a-z\s]+?)(?:\s|$|from|last|above|below)/i);
  if (catMatch) {
    const cat = catMatch[1].trim();
    if (cat.length > 2 && !['the', 'all', 'last'].includes(cat)) {
      filters.category = cat.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/ (.)/g, (m) => m);
      // simpler: capitalize first letter of each word
      filters.category = cat.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  if (!interpretation) {
    interpretation = `Showing ${entity} matching your search.`;
  }

  return sanitizeParsed({
    entity,
    filters,
    sort: {
      field: entity === 'orders' ? 'createdAt' : 'name',
      order: 'desc',
    },
    limit: 50,
    interpretation: interpretation.trim(),
  });
};

function getDateRange(q, now) {
  if (/\btoday\b/.test(q)) {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (/\byesterday\b/.test(q)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (/last week|past week|previous week/.test(q)) {
    const end = endOfDay(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (/last month|past month/.test(q)) {
    const end = endOfDay(now);
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (/last (\d+) days?/.test(q)) {
    const m = q.match(/last (\d+) days?/);
    const days = parseInt(m[1], 10);
    const end = endOfDay(now);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  return null;
}

export const parseNaturalLanguageQuery = async (query) => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `You are a query parser for a retail POS system in India (currency INR ₹).
Today's date: ${today}
User question: "${query}"

Convert to JSON only (no markdown). Schema:
${SCHEMA}

Rules:
- "last week" = 7 days ending today
- "above 500" on orders = minTotal 500
- default entity for sales/bills/orders questions is "orders"
- default limit 50`;

  try {
    const hasKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!hasKey) {
      return { ...ruleBasedParse(query), source: 'rules' };
    }

    const response = await generateAIResponse(`nl-query: ${prompt}`);
    const json = extractJson(response);
    if (json) {
      return { ...sanitizeParsed(json), source: 'ai' };
    }
  } catch (err) {
    console.warn('NL parse AI failed:', err.message);
  }

  return { ...ruleBasedParse(query), source: 'rules' };
};
