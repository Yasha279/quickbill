import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Search, Loader2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI } from '../api';
import { formatCurrency, formatDateTime } from '../utils/format';

const EXAMPLES = [
  'Show me all orders above 500 from last week',
  'Cancelled orders from yesterday',
  'Cash payments today',
  'Orders below 200 last month',
  'Low stock products',
  'Products in Groceries category',
  'Out of stock items',
  'Products priced above 100',
];

const AISearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runSearch = async (text) => {
    const q = (text || query).trim();
    if (!q) {
      toast.error('Type a question first');
      return;
    }
    setQuery(q);
    setLoading(true);
    try {
      const { data } = await aiAPI.naturalSearch({ query: q });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Sparkles className="h-7 w-7 text-brand-600" />
          AI Smart Search
        </h1>
        <p className="mt-1 text-slate-500">
          Ask in plain English — e.g. orders above ₹500 from last week, low stock items, cash sales today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field py-3 pl-12 text-base"
            placeholder="Show me all orders above 500 from last week..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Ask AI
            </>
          )}
        </button>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Try examples</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => runSearch(ex)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="card border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/20">
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">Understood</p>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{result.interpretation}</p>
            <p className="mt-2 text-xs text-slate-500">
              {result.count} match{result.count !== 1 ? 'es' : ''} · parsed via {result.source === 'ai' ? 'AI' : 'smart rules'}
            </p>
            {result.summary && result.entity === 'orders' && (
              <p className="mt-2 text-sm">
                Total revenue: <strong>{formatCurrency(result.summary.totalRevenue)}</strong>
                {' · '}
                Avg order: <strong>{formatCurrency(result.summary.averageOrder)}</strong>
              </p>
            )}
          </div>

          {result.entity === 'orders' && (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Order #</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results?.length ? (
                    result.results.map((o) => (
                      <tr key={o._id} className="border-b dark:border-slate-800">
                        <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                        <td className="px-4 py-3">{o.customerName}</td>
                        <td className="px-4 py-3">{formatDateTime(o.createdAt)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(o.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-center capitalize">{o.status}</td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/orders/${o._id}/invoice`} className="text-brand-600">
                            <Eye className="inline h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No orders match this query
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {(result.entity === 'products' || result.entity === 'inventory') && (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results?.length ? (
                    result.results.map((p) => (
                      <tr key={p._id} className="border-b dark:border-slate-800">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">{p.sku}</td>
                        <td className="px-4 py-3">{p.category}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                        <td
                          className={`px-4 py-3 text-right ${
                            p.stock <= p.lowStockThreshold ? 'font-medium text-amber-600' : ''
                          }`}
                        >
                          {p.stock}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No products match this query
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearch;
