import { useEffect, useState } from 'react';
import { Sparkles, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { shopAPI, aiAPI } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';

const Settings = () => {
  const { user } = useSelector((s) => s.auth);
  const { darkMode, toggleTheme } = useTheme();
  const [shop, setShop] = useState(null);
  const [trendInsight, setTrendInsight] = useState('');

  useEffect(() => {
    shopAPI.getInfo().then((r) => setShop(r.data.data)).catch(() => {});
  }, []);

  const loadTrend = async () => {
    try {
      const { data } = await aiAPI.trendInsight();
      setTrendInsight(data.data.insight);
      toast.success('Trend analysis ready');
    } catch {
      toast.error('AI trend unavailable');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-slate-500">Shop preferences & AI tools</p>
      </div>

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><Store className="h-5 w-5" /> Shop Details</h3>
        {shop && (
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{shop.name}</dd></div>
            <div><dt className="text-slate-500">Address</dt><dd>{shop.address}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd>{shop.phone}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd>{shop.email}</dd></div>
            <div><dt className="text-slate-500">GSTIN</dt><dd>{shop.gstin}</dd></div>
            <div><dt className="text-slate-500">Tax Rate</dt><dd>{shop.taxRate}% GST</dd></div>
          </dl>
        )}
        <p className="mt-4 text-xs text-slate-400">Edit shop details in server .env file</p>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Appearance</h3>
        <button onClick={toggleTheme} className="btn-secondary">
          {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Account</h3>
        <p className="text-sm"><span className="text-slate-500">Name:</span> {user?.name}</p>
        <p className="text-sm"><span className="text-slate-500">Email:</span> {user?.email}</p>
        <p className="text-sm capitalize"><span className="text-slate-500">Role:</span> {user?.role}</p>
      </div>

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5" /> AI Insights</h3>
        <button onClick={loadTrend} className="btn-secondary mb-4">Analyze Sales Trends</button>
        {trendInsight && <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{trendInsight}</p>}
      </div>
    </div>
  );
};

export default Settings;
