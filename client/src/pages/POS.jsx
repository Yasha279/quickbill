import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Minus, Trash2, ScanBarcode, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI, shopAPI } from '../api';
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  setCustomer,
  setPaymentMethod,
  setDiscount,
  clearCart,
  selectCartSubtotal,
} from '../redux/slices/cartSlice';
import { formatCurrency } from '../utils/format';

const POS = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart);
  const subtotal = useSelector(selectCartSubtotal);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [processing, setProcessing] = useState(false);
  const barcodeRef = useRef(null);

  useEffect(() => {
    shopAPI.getInfo().then((r) => setTaxRate(r.data.data.taxRate || 18)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await productsAPI.getAll({ search, limit: 50 });
        setProducts(data.data);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const taxable = Math.max(0, subtotal - cart.discount);
  const tax = Math.round(taxable * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.round((taxable + tax) * 100) / 100;

  const handleBarcode = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    try {
      const { data } = await productsAPI.getAll({ search: barcode.trim(), limit: 1 });
      const p = data.data.find((x) => x.barcode === barcode.trim() || x.sku === barcode.trim());
      if (p && p.stock > 0) {
        dispatch(addToCart(p));
        toast.success(`Added ${p.name}`);
        setBarcode('');
      } else {
        toast.error('Product not found or out of stock');
      }
    } catch {
      toast.error('Scan failed');
    }
  };

  const confirmOrder = async () => {
    if (!cart.items.length) {
      toast.error('Cart is empty');
      return;
    }
    setProcessing(true);
    try {
      const { data } = await ordersAPI.create({
        items: cart.items.map((i) => ({ productId: i._id, quantity: i.quantity })),
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        paymentMethod: cart.paymentMethod,
        discount: cart.discount,
      });
      dispatch(clearCart());
      toast.success('Order confirmed!');
      navigate(`/orders/${data.data._id}/invoice`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b p-4 dark:border-slate-800">
          <h1 className="font-display text-xl font-bold">POS Billing</h1>
          <form onSubmit={handleBarcode} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeRef}
                className="input-field pl-10"
                placeholder="Scan barcode or enter SKU..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-secondary">Add</button>
          </form>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-10"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <button
              key={p._id}
              disabled={p.stock === 0}
              onClick={() => {
                dispatch(addToCart(p));
                toast.success(`Added ${p.name}`);
              }}
              className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-brand-300 hover:shadow-md disabled:opacity-40 dark:border-slate-800"
            >
              <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
              <p className="mt-1 font-bold text-brand-600">{formatCurrency(p.sellingPrice)}</p>
              <p className="text-xs text-slate-500">Stock: {p.stock}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col rounded-xl border border-slate-200 bg-white lg:w-96 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b p-4 font-display text-lg font-bold dark:border-slate-800">Cart</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.map((item) => (
            <div key={item._id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-brand-600">{formatCurrency(item.sellingPrice)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))} className="rounded p-1 hover:bg-slate-200"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))} className="rounded p-1 hover:bg-slate-200"><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={() => dispatch(removeFromCart(item._id))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {!cart.items.length && <p className="text-center text-sm text-slate-500">Cart is empty</p>}
        </div>
        <div className="border-t p-4 space-y-3 dark:border-slate-800">
          <input className="input-field" placeholder="Customer name" value={cart.customerName} onChange={(e) => dispatch(setCustomer({ name: e.target.value }))} />
          <input className="input-field" placeholder="Phone" value={cart.customerPhone} onChange={(e) => dispatch(setCustomer({ phone: e.target.value }))} />
          <select className="input-field" value={cart.paymentMethod} onChange={(e) => dispatch(setPaymentMethod(e.target.value))}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-2">
            <input type="number" className="input-field" placeholder="Discount" value={cart.discount || ''} onChange={(e) => dispatch(setDiscount(Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(cart.discount)}</span></div>
            <div className="flex justify-between"><span>GST ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-brand-600">{formatCurrency(grandTotal)}</span></div>
          </div>
          <button onClick={confirmOrder} disabled={processing || !cart.items.length} className="btn-primary w-full">
            <Check className="h-4 w-4" /> {processing ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
