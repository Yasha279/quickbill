import { useEffect, useState } from 'react';
import { PackagePlus, Sparkles, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryAPI, productsAPI, aiAPI } from '../api';
import { formatCurrency, formatDateTime } from '../utils/format';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Inventory = () => {
  const [lowStock, setLowStock] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(null);
  const [quantity, setQuantity] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const [lowRes, logRes] = await Promise.all([
        inventoryAPI.getLowStock(),
        inventoryAPI.getLogs({ limit: 30 }),
      ]);
      setLowStock(lowRes.data.data);
      setLogs(logRes.data.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      await productsAPI.restock(restockModal._id, Number(quantity));
      toast.success('Stock restocked');
      setRestockModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restock failed');
    }
  };

  const loadAi = async () => {
    try {
      const { data } = await aiAPI.restockSuggestions();
      setAiSuggestions(data.data.suggestions);
    } catch {
      toast.error('AI suggestions unavailable');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="text-slate-500">Stock levels, restock & movement history</p>
        </div>
        <button onClick={loadAi} className="btn-secondary">
          <Sparkles className="h-4 w-4" /> AI Restock Tips
        </button>
      </div>

      {aiSuggestions && (
        <div className="card whitespace-pre-wrap text-sm">{aiSuggestions}</div>
      )}

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-600">
          <PackagePlus className="h-5 w-5" /> Low Stock ({lowStock.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Product</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Stock</th>
                <th className="pb-2 text-right">Threshold</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{p.sku}</td>
                  <td className="py-2">{p.category}</td>
                  <td className="py-2 text-right text-amber-600">{p.stock}</td>
                  <td className="py-2 text-right">{p.lowStockThreshold}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => setRestockModal(p)} className="btn-primary py-1 text-xs">
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <History className="h-5 w-5" /> Stock Movement History
        </h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="flex flex-wrap items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <div>
                <span className="font-medium">{log.productId?.name}</span>
                <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  log.type === 'SALE' ? 'bg-red-100 text-red-700' :
                  log.type === 'RESTOCK' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>{log.type}</span>
              </div>
              <span>{log.previousStock} → {log.newStock} ({log.quantity > 0 ? '+' : ''}{log.type === 'SALE' ? '-' : '+'}{log.quantity})</span>
              <span className="text-slate-500">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={!!restockModal} onClose={() => setRestockModal(null)} title={`Restock: ${restockModal?.name}`}>
        <form onSubmit={handleRestock} className="space-y-4">
          <p className="text-sm text-slate-500">Current stock: {restockModal?.stock}</p>
          <div>
            <label className="text-sm font-medium">Quantity to add</label>
            <input type="number" min="1" className="input-field mt-1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Confirm Restock</button>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
