import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, ChainCraftPassport, DigitalAgreement } from '../types';
import { getBuyerOrders, getSellerOrders, updateOrderStatus } from '../services/orderService';
import { getPassportByOrderId, getAgreementByOrderId } from '../services/chaincraftService';
import { formatINR } from '../utils/currency';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../utils/materialImages';
import { ChainCraftPassportModal } from './ChainCraftPassportModal';
import {
  Package,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  Eye,
  Filter,
  ShieldCheck,
  Hash,
  FileCheck,
  Search,
  Check,
  X,
  CreditCard,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface OrdersManagerProps {
  onExploreMarketplace?: () => void;
  defaultTab?: 'buyer' | 'seller';
}

type OrderFilterTab = 'All' | 'Active' | 'Delivered' | 'Cancelled';

// Helper for visually clear status labels (Requirement 4)
const getStatusBadgeInfo = (status: OrderStatus) => {
  switch (status) {
    case 'Order Placed':
    case 'REQUESTED':
      return {
        label: 'Order Placed',
        badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        dotColor: 'bg-sky-500',
        icon: Clock,
      };
    case 'Seller Confirmed':
    case 'ACCEPTED':
    case 'Processing':
      return {
        label: 'Confirmed',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
        icon: CheckCircle2,
      };
    case 'Shipped':
      return {
        label: 'Shipped',
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dotColor: 'bg-indigo-500',
        icon: Truck,
      };
    case 'Out for Delivery':
      return {
        label: 'Out for Delivery',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        icon: MapPin,
      };
    case 'Delivered':
    case 'Completed':
      return {
        label: 'Delivered',
        badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold',
        dotColor: 'bg-emerald-600',
        icon: Check,
      };
    case 'Cancelled':
      return {
        label: 'Cancelled',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
        icon: X,
      };
    default:
      return {
        label: status || 'Order Placed',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        dotColor: 'bg-slate-500',
        icon: Clock,
      };
  }
};

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  onExploreMarketplace,
  defaultTab = 'buyer',
}) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>(
    profile?.role === 'SELLER' ? 'seller' : defaultTab
  );

  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Separate panel states for Meesho-like Track Order and View Details buttons (Requirement 6)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal for ChainCraft Passport
  const [selectedPassport, setSelectedPassport] = useState<ChainCraftPassport | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<DigitalAgreement | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [buyerList, sellerList] = await Promise.all([
        getBuyerOrders(user.uid),
        getSellerOrders(user.uid),
      ]);
      setBuyerOrders(buyerList);
      setSellerOrders(sellerList);
    } catch (err) {
      console.warn('Could not load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleOpenPassport = async (order: Order) => {
    const p = await getPassportByOrderId(order.orderId);
    const a = await getAgreementByOrderId(order.orderId);
    let agreementObj = a || order.agreement || null;
    if (agreementObj) {
      agreementObj = {
        ...agreementObj,
        paymentMethod: agreementObj.paymentMethod || order.paymentMethod || 'UPI',
        createdAt: agreementObj.createdAt || order.createdAt,
      };
    }
    if (p) {
      setSelectedPassport(p);
      setSelectedAgreement(agreementObj);
      setIsPassportModalOpen(true);
    } else {
      // Create minimal passport structure for display
      const fallbackPassport: ChainCraftPassport = {
        id: order.passportId || `pass-${order.orderId}`,
        passportId: order.passportId || `WX-PASSPORT-${order.orderId.replace(/[^0-9]/g, '') || '918273'}`,
        listingId: order.listingId || 'resource',
        materialName: order.materialName,
        category: order.category,
        quantity: `${order.quantity}`,
        unit: order.unit,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        orderId: order.orderId,
        agreementId: order.agreementId,
        verificationStatus: 'ChainCraft Verified',
        lifecycleStatus: (order.lifecycleStatus as any) || 'ORDER_CREATED',
        genesisHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        latestHash: order.latestHash || '0x42afa063e68e4b309c9cec5c608e5451e39a7b9c',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        events: (order.statusTimeline || []).map((t, idx) => ({
          id: `ev-${idx}`,
          eventId: `EV-${idx + 1}`,
          passportId: order.passportId || 'passport',
          orderId: order.orderId,
          eventName: (t.status === 'Completed'
            ? 'COMPLETED'
            : t.status === 'Delivered'
            ? 'RECEIVED'
            : t.status === 'Shipped'
            ? 'DISPATCHED'
            : t.status === 'Processing'
            ? 'PREPARING'
            : t.status === 'Seller Confirmed'
            ? 'ORDER_ACCEPTED'
            : 'ORDER_CREATED') as any,
          statusLabel: t.status,
          timestamp: t.timestamp,
          actor: t.updatedBy,
          actorRole: t.updaterRole || 'SELLER',
          details: t.note || `Status: ${t.status}`,
          payload: { orderId: order.orderId, status: t.status },
          hash: t.hash || order.latestHash || '0x42afa063e68e4b309c9cec5c608e5451e39a7b9c',
          previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        })),
      };
      setSelectedPassport(fallbackPassport);
      setSelectedAgreement(agreementObj);
      setIsPassportModalOpen(true);
    }
  };

  const handleUpdateStatus = async (order: Order, nextStatus: OrderStatus) => {
    setStatusUpdatingId(order.id);
    const updaterName = profile?.fullName || (activeTab === 'seller' ? 'Seller' : 'Buyer');
    const updaterRole = activeTab === 'seller' ? 'SELLER' : 'BUYER';

    try {
      const updated = await updateOrderStatus(
        order.id,
        nextStatus,
        `Status updated by ${updaterName} to ${nextStatus}`,
        updaterName,
        updaterRole
      );

      if (updated) {
        setSellerOrders((prev) =>
          prev.map((o) => (o.id === updated.id || o.orderId === updated.orderId ? updated : o))
        );
        setBuyerOrders((prev) =>
          prev.map((o) => (o.id === updated.id || o.orderId === updated.orderId ? updated : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getSellerNextStatuses = (currentStatus: OrderStatus): { label: string; status: OrderStatus }[] => {
    switch (currentStatus) {
      case 'Order Placed':
      case 'REQUESTED':
        return [
          { label: 'Accept Order', status: 'Seller Confirmed' },
          { label: 'Decline Order', status: 'Cancelled' },
        ];
      case 'Seller Confirmed':
      case 'ACCEPTED':
        return [
          { label: 'Prepare Material', status: 'Processing' },
          { label: 'Cancel Order', status: 'Cancelled' },
        ];
      case 'Processing':
        return [
          { label: 'Dispatch Consignment', status: 'Shipped' },
        ];
      case 'Shipped':
        return [
          { label: 'Mark Out for Delivery', status: 'Out for Delivery' },
        ];
      default:
        return [];
    }
  };

  const getBuyerNextStatuses = (currentStatus: OrderStatus): { label: string; status: OrderStatus }[] => {
    switch (currentStatus) {
      case 'Shipped':
      case 'Out for Delivery':
        return [
          { label: 'Confirm Material Received', status: 'Delivered' },
        ];
      case 'Delivered':
        return [
          { label: 'Complete & Verify Settlement', status: 'Completed' },
        ];
      default:
        return [];
    }
  };

  const currentList = activeTab === 'buyer' ? buyerOrders : sellerOrders;

  // Filter logic (Requirement 8: All, Active, Delivered, Cancelled)
  const isOrderActive = (status: OrderStatus): boolean => {
    return (
      status !== 'Delivered' &&
      status !== 'Completed' &&
      status !== 'Cancelled'
    );
  };

  const filteredByTab = currentList.filter((order) => {
    if (filterTab === 'Active') return isOrderActive(order.status);
    if (filterTab === 'Delivered') return order.status === 'Delivered' || order.status === 'Completed';
    if (filterTab === 'Cancelled') return order.status === 'Cancelled';
    return true; // 'All'
  });

  const finalFilteredList = filteredByTab.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.materialName.toLowerCase().includes(q) ||
      order.orderId.toLowerCase().includes(q) ||
      (order.sellerName && order.sellerName.toLowerCase().includes(q)) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(q)) ||
      (order.category && order.category.toLowerCase().includes(q))
    );
  });

  // Calculate count for each filter tab
  const counts = {
    All: currentList.length,
    Active: currentList.filter((o) => isOrderActive(o.status)).length,
    Delivered: currentList.filter((o) => o.status === 'Delivered' || o.status === 'Completed').length,
    Cancelled: currentList.filter((o) => o.status === 'Cancelled').length,
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard?.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatOrderDate = (timestamp: string): string => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDeliveryDateInfo = (order: Order) => {
    const created = new Date(order.createdAt);
    const isValid = !isNaN(created.getTime());

    if (order.status === 'Delivered' || order.status === 'Completed') {
      const deliveredItem = order.statusTimeline?.find(
        (t) => t.status === 'Delivered' || t.status === 'Completed'
      );
      if (deliveredItem) {
        const dDate = new Date(deliveredItem.timestamp);
        if (!isNaN(dDate.getTime())) {
          return {
            text: `Delivered on ${formatOrderDate(deliveredItem.timestamp)}`,
            isDelivered: true,
            isCancelled: false,
          };
        }
      }
      return {
        text: 'Delivered',
        isDelivered: true,
        isCancelled: false,
      };
    }

    if (order.status === 'Cancelled') {
      return {
        text: 'Order Cancelled',
        isDelivered: false,
        isCancelled: true,
      };
    }

    // Active order: expected 3-5 days from order creation
    const expDate = isValid
      ? new Date(created.getTime() + 4 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    return {
      text: `Expected by ${expDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`,
      isDelivered: false,
      isCancelled: false,
    };
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Switcher (My Purchases vs Received Orders) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-800" />
              {activeTab === 'buyer' ? 'My Orders' : 'Seller Orders'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'buyer'
                ? 'Track your material orders, live delivery progress, and digital agreements'
                : 'Manage incoming buyer purchase orders, dispatches, and verification milestones'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Tab Switcher: Buyer vs Seller */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/60">
              <button
                type="button"
                onClick={() => setActiveTab('buyer')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'buyer'
                    ? 'bg-white text-emerald-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Purchases ({buyerOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seller')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-white text-emerald-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Received Orders ({sellerOrders.length})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar inside Orders */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by material, order ID, or partner..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
            Showing <strong className="text-slate-800">{finalFilteredList.length}</strong> of{' '}
            <strong className="text-slate-800">{currentList.length}</strong> orders
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar (Requirement 8: All, Active, Delivered, Cancelled) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {(['All', 'Active', 'Delivered', 'Cancelled'] as OrderFilterTab[]).map((tab) => {
          const isSelected = filterTab === tab;
          const count = counts[tab];

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer border flex items-center gap-2 shadow-2xs ${
                isSelected
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-800 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading your orders & ChainCraft lifecycle...</p>
        </div>
      ) : finalFilteredList.length === 0 ? (
        /* Empty-State Message (Requirement 9) */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center max-w-lg mx-auto space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
            {activeTab === 'buyer' ? <ShoppingCart className="w-7 h-7" /> : <Package className="w-7 h-7" />}
          </div>
          <h4 className="text-base sm:text-lg font-black text-slate-900">
            {searchQuery
              ? 'No matching orders found'
              : filterTab === 'All'
              ? 'No orders placed yet'
              : `No ${filterTab.toLowerCase()} orders`}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different term.`
              : filterTab === 'Active'
              ? 'You have no active orders in progress. Any newly placed orders will appear here with live tracking.'
              : filterTab === 'Delivered'
              ? 'You have no delivered orders yet. Once a consignment reaches its destination, it will be listed here.'
              : filterTab === 'Cancelled'
              ? 'You have no cancelled orders.'
              : activeTab === 'buyer'
              ? 'Browse the marketplace or search for secondary raw materials like coconut shell, metal scrap, or paper waste to place your first order.'
              : 'You have not received any orders from industrial buyers yet. Ensure your seller listings are competitive and active.'}
          </p>
          {onExploreMarketplace && activeTab === 'buyer' && !searchQuery && (
            <button
              type="button"
              onClick={onExploreMarketplace}
              className="mt-3 px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-300" />
              <span>Explore Marketplace</span>
            </button>
          )}
        </div>
      ) : (
        /* Orders List — Neat individual cards (Requirements 1, 2, 3, 4, 6, 7, 10) */
        <div className="space-y-4">
          {finalFilteredList.map((order) => {
            const isTrackingOpen = trackingOrderId === order.id;
            const isDetailsOpen = detailsOrderId === order.id;

            const displayImg = getMaterialImageUrl(order.materialName, order.category, order.materialImage);
            const fallbackSvg = getCategoryPlaceholderSvg(order.materialName, order.category);
            const statusInfo = getStatusBadgeInfo(order.status);
            const deliveryInfo = getDeliveryDateInfo(order);

            const sellerActions = getSellerNextStatuses(order.status);
            const buyerActions = getBuyerNextStatuses(order.status);
            const isUpdating = statusUpdatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300/80 transition-all overflow-hidden"
              >
                {/* Card Top Strip: Placed Date & Status Label (Requirements 3 & 4) */}
                <div className="bg-slate-50/70 px-4 sm:px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">
                      Ordered on <strong className="text-slate-700">{formatOrderDate(order.createdAt)}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {order.orderId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyOrderId(order.orderId)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Copy Order ID"
                      >
                        {copiedId === order.orderId ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status Badge (Requirement 4) */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeColor}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Card Main Body: Image on Left, Details on Right (Requirement 2) */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                  {/* Left: Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 relative">
                    <img
                      src={displayImg}
                      alt={order.materialName}
                      onError={(e) => {
                        e.currentTarget.src = fallbackSvg;
                      }}
                      className="w-full h-full object-cover"
                    />
                    {order.category && (
                      <span className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-xs text-[9px] font-semibold text-white px-1 py-0.5 rounded text-center truncate">
                        {order.category}
                      </span>
                    )}
                  </div>

                  {/* Right: Product Name, Quantity, Price, Expected Delivery */}
                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h4 className="font-black text-base sm:text-lg text-slate-900 truncate">
                        {order.materialName}
                      </h4>
                      {/* Price (Requirement 2) */}
                      <span className="font-extrabold text-base sm:text-lg text-emerald-900 shrink-0">
                        {formatINR(order.totalAmountINR)}
                      </span>
                    </div>

                    {/* Quantity & Unit Pricing */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>
                        Quantity: <strong className="text-slate-900 font-bold">{order.quantity} {order.unit}</strong>
                      </span>
                      {order.pricePerUnit && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>
                            Rate: <span className="font-semibold text-slate-700">{order.pricePerUnit}</span>
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>
                        {activeTab === 'buyer' ? (
                          <>Seller: <strong className="text-slate-800">{order.sellerName}</strong></>
                        ) : (
                          <>Buyer: <strong className="text-slate-800">{order.buyerName}</strong></>
                        )}
                      </span>
                    </div>

                    {/* Expected Delivery Date Banner (Requirement 3) */}
                    <div className="pt-1">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          deliveryInfo.isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                            : deliveryInfo.isCancelled
                            ? 'bg-rose-50 text-rose-800 border border-rose-200/80'
                            : 'bg-slate-100 text-slate-800 border border-slate-200/80'
                        }`}
                      >
                        {deliveryInfo.isDelivered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : deliveryInfo.isCancelled ? (
                          <X className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-emerald-800" />
                        )}
                        <span>{deliveryInfo.text}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Requirement 6: Separate buttons for Track Order & View Details) */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    {/* ChainCraft Passport Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPassport(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-emerald-950 font-bold text-xs border border-slate-200 hover:border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Inspect ChainCraft Resource Passport & SHA-256 Digest"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">ChainCraft</span>
                      <span>Passport</span>
                    </button>
                  </div>

                  {/* Separate Track Order and View Details buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Separate Track Order Button (Requirement 6) */}
                    <button
                      type="button"
                      onClick={() => setTrackingOrderId(isTrackingOpen ? null : order.id)}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isTrackingOpen
                          ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                          : 'bg-white hover:bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:border-emerald-300'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                      {isTrackingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Separate View Details Button (Requirement 6) */}
                    <button
                      type="button"
                      onClick={() => setDetailsOrderId(isDetailsOpen ? null : order.id)}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isDetailsOpen
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                      {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ================= PANEL 1: TRACK ORDER PROGRESS TIMELINE (Requirement 5) ================= */}
                {isTrackingOpen && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 animate-in fade-in duration-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-800" />
                        Order Tracking Progress
                      </h5>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Live Lifecycle Updates
                      </span>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
                      <OrderTrackingTimeline
                        currentStatus={order.status}
                        timeline={order.statusTimeline}
                        expectedDeliveryDate={deliveryInfo.text}
                      />
                    </div>
                  </div>
                )}

                {/* ================= PANEL 2: VIEW DETAILS (Addresses, Agreement, Payment, Actions) ================= */}
                {isDetailsOpen && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 animate-in fade-in duration-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-800" />
                        Order Specifications & Verification
                      </h5>
                      {order.latestHash && (
                        <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Hash: #{order.latestHash.slice(0, 10)}...
                        </span>
                      )}
                    </div>

                    {/* 2-Column Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      {/* Delivery Address */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 font-bold block flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          Delivery Address
                        </span>
                        <p className="font-semibold text-slate-900 leading-snug">
                          {order.deliveryLocation || 'Delivery location on file'}
                        </p>
                        {order.shippingAddress?.contactName && (
                          <p className="text-slate-600 font-medium mt-1">
                            Contact: {order.shippingAddress.contactName}
                          </p>
                        )}
                        {order.shippingAddress?.contactPhone && (
                          <p className="text-slate-500">
                            Phone: {order.shippingAddress.contactPhone}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            &ldquo;{order.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Payment & Agreement Details */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-slate-400 font-bold block flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          Payment & Agreement
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Payment Method:</span>
                          <span className="font-bold text-slate-800">{order.paymentMethod || 'UPI / Online'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Payment Status:</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {order.paymentStatus || 'SUCCESS'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total Settlement:</span>
                          <span className="font-extrabold text-emerald-950 text-sm">
                            {formatINR(order.totalAmountINR)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Agreement ID:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {order.agreementId || 'WX-AGR-VERIFIED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SELLER ACTION CONTROLS */}
                    {activeTab === 'seller' && sellerActions.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <h6 className="font-bold text-xs text-slate-900">Seller Dispatch Actions:</h6>
                          <p className="text-[11px] text-slate-500">
                            Update fulfillment state to stamp verified lifecycle on ChainCraft.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {sellerActions.map((action) => (
                            <button
                              key={action.status}
                              disabled={isUpdating}
                              type="button"
                              onClick={() => handleUpdateStatus(order, action.status)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
                                action.status === 'Cancelled'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                              }`}
                            >
                              {isUpdating ? 'Updating...' : action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BUYER ACTION CONTROLS */}
                    {activeTab === 'buyer' && buyerActions.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <h6 className="font-bold text-xs text-slate-900">Buyer Delivery Confirmation:</h6>
                          <p className="text-[11px] text-slate-500">
                            Confirm material arrival to complete transaction and release settlement.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {buyerActions.map((action) => (
                            <button
                              key={action.status}
                              disabled={isUpdating}
                              type="button"
                              onClick={() => handleUpdateStatus(order, action.status)}
                              className="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-900 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>{isUpdating ? 'Updating...' : action.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ChainCraft Resource Passport & Agreement Modal */}
      <ChainCraftPassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        passport={selectedPassport}
        agreement={selectedAgreement}
      />
    </div>
  );
};

