import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MaterialListing, MaterialRequirement, UserRole, ChainCraftPassport, DigitalAgreement } from '../../types';
import { getSellerListings, deleteFirestoreListing, getUserRequirements } from '../../services/listingService';
import { getAllUserPassports, getAllUserAgreements } from '../../services/chaincraftService';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../../utils/materialImages';
import { OrdersManager } from '../OrdersManager';
import { ChainCraftPassportModal } from '../ChainCraftPassportModal';
import { formatINR } from '../../utils/currency';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Package,
  ShoppingCart,
  FileCheck,
  ShieldCheck,
  Award,
  User as UserIcon,
  Settings,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  LogOut,
  Building2,
  Hash,
  RefreshCw,
  Phone,
  Mail,
  Edit3
} from 'lucide-react';

interface DashboardProps {
  onNavigateMarketplace: () => void;
  onNavigateAiSearch: () => void;
  onOpenCreateListing: () => void;
  onEditListing?: (listing: MaterialListing) => void;
}

type DashboardView =
  | 'overview'
  | 'my-listings'
  | 'orders'
  | 'agreements'
  | 'chaincraft'
  | 'trust-center'
  | 'profile'
  | 'settings';

function formatAgreementDateTime(timestamp?: string): string {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateMarketplace,
  onNavigateAiSearch,
  onOpenCreateListing,
  onEditListing,
}) => {
  const { user, profile, logout, updateUserProfile } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  // Real data state
  const [userListings, setUserListings] = useState<MaterialListing[]>([]);
  const [userRequirements, setUserRequirements] = useState<MaterialRequirement[]>([]);
  const [userPassports, setUserPassports] = useState<ChainCraftPassport[]>([]);
  const [userAgreements, setUserAgreements] = useState<DigitalAgreement[]>([]);
  const [inspectedPassport, setInspectedPassport] = useState<ChainCraftPassport | null>(null);
  const [inspectedAgreement, setInspectedAgreement] = useState<DigitalAgreement | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(profile?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(profile?.phone || '');
  const [companyInput, setCompanyInput] = useState(profile?.companyName || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Load real user data
  const loadUserData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [listings, reqs, passports, agreements] = await Promise.all([
        getSellerListings(user.uid),
        getUserRequirements(user.uid),
        getAllUserPassports(user.uid),
        getAllUserAgreements(user.uid),
      ]);
      setUserListings(listings);
      setUserRequirements(reqs);
      setUserPassports(passports);
      setUserAgreements(agreements);
    } catch (err) {
      console.warn('Error fetching user dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      await deleteFirestoreListing(listingId);
      setUserListings((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err) {
      alert('Failed to delete listing. Please try again.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        fullName: fullNameInput.trim(),
        phone: phoneInput.trim(),
        companyName: companyInput.trim(),
      });
      setProfileSaveSuccess(true);
      setEditingProfile(false);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const roleBadgeMap: Record<UserRole, { label: string; color: string }> = {
    SELLER: { label: 'Seller / Generator', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    BUYER: { label: 'Buyer / Recycler', color: 'bg-sky-100 text-sky-900 border-sky-300' },
    PROCESSOR: { label: 'Processor / Industry', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    GENERAL_USER: { label: 'General User', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  };

  const currentRole = profile?.role || 'GENERAL_USER';

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F8FAF8] flex flex-col md:flex-row">
      
      {/* Dashboard Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* User Micro Profile Card */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-200 flex items-center justify-center font-bold text-sm">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-slate-900 truncate">
                {profile?.fullName || user?.email?.split('@')[0]}
              </p>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${roleBadgeMap[currentRole].color}`}>
                {roleBadgeMap[currentRole].label}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'overview'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={onNavigateMarketplace}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Layers className="w-4 h-4 text-emerald-700" />
              Marketplace
            </button>

            <button
              onClick={onNavigateAiSearch}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              AI Search
            </button>

            <button
              onClick={() => setActiveView('my-listings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'my-listings'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                My Listings
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-bold">
                {userListings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('orders')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'orders'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Orders & Requests
            </button>

            <button
              onClick={() => setActiveView('agreements')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'agreements'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Agreements
            </button>

            <button
              onClick={() => setActiveView('chaincraft')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'chaincraft'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ChainCraft Ledger
            </button>

            <button
              onClick={() => setActiveView('trust-center')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'trust-center'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              Trust Center
            </button>

            <div className="border-t border-slate-200/80 my-2" />

            <button
              onClick={() => setActiveView('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'profile'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Profile
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                activeView === 'settings'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-4 border-t border-slate-200/80 mt-6">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-y-auto">
        
        {/* Global welcome notification banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Live Account Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Welcome, {profile?.fullName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Account ID: <code className="text-slate-700 font-mono text-xs">{user?.uid.slice(0, 12)}...</code> • Role: <strong className="text-slate-800">{roleBadgeMap[currentRole].label}</strong>
            </p>
          </div>

          {/* Dynamic Role Action */}
          <div className="flex items-center gap-2">
            {currentRole === 'SELLER' && (
              <button
                onClick={onOpenCreateListing}
                className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                Create Listing
              </button>
            )}

            {currentRole === 'BUYER' && (
              <button
                onClick={onNavigateMarketplace}
                className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-emerald-300" />
                Find Materials
              </button>
            )}

            {currentRole === 'PROCESSOR' && (
              <button
                onClick={onNavigateMarketplace}
                className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-300" />
                Find Raw Materials
              </button>
            )}

            {currentRole === 'GENERAL_USER' && (
              <button
                onClick={onNavigateMarketplace}
                className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-300" />
                Explore Marketplace
              </button>
            )}
          </div>
        </div>

        {/* VIEW 1: Overview */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            
            {/* 4 Cards (Requirement 11: Active Listings, Orders, Agreements, Verified Transactions) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Active Listings */}
              <div
                onClick={() => setActiveView('my-listings')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Active Listings</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {userListings.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {userListings.length === 0 ? 'No activity yet.' : 'Real listings published'}
                </p>
              </div>

              {/* Card 2: Orders */}
              <div
                onClick={() => setActiveView('orders')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  0
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  No activity yet.
                </p>
              </div>

              {/* Card 3: Agreements */}
              <div
                onClick={() => setActiveView('agreements')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Agreements</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  0
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  No activity yet.
                </p>
              </div>

              {/* Card 4: Verified Transactions */}
              <div
                onClick={() => setActiveView('chaincraft')}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Verified Transactions</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  0
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  No activity yet.
                </p>
              </div>

            </div>

            {/* Role Custom Action Block */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {currentRole === 'SELLER' && 'Seller Action Center'}
                    {currentRole === 'BUYER' && 'Buyer Procurement Workspace'}
                    {currentRole === 'PROCESSOR' && 'Industrial Feedstock Console'}
                    {currentRole === 'GENERAL_USER' && 'Community Resource Hub'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recommended steps tailored to your role
                  </p>
                </div>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {currentRole === 'SELLER' ? (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">1. Publish Listing</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Add material specifications, pricing, quantity, and moisture level.
                        </p>
                      </div>
                      <button
                        onClick={onOpenCreateListing}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Create listing now <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">2. Review Requests</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Check procurement inquiries from certified recycling facilities.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('orders')}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        View inquiries <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">3. ChainCraft Sign</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Execute digital dispatch verification with cryptographic hash.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('chaincraft')}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        ChainCraft preview <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : currentRole === 'BUYER' ? (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">1. Browse Feedstocks</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Explore tested by-products, prices, and minimum order thresholds.
                        </p>
                      </div>
                      <button
                        onClick={onNavigateMarketplace}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Browse listings <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">2. AI Material Matching</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Search by chemical grade, organic by-product, or polymer flake.
                        </p>
                      </div>
                      <button
                        onClick={onNavigateAiSearch}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Launch AI Search <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">3. Track Orders</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Monitor batch shipping status, custody transfer, and receipts.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('orders')}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Track deliveries <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">1. Explore Resources</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Discover how orange peels, eggshells, and plastics find value.
                        </p>
                      </div>
                      <button
                        onClick={onNavigateMarketplace}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Explore now <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">2. AI Assistant</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Search materials by application or industrial category.
                        </p>
                      </div>
                      <button
                        onClick={onNavigateAiSearch}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        AI Search <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">3. Complete Profile</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Update company name and location to unlock full features.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('profile')}
                        className="mt-4 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Edit Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: My Listings */}
        {activeView === 'my-listings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">My Material Listings</h2>
                <p className="text-xs text-slate-500">Live listings saved under your account in Firestore</p>
              </div>
              <button
                onClick={onOpenCreateListing}
                className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                Add Listing
              </button>
            </div>

            {userListings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No activity yet.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You haven&apos;t published any material listings yet. List agricultural waste, manufacturing scrap, or reusable packaging to connect with buyers.
                </p>
                <button
                  onClick={onOpenCreateListing}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userListings.map((item) => {
                  const displayImg = getMaterialImageUrl(item.materialName, item.category, item.imageUrl);
                  const fallbackSvg = getCategoryPlaceholderSvg(item.materialName, item.category);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3.5 items-start justify-between shadow-2xs hover:border-emerald-300 transition-all"
                    >
                      <img
                        src={displayImg}
                        alt={item.materialName}
                        onError={(e) => {
                          e.currentTarget.src = fallbackSvg;
                        }}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {item.materialName}
                        </h4>
                        <p className="text-xs font-extrabold text-emerald-800 mt-0.5">
                          {item.price}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-1">
                          {item.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onEditListing && (
                          <button
                            onClick={() => onEditListing(item)}
                            title="Edit listing"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(item.id)}
                          title="Delete listing"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Orders & Requests (Requirement 8 & 9: Real-time buyer tracking & seller workflow) */}
        {activeView === 'orders' && (
          <div className="space-y-6">
            <OrdersManager
              onExploreMarketplace={onNavigateMarketplace}
              defaultTab={profile?.role === 'SELLER' ? 'seller' : 'buyer'}
            />
          </div>
        )}

        {/* VIEW 4: Agreements */}
        {activeView === 'agreements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Digital Transaction Agreements</h2>
                <p className="text-xs text-slate-500">
                  Standardized bilateral circular contracts with mutual terms and delivery covenants
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                {userAgreements.length} Active Agreements
              </span>
            </div>

            {userAgreements.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No agreements recorded yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Digital transaction agreements are automatically generated whenever a buyer initiates an order or procurement covenant on WORTHX.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAgreements.map((agreement) => (
                  <div
                    key={agreement.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-700" />
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {agreement.agreementId}
                        </span>
                      </div>
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                        {agreement.agreementStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Material</span>
                        <span className="font-bold text-slate-900 block truncate">{agreement.materialName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Volume</span>
                        <span className="font-bold text-slate-900 block">
                          {agreement.quantity} {agreement.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Total Amount</span>
                        <span className="font-extrabold text-emerald-900 block">
                          {formatINR(agreement.totalAmountINR)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Associated Order</span>
                        <span className="font-mono text-slate-700 block truncate">{agreement.orderId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Seller</span>
                        <span className="font-bold text-slate-800 block truncate">{agreement.sellerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Buyer</span>
                        <span className="font-bold text-slate-800 block truncate">{agreement.buyerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Date &amp; Time</span>
                        <span className="font-bold text-slate-800 block truncate">{formatAgreementDateTime(agreement.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[11px]">Payment Method</span>
                        <span className="font-bold text-emerald-900 block truncate">{agreement.paymentMethod || 'UPI'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-slate-400">
                        SHA-256 Digest #{agreement.hash?.slice(0, 10)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectedAgreement(agreement);
                          const matchingPassport = userPassports.find(
                            (p) => p.orderId === agreement.orderId || p.agreementId === agreement.agreementId
                          );
                          setInspectedPassport(matchingPassport || null);
                          setIsPassportModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        Inspect Agreement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: ChainCraft */}
        {activeView === 'chaincraft' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">ChainCraft™ Verification Ledger</h2>
                <p className="text-xs text-slate-500">
                  SHA-256 cryptographic audit logs ensuring tamper-evident provenance and authentic circular chain-of-custody
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Connected to Supabase RLS
              </span>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base">Network Integrity Status</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">Status: Active & Validated</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block mb-1">Cryptographic Standard</span>
                  <span className="font-mono text-white font-bold">SHA-256 Digest Layer</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block mb-1">Passports Registered</span>
                  <span className="font-mono text-emerald-400 font-bold block">
                    {userPassports.length} Verified Passports
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block mb-1">Audit Trail</span>
                  <span className="text-slate-300 font-medium">Tamper-Evident SHA-256</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">How ChainCraft Works</p>
                ChainCraft creates a deterministic SHA-256 payload for every resource listing, transaction agreement, dispatched shipment, and buyer confirmation. This guarantees buyers and ESG auditors that the material was genuinely diverted from waste into circular reuse.
              </div>
            </div>

            {/* List of Resource Passports */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Resource Passports & Lifecycle Ledgers ({userPassports.length})
              </h3>

              {userPassports.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                  No resource passports generated yet. Passports are created automatically when seller listings or orders are registered.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPassports.map((passport) => (
                    <div
                      key={passport.id}
                      className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Passport ID
                          </span>
                          <span className="font-mono text-xs font-black text-emerald-950">
                            {passport.passportId}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {passport.lifecycleStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block font-semibold text-[11px]">Material</span>
                          <span className="font-bold text-slate-900 block truncate">{passport.materialName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold text-[11px]">Category</span>
                          <span className="font-bold text-slate-900 block truncate">{passport.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold text-[11px]">Volume</span>
                          <span className="font-bold text-slate-900 block">{passport.quantity} {passport.unit}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold text-[11px]">Events Stamped</span>
                          <span className="font-bold text-emerald-900 block">{passport.events?.length || 1} Events</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded max-w-[160px] truncate">
                          Digest: #{passport.latestHash?.slice(0, 12)}...
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedPassport(passport);
                            const matchingAgr = userAgreements.find(
                              (a) => a.agreementId === passport.agreementId || a.orderId === passport.orderId
                            );
                            setInspectedAgreement(matchingAgr || null);
                            setIsPassportModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          View Passport
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: Trust Center */}
        {activeView === 'trust-center' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Trust Center & Compliance</h2>
              <p className="text-xs text-slate-500">Security guarantees, standards, and verified platform protocols</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Supabase Row-Level Security (RLS)</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Strict user isolation enforced at the database layer. No unauthorized writes; private profiles and transactions are readable and editable only by authenticated parties.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Quality Specifications</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Standardized metrics for moisture content, foreign debris percentage, and packaging formats ensure processors receive actionable raw feedstocks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: Profile */}
        {activeView === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">User Profile</h2>
                <p className="text-xs text-slate-500">Manage your credentials and marketplace identity</p>
              </div>

              {!editingProfile && (
                <button
                  onClick={() => {
                    setFullNameInput(profile?.fullName || '');
                    setPhoneInput(profile?.phone || '');
                    setCompanyInput(profile?.companyName || '');
                    setEditingProfile(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  Edit Profile
                </button>
              )}
            </div>

            {profileSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-emerald-700 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-emerald-700 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      placeholder="e.g. Pacific Bioproducts Ltd."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-emerald-700 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {profile?.fullName || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {user?.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Phone</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {profile?.phone || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Role</span>
                    <span className={`inline-block font-bold text-xs mt-1 px-2 py-0.5 rounded-full border ${roleBadgeMap[currentRole].color}`}>
                      {roleBadgeMap[currentRole].label}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Company / Organization</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {profile?.companyName || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Member Since</span>
                    <span className="font-medium text-slate-700 text-sm mt-0.5 block">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 8: Settings */}
        {activeView === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Workspace Settings</h2>
              <p className="text-xs text-slate-500">Security and notification preferences</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Email Notifications</h4>
                  <p className="text-xs text-slate-500">Receive alerts when buyers inquire about your listings</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">ChainCraft Ledger Alerts</h4>
                  <p className="text-xs text-slate-500">Get notified when a transaction hash is stamped</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                >
                  Sign Out of Current Session
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ChainCraft Resource Passport & Agreement Modal */}
      <ChainCraftPassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        passport={inspectedPassport}
        agreement={inspectedAgreement}
      />

    </div>
  );
};
