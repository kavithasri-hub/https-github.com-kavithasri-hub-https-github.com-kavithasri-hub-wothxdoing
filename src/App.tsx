/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { QuickActions } from './components/QuickActions';
import { MarketplacePreview } from './components/MarketplacePreview';
import { AiSearchSection } from './components/AiSearchSection';
import { AiSearchPage } from './components/AiSearchPage';
import { HowItWorks } from './components/HowItWorks';
import { ChainCraftTrust } from './components/ChainCraftTrust';
import { Footer } from './components/Footer';
import { LoginModal } from './components/auth/LoginModal';
import { SignupModal } from './components/auth/SignupModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { CreateListingModal } from './components/CreateListingModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersManager } from './components/OrdersManager';
import { Dashboard } from './components/dashboard/Dashboard';
import { DEMO_MATERIALS } from './data/demoMaterials';
import { MaterialListing, UserRole } from './types';
import { getFirestoreListings } from './services/listingService';

function MainApp() {
  const { user, profile } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');

  // Listings State (combined demo + real firestore listings)
  const [realListings, setRealListings] = useState<MaterialListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<MaterialListing | null>(null);
  const [selectedDesiredQuantity, setSelectedDesiredQuantity] = useState<number | undefined>(undefined);
  const [activeAiQuery, setActiveAiQuery] = useState<string>('');

  // Modals
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<MaterialListing | null>(null);
  const [signupInitialRole, setSignupInitialRole] = useState<UserRole>('BUYER');

  // Fetch real listings from Firestore on mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const liveItems = await getFirestoreListings();
        setRealListings(liveItems);
      } catch (err) {
        console.warn('Could not fetch initial Firestore listings:', err);
      }
    };
    fetchListings();
  }, []);

  // Combined listings: Real user listings first, followed by Demo listings
  const allListings = [...realListings, ...DEMO_MATERIALS];

  // Callback when a new listing is created or edited in Firestore
  const handleListingCreated = (savedListing: MaterialListing) => {
    setRealListings((prev) => {
      const exists = prev.some((item) => item.id === savedListing.id);
      if (exists) {
        return prev.map((item) => (item.id === savedListing.id ? savedListing : item));
      }
      return [savedListing, ...prev];
    });
    setEditingListing(null);
    setActiveTab('marketplace');
  };

  const handleSelectMaterialById = (id: string) => {
    const found = allListings.find((m) => m.id === id);
    if (found) {
      setSelectedListing(found);
      setSelectedDesiredQuantity(undefined);
    }
  };

  const handleAiSearchSubmit = (query: string) => {
    setActiveAiQuery(query);
    setActiveTab('ai-search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestToBuy = (listing: MaterialListing, desiredQuantity?: number) => {
    setSelectedListing(listing);
    setSelectedDesiredQuantity(desiredQuantity);
  };

  const handleSellMaterialsClick = () => {
    if (user) {
      setEditingListing(null);
      setCreateListingOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  const handleTrackOrdersClick = () => {
    setActiveTab('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Primary Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenSignup={() => {
          setSignupInitialRole('BUYER');
          setSignupOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        
        {/* VIEW: HOME */}
        {activeTab === 'home' && (
          <main>
            {/* Hero Section */}
            <Hero
              onExploreMarketplace={() => {
                const el = document.getElementById('marketplace');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('marketplace');
                }
              }}
              onOpenAiSearch={() => {
                setActiveTab('ai-search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectMaterial={handleSelectMaterialById}
            />

            {/* Quick Actions (4 cards: Find Materials, Sell Materials, AI Search, Track Orders) */}
            <QuickActions
              onFindMaterials={() => setActiveTab('marketplace')}
              onSellMaterials={handleSellMaterialsClick}
              onAiSearch={() => {
                setActiveTab('ai-search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onTrackOrders={handleTrackOrdersClick}
            />

            {/* Marketplace Preview Section */}
            <MarketplacePreview
              listings={allListings}
              onSelectListing={(item) => {
                setSelectedListing(item);
                setSelectedDesiredQuantity(undefined);
              }}
              onRequestToBuy={(item) => handleRequestToBuy(item)}
              onOpenCreateListing={() => {
                if (user) {
                  setEditingListing(null);
                  setCreateListingOpen(true);
                } else {
                  setLoginOpen(true);
                }
              }}
              canCreateListing={true}
              activeSearchQuery={activeAiQuery}
              onResetSearch={() => setActiveAiQuery('')}
            />

            {/* AI Search Section Embed in Home */}
            <AiSearchSection
              onSearchSubmit={handleAiSearchSubmit}
              onOpenDetailedSearch={() => {
                setActiveTab('ai-search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* How It Works */}
            <HowItWorks />

            {/* ChainCraft Trust & Verification Preview */}
            <ChainCraftTrust />
          </main>
        )}

        {/* VIEW: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <main className="py-2">
            <MarketplacePreview
              listings={allListings}
              onSelectListing={(item) => {
                setSelectedListing(item);
                setSelectedDesiredQuantity(undefined);
              }}
              onRequestToBuy={(item) => handleRequestToBuy(item)}
              onOpenCreateListing={() => {
                if (user) {
                  setEditingListing(null);
                  setCreateListingOpen(true);
                } else {
                  setLoginOpen(true);
                }
              }}
              canCreateListing={true}
              activeSearchQuery={activeAiQuery}
              onResetSearch={() => setActiveAiQuery('')}
            />
          </main>
        )}

        {/* VIEW: DEDICATED AI SEARCH PAGE (Requirement 1 - 21) */}
        {activeTab === 'ai-search' && (
          <main>
            <AiSearchPage
              listings={allListings}
              onSelectListing={(item) => {
                setSelectedListing(item);
                setSelectedDesiredQuantity(undefined);
              }}
              onRequestToBuy={(item, desiredQty) => handleRequestToBuy(item, desiredQty)}
              initialQuery={activeAiQuery}
            />
          </main>
        )}

        {/* VIEW: HOW IT WORKS */}
        {activeTab === 'how-it-works' && (
          <main className="space-y-4">
            <HowItWorks />
            <ChainCraftTrust />
            <QuickActions
              onFindMaterials={() => setActiveTab('marketplace')}
              onSellMaterials={handleSellMaterialsClick}
              onAiSearch={() => {
                setActiveTab('ai-search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onTrackOrders={handleTrackOrdersClick}
            />
          </main>
        )}

        {/* VIEW: DASHBOARD & PROFILE */}
        {(activeTab === 'dashboard' || activeTab === 'profile') && (
          <main>
            {user ? (
              <Dashboard
                onNavigateMarketplace={() => setActiveTab('marketplace')}
                onNavigateAiSearch={() => {
                  setActiveTab('ai-search');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenCreateListing={() => {
                  setEditingListing(null);
                  setCreateListingOpen(true);
                }}
                onEditListing={(item) => {
                  setEditingListing(item);
                  setCreateListingOpen(true);
                }}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 font-bold">
                  🔐
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Sign In Required</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Please sign in to your WORTHX account to access your live dashboard, manage listings, and view orders.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs cursor-pointer"
                  >
                    Login to Account
                  </button>
                  <button
                    onClick={() => setSignupOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* VIEW: ORDERS & TRACKING (Requirement 8 & 9) */}
        {activeTab === 'orders' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {user ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
                <OrdersManager
                  onExploreMarketplace={() => {
                    setActiveTab('marketplace');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  defaultTab={profile?.role === 'SELLER' ? 'seller' : 'buyer'}
                />
              </div>
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 font-bold">
                  📦
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Sign In to Track Orders</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Please sign in to view your real-time procurement milestones, seller confirmations, and shipment statuses.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs cursor-pointer"
                  >
                    Login to Account
                  </button>
                  <button
                    onClick={() => {
                      setSignupInitialRole('BUYER');
                      setSignupOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

      </div>

      {/* Global Minimal Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenSignup={() => {
          setSignupInitialRole('SELLER');
          setSignupOpen(true);
        }}
      />

      {/* Modal Dialogs */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onOpenSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
        onOpenForgotPassword={() => {
          setLoginOpen(false);
          setForgotPasswordOpen(true);
        }}
        onLoginSuccess={(role) => {
          if (role === 'SELLER') {
            setActiveTab('dashboard');
          } else {
            setActiveTab('marketplace');
          }
        }}
      />

      <SignupModal
        isOpen={signupOpen}
        onClose={() => setSignupOpen(false)}
        onOpenLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
        onSignupSuccess={(role) => {
          if (role === 'SELLER') {
            setActiveTab('dashboard');
          } else {
            setActiveTab('marketplace');
          }
        }}
        initialRole={signupInitialRole}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onBackToLogin={() => {
          setForgotPasswordOpen(false);
          setLoginOpen(true);
        }}
      />

      <MaterialDetailModal
        listing={selectedListing}
        initialDesiredQuantity={selectedDesiredQuantity}
        onClose={() => {
          setSelectedListing(null);
          setSelectedDesiredQuantity(undefined);
        }}
        onOpenSignup={() => {
          setSelectedListing(null);
          setSignupInitialRole('BUYER');
          setSignupOpen(true);
        }}
      />

      <CreateListingModal
        isOpen={createListingOpen}
        onClose={() => {
          setCreateListingOpen(false);
          setEditingListing(null);
        }}
        onListingCreated={handleListingCreated}
        initialListing={editingListing}
      />

      {/* Procurement Cart Drawer */}
      <CartDrawer
        onOpenSignup={() => {
          setSignupInitialRole('BUYER');
          setSignupOpen(true);
        }}
      />

      {/* B2B Checkout Modal */}
      <CheckoutModal
        onOrderSuccess={(order) => {
          console.log('Order registered successfully:', order.orderId);
        }}
        onNavigateToOrders={() => {
          setActiveTab('orders');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLogin={() => setLoginOpen(true)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
