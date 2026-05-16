import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersAPI } from '../api';
import { formatCurrency, formatDateTime } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.getAll({ status, page, limit: 15 });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, page]);

  const cancelOrder = async (id) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await ordersAPI.cancel(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-slate-500">Order history and management</p>
      </div>

      <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">All Status</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Cashier</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">{o.cashier?.name}</td>
                  <td className="px-4 py-3">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(o.grandTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${o._id}/invoice`} className="inline p-1 text-brand-600"><Eye className="h-4 w-4" /></Link>
                    {o.status === 'confirmed' && (
                      <button onClick={() => cancelOrder(o._id)} className="inline p-1 text-red-500"><XCircle className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 border-t p-4">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary">Prev</button>
              <span className="py-2 text-sm">Page {page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
