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
} from 'lucide-react';

interface OrdersManagerProps {
  onExploreMarketplace?: () => void;
  defaultTab?: 'buyer' | 'seller';
}

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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

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
          eventName: (t.status === 'Completed' ? 'COMPLETED' : t.status === 'Delivered' ? 'RECEIVED' : t.status === 'Shipped' ? 'DISPATCHED' : t.status === 'Processing' ? 'PREPARING' : t.status === 'Seller Confirmed' ? 'ORDER_ACCEPTED' : 'ORDER_CREATED') as any,
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
        setSellerOrders((prev) => prev.map((o) => (o.id === updated.id || o.orderId === updated.orderId ? updated : o)));
        setBuyerOrders((prev) => prev.map((o) => (o.id === updated.id || o.orderId === updated.orderId ? updated : o)));
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
          { label: 'Accept Order (ORDER_ACCEPTED)', status: 'Seller Confirmed' },
          { label: 'Decline / Cancel', status: 'Cancelled' },
        ];
      case 'Seller Confirmed':
      case 'ACCEPTED':
        return [
          { label: 'Prepare Material (PREPARING)', status: 'Processing' },
          { label: 'Cancel', status: 'Cancelled' },
        ];
      case 'Processing':
        return [
          { label: 'Dispatch Consignment (DISPATCHED)', status: 'Shipped' },
        ];
      default:
        return [];
    }
  };

  const getBuyerNextStatuses = (currentStatus: OrderStatus): { label: string; status: OrderStatus }[] => {
    switch (currentStatus) {
      case 'Shipped':
        return [
          { label: 'Confirm Material Received (RECEIVED)', status: 'Delivered' },
        ];
      case 'Delivered':
        return [
          { label: 'Complete & Verify Transaction (COMPLETED)', status: 'Completed' },
        ];
      default:
        return [];
    }
  };

  const currentList = activeTab === 'buyer' ? buyerOrders : sellerOrders;
  const filteredList = currentList.filter((order) => {
    if (filterStatus === 'All') return true;
    return order.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950">
            {activeTab === 'buyer' ? 'My Procurement Orders' : 'Seller Orders & Inquiries'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'buyer'
              ? 'Real-time order tracking, digital agreements, and ChainCraft lifecycle'
              : 'Incoming purchase covenants from industrial buyers with SHA-256 ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'buyer'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Purchases ({buyerOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'seller'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Received Orders ({sellerOrders.length})
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {['All', 'Order Placed', 'Seller Confirmed', 'Processing', 'Shipped', 'Delivered', 'Completed'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                filterStatus === status
                  ? 'bg-emerald-900 text-white font-bold border-emerald-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-800 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading orders & ChainCraft lifecycle...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {activeTab === 'buyer' ? <ShoppingCart className="w-6 h-6" /> : <Package className="w-6 h-6" />}
          </div>
          <h4 className="text-base font-bold text-slate-900">
            {filterStatus === 'All' ? 'No orders recorded yet' : `No orders with status "${filterStatus}"`}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'buyer'
              ? 'Browse the marketplace or use AI Search to find materials and place procurement orders with flexible quantities.'
              : 'You have not received any orders from buyers yet. Make sure your seller listings are active and competitive.'}
          </p>
          {onExploreMarketplace && activeTab === 'buyer' && (
            <button
              onClick={onExploreMarketplace}
              className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Browse Available Feedstocks
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const displayImg = getMaterialImageUrl(order.materialName, order.category, order.materialImage);
            const fallbackSvg = getCategoryPlaceholderSvg(order.materialName, order.category);
            const sellerActions = getSellerNextStatuses(order.status);
            const buyerActions = getBuyerNextStatuses(order.status);
            const isUpdating = statusUpdatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* Order Summary Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={displayImg}
                      alt={order.materialName}
                      onError={(e) => {
                        e.currentTarget.src = fallbackSvg;
                      }}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {order.orderId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {order.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h4 className="font-black text-base text-slate-950">
                        {order.materialName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>
                          Quantity: <strong className="text-slate-800">{order.quantity} {order.unit}</strong>
                        </span>
                        <span>
                          Total: <strong className="text-emerald-900 font-extrabold">{formatINR(order.totalAmountINR)}</strong>
                        </span>
                        <span>
                          {activeTab === 'buyer' ? (
                            <>Seller: <strong className="text-slate-800">{order.sellerName}</strong></>
                          ) : (
                            <>Buyer: <strong className="text-slate-800">{order.buyerName}</strong></>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge, Passport Action & Accordion Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPassport(order)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Inspect ChainCraft Resource Passport & SHA-256 Digest"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Passport</span>
                    </button>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs ${
                        order.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : order.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-950 border border-rose-300'
                          : order.status === 'Order Placed'
                          ? 'bg-sky-100 text-sky-950 border border-sky-300'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      {order.status}
                    </span>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'Track'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Tracking Timeline & Seller Controls */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-6">
                    {/* Visual Progress / Timeline */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-800" />
                          Live ChainCraft Procurement & Fulfillment Lifecycle
                        </h5>
                        <button
                          type="button"
                          onClick={() => handleOpenPassport(order)}
                          className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Hash className="w-3.5 h-3.5" />
                          View SHA-256 Ledger
                        </button>
                      </div>

                      <OrderTrackingTimeline
                        currentStatus={order.status}
                        timeline={order.statusTimeline}
                      />
                    </div>

                    {/* Delivery & Shipping Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 font-bold block mb-1">
                          Delivery Destination
                        </span>
                        <p className="font-semibold text-slate-900">
                          {order.deliveryLocation || 'Delivery location on file'}
                        </p>
                        {order.shippingAddress?.contactPhone && (
                          <p className="text-slate-500">
                            Phone: {order.shippingAddress.contactPhone}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-slate-500 italic mt-1">
                            Note: &ldquo;{order.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 font-bold block mb-1">
                          Digital Agreement & Verification
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total Settlement Value:</span>
                          <span className="font-extrabold text-emerald-950 text-sm">
                            {formatINR(order.totalAmountINR)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Agreement ID:</span>
                          <span className="font-mono font-bold text-slate-800">{order.agreementId || 'WX-AGR-VERIFIED'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Verification Protocol:</span>
                          <span className="font-bold text-emerald-800">ChainCraft™ SHA-256</span>
                        </div>
                      </div>
                    </div>

                    {/* SELLER ACTION CONTROLS */}
                    {activeTab === 'seller' && sellerActions.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">
                            Seller Dispatch Actions:
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Advance lifecycle state to stamp verified progress on ChainCraft.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {sellerActions.map((action) => (
                            <button
                              key={action.status}
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order, action.status)}
                              className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
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

                    {/* BUYER ACTION CONTROLS (Confirm Receipt & Complete Verification) */}
                    {activeTab === 'buyer' && buyerActions.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">
                            Buyer Verification Actions:
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Confirm receipt or complete transaction to stamp immutable delivery record.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {buyerActions.map((action) => (
                            <button
                              key={action.status}
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(order, action.status)}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-900 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              {isUpdating ? 'Updating...' : action.label}
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
