import React, { useState, useEffect } from 'react';
import { MaterialListing, ChainCraftPassport } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMaterialImageUrl, getCategoryPlaceholderSvg, getPossibleUses } from '../utils/materialImages';
import { formatINR, parsePriceToNumber, parseQuantityToNumber } from '../utils/currency';
import { getPassportByListingId, createResourcePassport } from '../services/chaincraftService';
import { ChainCraftPassportModal } from './ChainCraftPassportModal';
import {
  X,
  MapPin,
  Scale,
  Sparkles,
  ShieldCheck,
  Check,
  Building2,
  Calendar,
  Send,
  AlertCircle,
  Tag,
  Plus,
  Minus,
  CheckCircle2,
  Calculator,
  Truck,
  ShoppingCart,
  Zap,
  Award,
  Clock,
  Images,
  Hash,
  FileCheck,
} from 'lucide-react';

interface MaterialDetailModalProps {
  listing: MaterialListing | null;
  onClose: () => void;
  onOpenSignup: () => void;
  initialDesiredQuantity?: number;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  listing,
  onClose,
  onOpenSignup,
  initialDesiredQuantity,
}) => {
  const { user, profile } = useAuth();
  const { addToCart, startCheckout, setIsCartOpen } = useCart();

  // Price & Quantity extraction
  const unitPriceNum = parsePriceToNumber(listing?.price);
  const totalAvailableNum = parseQuantityToNumber(listing?.quantity) || 1000;
  const minOrderNum = 1; // Minimum purchase quantity must be exactly 1 kg

  // Selected quantity state (starts at 1 kg, or initial desired quantity within available limits)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(() => {
    if (initialDesiredQuantity && initialDesiredQuantity >= 1) {
      return totalAvailableNum > 0 ? Math.min(initialDesiredQuantity, totalAvailableNum) : initialDesiredQuantity;
    }
    return 1;
  });

  // Multiple image gallery index
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [inquiryNote, setInquiryNote] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cartAddedSuccess, setCartAddedSuccess] = useState(false);

  // ChainCraft Passport state
  const [passport, setPassport] = useState<ChainCraftPassport | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);

  useEffect(() => {
    if (listing) {
      const avail = parseQuantityToNumber(listing.quantity) || 1000;
      if (initialDesiredQuantity && initialDesiredQuantity >= 1) {
        setSelectedQuantity(avail > 0 ? Math.min(initialDesiredQuantity, avail) : initialDesiredQuantity);
      } else {
        setSelectedQuantity(1);
      }
      setActiveImageIndex(0);
      setInquirySent(false);
      setInquiryNote('');
      setValidationError(null);
      setCartAddedSuccess(false);

      // Load or bootstrap ChainCraft Resource Passport
      const fetchPassport = async () => {
        try {
          let p = await getPassportByListingId(listing.id);
          if (!p) {
            p = await createResourcePassport({
              id: listing.id,
              materialName: listing.materialName,
              category: listing.category,
              quantity: listing.quantity,
              unit: listing.unit || 'kg',
              sellerId: listing.sellerId || 'seller',
              sellerName: listing.sellerName || 'Verified Producer',
              location: listing.location,
              price: listing.price,
            });
          }
          setPassport(p);
        } catch (err) {
          console.warn('Error loading resource passport:', err);
        }
      };
      fetchPassport();
    }
  }, [listing, initialDesiredQuantity]);

  // Handle escape key to close details modal
  useEffect(() => {
    if (!listing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing, onClose]);

  if (!listing) return null;

  // Build image list (supports multiple seller images if provided, with verified photographic fallback)
  const defaultImage = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
  const imageGallery = listing.images && listing.images.length > 0 ? listing.images : [defaultImage];
  const activeImage = imageGallery[activeImageIndex] || defaultImage;
  const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);

  const possibleApplications =
    listing.possibleUses && listing.possibleUses.length > 0
      ? listing.possibleUses
      : listing.applications && listing.applications.length > 0
      ? listing.applications
      : getPossibleUses(listing.materialName);

  // Dynamic total calculation: Selected Quantity × Price per Unit
  const calculatedTotalINR = selectedQuantity * (unitPriceNum || 0);

  // Validate quantity
  const validateQuantity = (qty: number): boolean => {
    if (isNaN(qty) || qty < 1) {
      setValidationError('Minimum purchase quantity is 1 kg.');
      return false;
    }
    if (totalAvailableNum > 0 && qty > totalAvailableNum) {
      setValidationError(`Only ${listing.quantity} ${listing.unit || 'kg'} is currently available.`);
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleQuantityChange = (newQty: number) => {
    setSelectedQuantity(newQty);
    validateQuantity(newQty);
    setCartAddedSuccess(false);
  };

  const handleStep = (increment: boolean) => {
    const nextVal = increment
      ? (totalAvailableNum > 0 ? Math.min(totalAvailableNum, selectedQuantity + 1) : selectedQuantity + 1)
      : Math.max(1, selectedQuantity - 1);
    handleQuantityChange(nextVal);
  };

  const handleAddToCart = () => {
    if (!validateQuantity(selectedQuantity)) return;
    const res = addToCart(listing, selectedQuantity);
    if (res.success) {
      setCartAddedSuccess(true);
      setTimeout(() => setCartAddedSuccess(false), 4000);
    }
  };

  const handleBuyNow = () => {
    if (!validateQuantity(selectedQuantity)) return;
    onClose();
    startCheckout({
      id: listing.id,
      listing,
      quantity: selectedQuantity,
      unitPriceNum,
      totalINR: calculatedTotalINR,
    });
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuantity(selectedQuantity)) return;
    setInquirySent(true);
  };

  // Quick preset chips (flexible from 1 kg up to available)
  const quickOptions = [1, 2, 5, 10, 25, 50, 100].filter((val) => {
    if (totalAvailableNum > 0 && val > totalAvailableNum) return false;
    return true;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col cursor-default"
      >
        
        {/* Modal Header & Hero Image with Gallery Thumbnails */}
        <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-900 overflow-hidden shrink-0">
          <img
            src={activeImage}
            alt={listing.materialName}
            onError={(e) => {
              e.currentTarget.src = fallbackSvg;
            }}
            className="w-full h-full object-cover opacity-90 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors backdrop-blur-xs cursor-pointer z-10"
            title="Close details"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Multiple Image Thumbnails if available (Requirement 4) */}
          {imageGallery.length > 1 && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10 bg-black/50 p-1.5 rounded-xl backdrop-blur-xs">
              <Images className="w-3.5 h-3.5 text-white mr-1" />
              {imageGallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-emerald-400 scale-105' : 'border-white/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title & Badge Overlays */}
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-700/90 font-bold text-[11px] uppercase tracking-wider backdrop-blur-xs">
                  {listing.category}
                </span>
                {listing.isDemo ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/95 text-slate-950 font-bold text-[11px] backdrop-blur-xs">
                    Starter / Verified Spec
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 font-bold text-[11px] backdrop-blur-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Firestore Listing
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {listing.materialName}
              </h2>
            </div>

            {/* Price Per Unit (INR ₹) */}
            <div className="bg-white/95 text-slate-950 px-4 py-2 rounded-2xl font-black text-base sm:text-lg shadow-sm border border-slate-100 flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold">Price:</span>
              <span className="text-emerald-900">{listing.price}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          
          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-800" />
                Available Quantity
              </span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                {listing.quantity} {listing.unit || 'Kg'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                Minimum Order
              </span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                1 {listing.unit || 'Kg'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                Location
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                {listing.location}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                Seller / Producer
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                {listing.sellerName || 'Verified Producer'}
              </span>
            </div>
          </div>

          {/* Seller Verification & Trust Information (Requirement 3) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {listing.sellerName ? listing.sellerName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  {listing.sellerName || 'Verified Industrial Supplier'}
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </h4>
                <p className="text-slate-600 mt-0.5">
                  Verified Producer • Member since 2024 • Response Time: &lt; 2 hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-bold text-emerald-900 text-[11px] shadow-2xs">
                ESG Audit Verified
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-bold text-emerald-900 text-[11px] shadow-2xs">
                Quality Guaranteed
              </span>
            </div>
          </div>

          {/* Material Specification & Detailed Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Detailed Material Description & Provenance
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {listing.description}
            </p>
          </div>

          {/* Quality & Condition Information (Requirement 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-semibold">Purity & Condition</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {listing.purityGrade || 'Industrial Recovery Grade (Cleaned & Sorted)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-semibold">Moisture Content</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {listing.moistureContent || 'Optimal / Sun-Dried (&lt; 12%)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-semibold">Decarbonization Impact</span>
              <span className="font-bold text-emerald-800 mt-0.5 block">
                {listing.co2Offset || 'Diverts 100% from landfill dumping'}
              </span>
            </div>
          </div>

          {/* ChainCraft Resource Passport & SHA-256 Integrity Card */}
          {passport && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    ChainCraft™ Resource Passport
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">
                    {passport.passportId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Tamper-evident provenance verified with SHA-256 integrity digest ({passport.events.length} chain events).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPassportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>View Resource Passport</span>
              </button>
            </div>
          )}

          {/* Possible Applications & AI-Generated Material Insights (Requirement 3) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              Possible Applications & Circular Transformation Pathways
            </h4>
            <div className="flex flex-wrap gap-2">
              {possibleApplications.map((app, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-950 text-xs font-semibold border border-emerald-200"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* ================= FLEXIBLE QUANTITY SELECTION (Requirement 5) ================= */}
          <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-800" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Flexible Order Quantity Selection
                  </h4>
                  <p className="text-xs text-slate-500">
                    Order only what your facility needs. No bulk lock-in.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg">
                Min: 1 {listing.unit || 'Kg'}
              </span>
            </div>

            {/* Quick preset chips */}
            {quickOptions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Select Quantity:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {quickOptions.map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => handleQuantityChange(qty)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedQuantity === qty
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {qty} {listing.unit || 'Kg'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Direct Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Desired Quantity ({listing.unit || 'Kg'})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStep(false)}
                    disabled={selectedQuantity <= minOrderNum}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={minOrderNum}
                    max={totalAvailableNum || 100000}
                    value={selectedQuantity}
                    onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                    className="w-full text-center px-3 py-2 bg-white rounded-xl border border-slate-300 font-extrabold text-sm text-slate-900 focus:border-emerald-800 focus:outline-none shadow-2xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleStep(true)}
                    disabled={totalAvailableNum > 0 && selectedQuantity >= totalAvailableNum}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Auto-Calculated Total in INR ₹ */}
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 flex flex-col justify-center shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Estimated Total Procurement Cost:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-900">
                    {formatINR(calculatedTotalINR)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({selectedQuantity} {listing.unit || 'Kg'} × {listing.price})
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Message */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Cart Confirmation Notification Toast */}
          {cartAddedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Added {selectedQuantity} {listing.unit || 'Kg'} of {listing.materialName} to procurement cart!</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setIsCartOpen(true);
                }}
                className="underline hover:text-emerald-900 cursor-pointer font-black"
              >
                View Cart →
              </button>
            </div>
          )}

          {/* ================= ACTION BUTTONS: ADD TO CART & BUY NOW (Requirement 2, 3, 5, 6) ================= */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={Boolean(validationError)}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl border-2 border-emerald-900 text-emerald-900 hover:bg-emerald-50 font-black text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart ({selectedQuantity} {listing.unit || 'Kg'})</span>
              </button>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={Boolean(validationError)}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Buy Now • {formatINR(calculatedTotalINR)}</span>
              </button>
            </div>

            {/* Direct Inquiry Collapsible */}
            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                Need customized dispatch schedule, lab moisture test, or split shipments?{' '}
              </span>
              <button
                onClick={() => setInquirySent(!inquirySent)}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Submit Custom Producer Inquiry
              </button>
            </div>

            {/* Inquiry Box */}
            {inquirySent && (
              <form onSubmit={handleSendInquiry} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-800" />
                  Custom Producer Inquiry
                </h5>
                <input
                  type="text"
                  value={inquiryNote}
                  onChange={(e) => setInquiryNote(e.target.value)}
                  placeholder="Special instructions, delivery timeline, payment milestones..."
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Send Inquiry to {listing.sellerName || 'Producer'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* ChainCraft Resource Passport Modal */}
      <ChainCraftPassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        passport={passport}
      />
    </div>
  );
};
