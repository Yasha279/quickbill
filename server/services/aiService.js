import { shopConfig } from '../config/shop.js';

const callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
};

const callOpenRouter = async (prompt) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
    },
    body: JSON.stringify({
      model: 'google/gemma-2-9b-it:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
};

export const generateAIResponse = async (prompt) => {
  const provider = process.env.AI_PROVIDER || 'gemini';

  try {
    if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      return await callOpenRouter(prompt);
    }
    if (process.env.GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
    if (process.env.OPENROUTER_API_KEY) {
      return await callOpenRouter(prompt);
    }
    return getFallbackResponse(prompt);
  } catch (err) {
    console.warn('AI API failed, using fallback:', err.message);
    return getFallbackResponse(prompt);
  }
};

function getFallbackResponse(prompt) {
  if (prompt.includes('product description')) {
    return 'Premium quality product from Meera\'s shop. Perfect for everyday use with great value and reliable performance.';
  }
  if (prompt.includes('sales summary')) {
    return 'Sales are steady today. Focus on top-selling categories and ensure low-stock items are restocked promptly.';
  }
  if (prompt.includes('restock')) {
    return 'Review items below low-stock threshold. Prioritize fast-moving products and order 2x the threshold quantity for safety stock.';
  }
  return 'AI insights unavailable. Configure GEMINI_API_KEY or OPENROUTER_API_KEY in your environment.';
}

export const buildDescriptionPrompt = (name, category) =>
  `Write a concise, SEO-friendly retail product description (2-3 sentences) for:
Product: ${name}
Category: ${category}
Shop: ${shopConfig.name}
Do not use markdown.`;

export const buildSalesSummaryPrompt = (stats) =>
  `As a retail business analyst, write a brief daily sales summary (3-4 bullet points) for shop owner Meera:
${JSON.stringify(stats, null, 2)}
Be actionable and friendly. Plain text only.`;

export const buildRestockPrompt = (products) =>
  `As inventory advisor for ${shopConfig.name}, suggest restock priorities for these low-stock items:
${JSON.stringify(products, null, 2)}
Provide numbered recommendations with suggested quantities. Plain text only.`;

export const buildTrendPrompt = (chartData) =>
  `Explain sales trends for a retail owner in 2-3 short paragraphs:
${JSON.stringify(chartData, null, 2)}
Plain text, no markdown.`;
