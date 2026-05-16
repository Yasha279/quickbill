import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { reportsAPI, productsAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { exportToExcel } from '../utils/exportExcel';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [tab, setTab] = useState('sales');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    cashier: '',
  });
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsAPI.getCategories().then((r) => setCategories(r.data.data)).catch(() => {});
    reportsAPI.getStaff().then((r) => setStaff(r.data.data)).catch(() => {});
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === 'sales') {
        const { data } = await reportsAPI.getSales(filters);
        setSalesData(data.data);
      } else {
        const { data } = await reportsAPI.getInventory({
          category: filters.category,
          lowStock: tab === 'low-stock' ? 'true' : undefined,
        });
        setInventoryData(data.data);
      }
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [tab]);

  const handleServerExport = async (type) => {
    try {
      const res = await reportsAPI.export({ ...filters, type });
      saveAs(res.data, `quickbill-${type}.xlsx`);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const exportClientSales = () => {
    if (!salesData?.orders?.length) return toast.error('No data');
    exportToExcel(
      salesData.orders.map((o) => ({
        'Order #': o.orderNumber,
        Customer: o.customerName,
        Total: o.grandTotal,
        Tax: o.tax,
        Status: o.status,
        Date: new Date(o.createdAt).toLocaleDateString(),
      })),
      'sales-report'
    );
    toast.success('Exported');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-slate-500">Sales, inventory & export analytics</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['sales', 'inventory', 'low-stock'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap gap-3">
        <input type="date" className="input-field w-auto" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" className="input-field w-auto" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <select className="input-field w-auto" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {tab === 'sales' && (
          <select className="input-field w-auto" value={filters.cashier} onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}>
            <option value="">All Staff</option>
            {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        )}
        <button onClick={loadReport} className="btn-primary">Apply Filters</button>
        <button onClick={() => handleServerExport(tab === 'inventory' || tab === 'low-stock' ? 'inventory' : 'sales')} className="btn-secondary">
          <Download className="h-4 w-4" /> Export XLSX
        </button>
        {tab === 'sales' && (
          <button onClick={exportClientSales} className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" /> Client Export
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === 'sales' && salesData ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="kpi-card"><p className="text-sm text-slate-500">Revenue</p><p className="text-xl font-bold">{formatCurrency(salesData.summary?.totalRevenue)}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Orders</p><p className="text-xl font-bold">{salesData.summary?.totalOrders}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Tax</p><p className="text-xl font-bold">{formatCurrency(salesData.summary?.totalTax)}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Discounts</p><p className="text-xl font-bold">{formatCurrency(salesData.summary?.totalDiscount)}</p></div>
          </div>
          <div className="card">
            <h3 className="mb-3 font-semibold">Best Selling Products</h3>
            {salesData.bestSelling?.map((p, i) => (
              <div key={i} className="flex justify-between border-b py-2 text-sm dark:border-slate-800">
                <span>{p.productName}</span>
                <span>{p.totalQty} sold · {formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : inventoryData ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="kpi-card"><p className="text-sm text-slate-500">Products</p><p className="text-xl font-bold">{inventoryData.summary?.totalProducts}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Stock Value</p><p className="text-xl font-bold">{formatCurrency(inventoryData.summary?.totalStockValue)}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Low Stock</p><p className="text-xl font-bold">{inventoryData.summary?.lowStockCount}</p></div>
            <div className="kpi-card"><p className="text-sm text-slate-500">Out of Stock</p><p className="text-xl font-bold">{inventoryData.summary?.outOfStock}</p></div>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="pb-2">Name</th><th className="pb-2">SKU</th><th className="pb-2">Stock</th><th className="pb-2 text-right">Value</th></tr></thead>
              <tbody>
                {inventoryData.products?.map((p) => (
                  <tr key={p._id} className="border-b dark:border-slate-800">
                    <td className="py-2">{p.name}</td>
                    <td>{p.sku}</td>
                    <td className={p.stock <= p.lowStockThreshold ? 'text-amber-600' : ''}>{p.stock}</td>
                    <td className="text-right">{formatCurrency(p.stock * p.costPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
