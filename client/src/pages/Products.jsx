import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { productsAPI, aiAPI } from '../api';
import { formatCurrency } from '../utils/format';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyProduct = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  sellingPrice: '',
  costPrice: '',
  stock: 0,
  lowStockThreshold: 10,
  image: '',
  description: '',
};

const Products = () => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const load = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getAll({ search, category, page, limit: 15 }),
        productsAPI.getCategories(),
      ]);
      setProducts(prodRes.data.data);
      setPagination(prodRes.data.pagination);
      setCategories(catRes.data.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, category, page]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p, sellingPrice: p.sellingPrice, costPrice: p.costPrice });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
      };
      if (editing) {
        await productsAPI.update(editing._id, payload);
        toast.success('Product updated');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const generateDescription = async () => {
    if (!form.name || !form.category) {
      toast.error('Enter name and category first');
      return;
    }
    try {
      const { data } = await aiAPI.generateDescription({
        name: form.name,
        category: form.category,
      });
      setForm((f) => ({ ...f, description: data.data.description }));
      toast.success('Description generated');
    } catch {
      toast.error('AI unavailable');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-slate-500">Manage your product catalog</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search name, SKU, barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-field w-auto"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        p.stock <= p.lowStockThreshold ? 'font-medium text-amber-600' : ''
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="p-1 text-slate-400 hover:text-brand-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 border-t p-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary"
              >
                Prev
              </button>
              <span className="py-2 text-sm">
                Page {page} of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <input className="input-field mt-1" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required disabled={!!editing} />
          </div>
          <div>
            <label className="text-sm font-medium">Barcode</label>
            <input className="input-field mt-1" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <input className="input-field mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required list="cats" />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="text-sm font-medium">Selling Price</label>
            <input type="number" className="input-field mt-1" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Cost Price</label>
            <input type="number" className="input-field mt-1" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Stock</label>
            <input type="number" className="input-field mt-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Low Stock Threshold</label>
            <input type="number" className="input-field mt-1" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <button type="button" onClick={generateDescription} className="text-sm text-brand-600 hover:underline">
                <Sparkles className="inline h-3 w-3" /> AI Generate
              </button>
            </div>
            <textarea className="input-field mt-1" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
