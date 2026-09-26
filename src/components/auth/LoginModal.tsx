import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Recycle,
  UserCheck,
  Building2,
  ShoppingCart
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignup: () => void;
  onOpenForgotPassword: () => void;
  onLoginSuccess: (role?: 'BUYER' | 'SELLER') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenSignup,
  onOpenForgotPassword,
  onLoginSuccess,
}) => {
  const { login, loginAsDemoUser } = useAuth();

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [loadingDemoRole, setLoadingDemoRole] = useState<'BUYER' | 'SELLER' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await login(email.trim(), password);
      const name = userProfile?.fullName || email.split('@')[0] || 'User';
      const role = userProfile?.role === 'SELLER' ? 'SELLER' : 'BUYER';
      setSuccessMessage(`Welcome back, ${name}! Redirecting...`);
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(role);
        onClose();
      }, 600);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Incorrect email or password.');
    }
  };

  const handleDemoLogin = async (role: 'BUYER' | 'SELLER') => {
    setErrorMessage(null);
    setLoadingDemoRole(role);
    try {
      const userProfile = await loginAsDemoUser(role);
      setSuccessMessage(
        role === 'SELLER'
          ? 'Logged in as Demo Seller! Opening Seller Dashboard...'
          : 'Logged in as Demo Buyer! Opening Marketplace...'
      );
      setTimeout(() => {
        setLoadingDemoRole(null);
        onLoginSuccess(role);
        onClose();
      }, 500);
    } catch (err: any) {
      setLoadingDemoRole(null);
      setErrorMessage('Could not activate demo session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Recycle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  WORTH<span className="text-emerald-700">X</span>
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Welcome back
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant Demo Accounts Selector */}
        <div className="px-6 pt-4 pb-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Instant One-Click Demo Access
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading || Boolean(loadingDemoRole)}
              onClick={() => handleDemoLogin('BUYER')}
              className="p-3 rounded-2xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <ShoppingCart className="w-4 h-4 text-sky-700" />
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-200 text-sky-900">
                  BUYER
                </span>
              </div>
              <h4 className="text-xs font-black text-sky-950">
                Demo Buyer
              </h4>
              <p className="text-[10px] text-sky-800/80 mt-0.5">
                Browse, cart & checkout
              </p>
            </button>

            <button
              type="button"
              disabled={loading || Boolean(loadingDemoRole)}
              onClick={() => handleDemoLogin('SELLER')}
              className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  SELLER
                </span>
              </div>
              <h4 className="text-xs font-black text-amber-950">
                Demo Seller
              </h4>
              <p className="text-[10px] text-amber-800/80 mt-0.5">
                Add listings & dispatch
              </p>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 py-2 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Or Sign in with Email
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Error / Success Feedback */}
        <div className="px-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Email & Password Form */}
        <div className="p-6 pt-2">
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-700 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenForgotPassword();
                  }}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-700 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(loadingDemoRole)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 cursor-pointer"
            >
              {loading || loadingDemoRole ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  Authenticating...
                </>
              ) : (
                <>
                  Login with Supabase
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignup();
                }}
                className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
