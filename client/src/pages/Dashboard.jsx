import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI, aiAPI } from '../api';
import { formatCurrency, formatDateTime } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="kpi-card">
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm text-slate-500">{label}</p>
    <p className="font-display text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getCharts({ days: 7 }),
        ]);
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadAiSummary = async () => {
    try {
      const { data } = await aiAPI.salesSummary();
      setAiSummary(data.data.summary);
      toast.success('AI summary generated');
    } catch {
      toast.error('AI summary unavailable');
    }
  };

  if (loading) return <LoadingSpinner />;

  const dailyData =
    charts?.dailyRevenue?.map((d) => ({
      date: d._id.slice(5),
      revenue: d.revenue,
      orders: d.orders,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Meera! Here&apos;s your shop overview.</p>
        </div>
        <button onClick={loadAiSummary} className="btn-secondary">
          <Sparkles className="h-4 w-4" />
          AI Daily Summary
        </button>
      </div>

      {aiSummary && (
        <div className="card border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/30">
          <p className="mb-1 text-sm font-semibold text-brand-700 dark:text-brand-300">AI Insight</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{aiSummary}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Today's Sales"
          value={formatCurrency(stats?.todaySales)}
          sub={`${stats?.todayOrders || 0} orders today`}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          sub={`${stats?.totalOrders || 0} total orders`}
          color="bg-brand-100 text-brand-600 dark:bg-brand-900/30"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={stats?.lowStockCount || 0}
          sub="Items need restock"
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
        />
        <KpiCard
          icon={Package}
          label="Stock Health"
          value={`${stats?.stockHealth?.healthy || 0}/${stats?.stockHealth?.totalProducts || 0}`}
          sub={`${stats?.stockHealth?.outOfStock || 0} out of stock`}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-display font-semibold">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a7ff5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1a7ff5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#1a7ff5" fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-display font-semibold">Best Sellers</h3>
          <div className="space-y-3">
            {stats?.bestSelling?.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{p.productName}</span>
                <span className="text-slate-500">{p.totalQty} sold</span>
              </div>
            ))}
            {!stats?.bestSelling?.length && (
              <p className="text-sm text-slate-500">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-display font-semibold">Low Stock Alerts</h3>
          <div className="space-y-2">
            {stats?.lowStock?.slice(0, 6).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-900/20"
              >
                <span>{p.name}</span>
                <span className="font-medium text-amber-700">
                  {p.stock} / {p.lowStockThreshold}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-display font-semibold">Recent Transactions</h3>
          <div className="space-y-2">
            {stats?.recentOrders?.map((o) => (
              <div
                key={o._id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                </div>
                <span className="font-semibold text-brand-600">{formatCurrency(o.grandTotal)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {charts?.categorySales?.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-display font-semibold">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.categorySales.map((c) => ({ name: c._id, revenue: c.revenue }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#1a7ff5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


