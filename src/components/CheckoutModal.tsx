import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createFirestoreOrder, recordDemoPayment } from '../services/orderService';
import { formatINR } from '../utils/currency';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../utils/materialImages';
import { Order } from '../types';
import { OrderDeliveryAnimation } from './OrderDeliveryAnimation';
import { EnvironmentalImpactCard } from './EnvironmentalImpactCard';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Truck,
  MapPin,
  Building2,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  Package,
  Clock,
  Sparkles,
  CreditCard,
  Check,
  Smartphone,
  Landmark,
  Wallet,
  Loader2,
  Lock,
  Banknote,
} from 'lucide-react';

interface CheckoutModalProps {
  onOrderSuccess: (order: Order) => void;
  onNavigateToOrders: () => void;
  onOpenLogin: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  onOrderSuccess,
  onNavigateToOrders,
  onOpenLogin,
}) => {
  const { isCheckoutOpen, setIsCheckoutOpen, checkoutItems, clearCart } = useCart();
  const { user, profile } = useAuth();

  // Step state: 'DETAILS' -> 'PAYMENT' -> 'CONFIRMED' (via confirmedOrder)
  const [checkoutStep, setCheckoutStep] = useState<'DETAILS' | 'PAYMENT'>('DETAILS');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Net Banking' | 'Wallet' | 'Cash on Delivery (COD)'>('UPI');
  const [paymentProcessingState, setPaymentProcessingState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  // Form State
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState(profile?.location?.split(',')[0]?.trim() || 'Chennai');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600001');
  const [contactName, setContactName] = useState(profile?.fullName || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '+91 98765 43210');
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [notes, setNotes] = useState('');

  // Process State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showDeliveryAnimation, setShowDeliveryAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const items = checkoutItems.length > 0 ? checkoutItems : [];
  const primaryItem = items[0];

  const totalAmount = items.reduce((sum, item) => sum + item.totalINR, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const primaryUnit = primaryItem?.listing.unit || 'kg';

  const validateDetails = (): boolean => {
    if (!user) {
      setIsCheckoutOpen(false);
      onOpenLogin();
      return false;
    }

    if (items.length === 0) {
      setErrorMessage('No items in checkout.');
      return false;
    }

    // Validate quantity for every checkout item before placing order
    for (const item of items) {
      const avail = parseFloat(item.listing.quantity.replace(/,/g, '')) || 1000;
      if (item.quantity < 1) {
        setErrorMessage('Minimum purchase quantity is 1 kg.');
        return false;
      }
      if (item.quantity > avail) {
        setErrorMessage(`Only ${item.listing.quantity} ${item.listing.unit || 'kg'} is currently available.`);
        return false;
      }
    }

    if (!streetAddress.trim() || !city.trim() || !contactName.trim() || !contactPhone.trim()) {
      setErrorMessage('Please provide complete delivery and contact information.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDetails()) {
      setCheckoutStep('PAYMENT');
    }
  };

  const handleExecuteDemoPayment = async () => {
    if (!validateDetails()) return;

    setIsSubmitting(true);
    const isCOD = selectedPaymentMethod === 'Cash on Delivery (COD)';
    const paymentId = isCOD ? `COD-${Date.now()}` : `PAY-DEMO-${Date.now()}`;
    const paymentStatus = isCOD ? 'PENDING_COD' : 'SUCCESS';

    if (!isCOD) {
      setPaymentProcessingState('PROCESSING');
    }
    setErrorMessage(null);

    const fullDeliveryLocation = `${streetAddress.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode.trim()}`;

    try {
      // 1. Create single order with appropriate status initially
      const newOrder = await createFirestoreOrder({
        listingId: primaryItem?.listing.id,
        buyerId: user!.uid,
        buyerName: contactName.trim() || profile?.fullName || user!.email?.split('@')[0] || 'Buyer',
        buyerEmail: user!.email || undefined,
        buyerPhone: contactPhone.trim(),
        sellerId: primaryItem?.listing.sellerId || 'verified-producer',
        sellerName: primaryItem?.listing.sellerName || 'Verified Producer',
        materialName: items.length === 1 ? primaryItem.listing.materialName : `${primaryItem.listing.materialName} + ${items.length - 1} more items`,
        category: primaryItem?.listing.category || 'Agro & Organic',
        quantity: totalQuantity,
        unit: primaryUnit,
        pricePerUnit: primaryItem?.listing.price || `₹${primaryItem.unitPriceNum}/${primaryUnit}`,
        pricePerUnitNumber: primaryItem?.unitPriceNum || 0,
        totalAmountINR: totalAmount,
        status: 'Order Placed',
        paymentStatus: isCOD ? 'PENDING_COD' : 'PENDING',
        paymentMethod: selectedPaymentMethod,
        paymentAmount: totalAmount,
        transactionId: paymentId,
        deliveryLocation: fullDeliveryLocation,
        shippingAddress: {
          street: streetAddress.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          notes: notes.trim() || undefined,
        },
        notes: notes.trim(),
        items: items.map((i) => ({
          listingId: i.listing.id,
          materialName: i.listing.materialName,
          category: i.listing.category,
          quantity: i.quantity,
          unit: i.listing.unit || 'kg',
          pricePerUnit: i.listing.price,
          pricePerUnitNumber: i.unitPriceNum,
          totalAmountINR: i.totalINR,
          sellerId: i.listing.sellerId || 'seller',
          sellerName: i.listing.sellerName || 'Verified Seller',
          imageUrl: i.listing.imageUrl,
        })),
        materialImage: primaryItem?.listing.imageUrl,
      });

      if (!isCOD) {
        // 2. Realistic processing delay for demo visualization
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // 3. Record payment against the existing order in Supabase & local cache
      const now = new Date().toISOString();
      await recordDemoPayment({
        order_id: newOrder.orderId,
        payment_id: paymentId,
        payment_method: selectedPaymentMethod,
        amount: totalAmount,
        payment_status: paymentStatus,
        created_at: now,
        updated_at: now,
      });

      newOrder.paymentStatus = paymentStatus;

      if (!isCOD) {
        // 4. Show success state briefly before moving to confirmation
        setPaymentProcessingState('SUCCESS');
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 5. Clear cart and set confirmed order with delivery animation
      clearCart();
      setConfirmedOrder(newOrder);
      setShowDeliveryAnimation(true);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      console.error('Error completing demo payment:', err);
      setPaymentProcessingState('IDLE');
      setErrorMessage('Failed to process payment. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setShowDeliveryAnimation(false);
    setCheckoutStep('DETAILS');
    setPaymentProcessingState('IDLE');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-950">
                {confirmedOrder && showDeliveryAnimation
                  ? 'Dispatching Order...'
                  : confirmedOrder
                  ? 'Order Confirmed'
                  : checkoutStep === 'PAYMENT'
                  ? 'Demo Payment'
                  : 'B2B Procurement Checkout'}
              </h3>
              <p className="text-xs text-slate-500">
                {confirmedOrder && showDeliveryAnimation
                  ? 'Hand-delivering your circular material order'
                  : confirmedOrder
                  ? 'Your order has been officially placed on WORTHX'
                  : checkoutStep === 'PAYMENT'
                  ? 'Select demo payment method (No real money charged)'
                  : 'Review order specifications & delivery destination'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">

          {/* ================= ORDER SUCCESS DELIVERY ANIMATION (Feature 1) ================= */}
          {confirmedOrder && showDeliveryAnimation ? (
            <OrderDeliveryAnimation
              orderId={confirmedOrder.orderId}
              materialName={confirmedOrder.materialName}
              quantity={confirmedOrder.quantity}
              unit={confirmedOrder.unit}
              onComplete={() => setShowDeliveryAnimation(false)}
            />
          ) : confirmedOrder ? (
            /* ================= ORDER CONFIRMATION SCREEN (Requirement 7) ================= */
            <div className="space-y-6 py-2">
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black text-emerald-950">
                  Order Successfully Placed!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                  A digital procurement agreement has been dispatched to the seller. You can monitor the real-time status as the seller confirms and processes your dispatch.
                </p>
              </div>

              {/* === ENVIRONMENTAL IMPACT CARD (Feature 2) === */}
              <EnvironmentalImpactCard
                materialName={confirmedOrder.materialName}
                category={confirmedOrder.category}
                quantity={confirmedOrder.quantity}
                unit={confirmedOrder.unit}
                orderId={confirmedOrder.orderId}
              />

              {/* Order Confirmation Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Official Order ID:
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {confirmedOrder.orderId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Material Product</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                      {confirmedOrder.materialName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Quantity</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {confirmedOrder.quantity} {confirmedOrder.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Total Amount</span>
                    <span className="font-extrabold text-emerald-900 text-sm mt-0.5 block">
                      {formatINR(confirmedOrder.totalAmountINR)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Seller</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {confirmedOrder.sellerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Buyer</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {confirmedOrder.buyerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Order Status</span>
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-950 bg-emerald-100/90 px-2.5 py-1 rounded-md mt-0.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      {confirmedOrder.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Digital Agreement</span>
                    <span className="font-mono text-emerald-900 font-bold block mt-0.5 truncate">
                      {confirmedOrder.agreementId || 'WX-AGR-VERIFIED'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">ChainCraft Protocol</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px] mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      SHA-256 Stamped
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-700">Delivery Destination: </span>
                    {confirmedOrder.deliveryLocation}
                  </div>
                  {confirmedOrder.latestHash && (
                    <div className="font-mono text-[10px] text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Digest: #{confirmedOrder.latestHash.slice(0, 12)}...
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToOrders();
                  }}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-300" />
                  <span>Track Order in My Orders</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Continue Sourcing
                </button>
              </div>
            </div>
          ) : checkoutStep !== 'PAYMENT' ? (
            /* ================= CHECKOUT INPUT FORM ================= */
            <form onSubmit={handleProceedToPayment} className="space-y-6">

              {/* Items Summary Table */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-800" />
                  Selected Material Feedstocks ({items.length})
                </h4>

                <div className="space-y-2">
                  {items.map((item) => {
                    const listing = item.listing;
                    const displayImg = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
                    const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);

                    return (
                      <div
                        key={item.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={displayImg}
                            alt={listing.materialName}
                            onError={(e) => {
                              e.currentTarget.src = fallbackSvg;
                            }}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-slate-900 truncate">
                              {listing.materialName}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                              Seller: {listing.sellerName || 'Verified Producer'} • {listing.location}
                            </p>
                            <span className="text-[11px] text-slate-600 font-medium">
                              Rate: {listing.price}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800 block">
                            {item.quantity} {listing.unit || 'kg'}
                          </span>
                          <span className="font-black text-emerald-900 block text-sm">
                            {formatINR(item.totalINR)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Total Quantity:</span>
                  <span className="text-slate-900 font-extrabold">{totalQuantity} {primaryUnit}</span>
                </div>
              </div>

              {/* Delivery / Location Information Form (Requirement 6) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  Delivery & Logistics Destination
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Facility / Delivery Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Plot No. 42, SIPCOT Industrial Park, Oragadam"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      City / District *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 600001"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Company / Organization (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. BioTex Circular Ltd"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 Phone Number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Dispatch Notes / Special Unloading Instructions
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Forklift required, batch test certificate on arrival, GST number..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* B2B Payment & Settlement Mode (Safe Mock State) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span className="text-xs font-bold text-slate-900">
                      Settlement Mode: B2B Escrow Covenant
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Safe Demo Settlement
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  No direct credit card charge is required at this stage. Orders create an official digital supply covenant recorded on the platform with settlement upon delivery verification.
                </p>
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Procurement Subtotal ({totalQuantity} {primaryUnit}):</span>
                  <span className="font-bold text-slate-900">{formatINR(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Logistics & Freight:</span>
                  <span className="text-emerald-700 font-semibold">Included / Coordinated</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900">Total Order Value:</span>
                  <span className="font-black text-emerald-950 text-xl">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Demo Payment • {formatINR(totalAmount)}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              </div>

            </form>
          ) : (
            /* ================= DEMO PAYMENT SCREEN (Requirement 5) ================= */
            <div className="space-y-6 py-1">
              
              {/* Prominent Demo Notice Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                      DEMO PAYMENT
                    </span>
                    <span className="text-xs font-semibold text-amber-900">
                      Hackathon Demonstration
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mt-1">
                    No real money will be charged. This simulates an instant digital B2B transaction recorded on Supabase and ChainCraft.
                  </p>
                </div>
              </div>

              {/* Order Value Display */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                    Total Payable Amount
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-0.5">
                    {formatINR(totalAmount)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    For {items.length} material lot{items.length > 1 ? 's' : ''} ({totalQuantity} {primaryUnit})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Deliver to:</span>
                  <span className="text-xs font-bold text-slate-200 block max-w-[180px] truncate">
                    {city}, {stateName}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Select Demo Payment Method
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* UPI Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('UPI')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedPaymentMethod === 'UPI'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'UPI' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      {selectedPaymentMethod === 'UPI' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-950">UPI</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Google Pay, PhonePe, Paytm, BHIM UPI
                      </p>
                    </div>
                  </button>

                  {/* Net Banking Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Net Banking')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedPaymentMethod === 'Net Banking'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'Net Banking' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Landmark className="w-5 h-5" />
                      </div>
                      {selectedPaymentMethod === 'Net Banking' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-950">Net Banking</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        HDFC, ICICI, SBI, Axis, Kotak
                      </p>
                    </div>
                  </button>

                  {/* Wallet Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Wallet')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedPaymentMethod === 'Wallet'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'Wallet' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      {selectedPaymentMethod === 'Wallet' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-950">Wallet</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Paytm Wallet, Amazon Pay
                      </p>
                    </div>
                  </button>

                  {/* Cash on Delivery (COD) Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Cash on Delivery (COD)')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedPaymentMethod === 'Cash on Delivery (COD)'
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'Cash on Delivery (COD)' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      {selectedPaymentMethod === 'Cash on Delivery (COD)' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-950">Cash on Delivery</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Pay upon material arrival & inspection
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Processing & Feedback State */}
              {paymentProcessingState === 'PROCESSING' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
                  <span className="text-xs font-bold text-emerald-950">
                    PROCESSING DEMO PAYMENT... Recording secure transaction covenant
                  </span>
                </div>
              )}

              {paymentProcessingState === 'SUCCESS' && (
                <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs font-black text-emerald-950">
                    DEMO PAYMENT SUCCESSFUL!
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setCheckoutStep('DETAILS')}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Delivery</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteDemoPayment}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paymentProcessingState === 'PROCESSING' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : paymentProcessingState === 'SUCCESS' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Demo Payment Successful</span>
                    </>
                  ) : selectedPaymentMethod === 'Cash on Delivery (COD)' ? (
                    <>
                      <span>Confirm Order (COD) • {formatINR(totalAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </>
                  ) : (
                    <>
                      <span>Pay {formatINR(totalAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
