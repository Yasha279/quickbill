import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Receipt, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../redux/slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { token, loading, error } = useSelector((state) => state.auth);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-bold">QuickBill POS</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Smart billing for Meera&apos;s retail shop
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Manage products, inventory, POS billing, invoices, reports, and AI insights.
          </p>
        </div>
        <p className="text-sm text-brand-200">© 2026 QuickBill POS System</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-slate-500">Enter credentials to access the POS</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="meera@quickbill.shop"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <p className="font-medium">Demo: meera@quickbill.shop / admin123</p>
            <p className="text-slate-500">Staff: ravi@quickbill.shop / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


