import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Recycle,
  Sparkles,
  Search,
  Layers,
  HelpCircle,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  ShoppingCart,
  Package
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenSignup,
}) => {
  const { user, profile, logout } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const roleLabelMap: Record<string, string> = {
    SELLER: 'Seller',
    BUYER: 'Buyer',
    PROCESSOR: 'Processor / Industry',
    GENERAL_USER: 'General User',
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-white shadow-sm shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  WORTH<span className="text-emerald-700">X</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none mt-0.5">
                Where Waste Finds Value
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'text-emerald-900 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('marketplace')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'marketplace'
                  ? 'text-emerald-900 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              Marketplace
            </button>
            <button
              onClick={() => handleNav('ai-search')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'ai-search'
                  ? 'text-emerald-900 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Search
            </button>
            <button
              onClick={() => handleNav('orders')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'text-emerald-900 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-600" />
              My Orders
            </button>
            <button
              onClick={() => handleNav('how-it-works')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'how-it-works'
                  ? 'text-emerald-900 bg-emerald-50/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              How It Works
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Procurement Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="View Procurement Cart"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-bold text-slate-800">Cart</span>
              {totalItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-800 text-white font-black text-[10px] shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-800 text-sm font-medium shadow-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold leading-tight text-slate-900 truncate max-w-[120px]">
                      {profile?.fullName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {roleLabelMap[profile?.role || 'GENERAL_USER']}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        handleNav('dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 text-left font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        handleNav('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 text-left font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      My Profile
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        handleNav('home');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-900 hover:bg-slate-100/80 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={onOpenSignup}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-emerald-900"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-800" />
              {totalItemsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-800 text-white font-bold text-[9px] flex items-center justify-center -top-1 -right-1 absolute">
                  {totalItemsCount}
                </span>
              )}
            </button>
            {user && (
              <button
                onClick={() => handleNav('dashboard')}
                className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs"
              >
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-[#FBFBFA] px-4 pt-2 pb-6 space-y-2">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('marketplace')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Marketplace
          </button>
          <button
            onClick={() => handleNav('ai-search')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            AI Search
          </button>
          <button
            onClick={() => handleNav('orders')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-emerald-600" />
            My Orders
          </button>
          <button
            onClick={() => handleNav('how-it-works')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            How It Works
          </button>

          <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNav('dashboard')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-base font-semibold text-emerald-900 bg-emerald-50 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5 text-emerald-700" />
                  Dashboard ({profile?.fullName || user.email?.split('@')[0]})
                </button>
                <button
                  onClick={() => handleNav('profile')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  My Profile
                </button>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    handleNav('home');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignup();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
