import { supabase, isSupabaseConfigured, computeSHA256 } from '../lib/supabase';
import { Order, OrderStatus, OrderStatusHistoryItem, UserRole, ChainCraftLifecycleEventName, DemoPaymentRecord } from '../types';
import {
  recordOrderInChainCraft,
  advanceChainCraftLifecycle,
  getAgreementByOrderId,
  getPassportByOrderId,
} from './chaincraftService';

const LOCAL_STORAGE_ORDERS_KEY = 'worthx_orders_store';

export const getLocalOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalOrder = (order: Order) => {
  try {
    const existing = getLocalOrders();
    const filtered = existing.filter((o) => o.id !== order.id && o.orderId !== order.orderId);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([order, ...filtered]));
  } catch (err) {
    console.warn('Could not cache order in localStorage', err);
  }
};

export const generateOrderId = (): string => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `WX-ORD-${randomNum}`;
};

/**
 * Map OrderStatus to ChainCraftLifecycleEventName
 */
export const orderStatusToLifecycleEvent = (status: OrderStatus): ChainCraftLifecycleEventName => {
  switch (status) {
    case 'Order Placed':
    case 'REQUESTED':
      return 'ORDER_CREATED';
    case 'Seller Confirmed':
    case 'ACCEPTED':
      return 'ORDER_ACCEPTED';
    case 'Processing':
      return 'PREPARING';
    case 'Shipped':
      return 'DISPATCHED';
    case 'Delivered':
      return 'RECEIVED';
    case 'Completed':
      return 'COMPLETED';
    default:
      return 'ORDER_CREATED';
  }
};

/**
 * Create a new Order in Supabase and ChainCraft
 */
export const createFirestoreOrder = async (
  orderData: Omit<Order, 'id' | 'orderId' | 'statusTimeline' | 'createdAt' | 'updatedAt'> & {
    orderId?: string;
  }
): Promise<Order> => {
  const now = new Date().toISOString();
  const uniqueOrderId = orderData.orderId || generateOrderId();
  const orderDocId = `ord-${Date.now()}`;

  // 1. Formalize ChainCraft Resource Passport and Digital Transaction Agreement
  const { passport, agreement } = await recordOrderInChainCraft({
    orderId: uniqueOrderId,
    listingId: orderData.listingId,
    passportId: orderData.passportId,
    materialName: orderData.materialName,
    category: orderData.category,
    quantity: orderData.quantity,
    unit: orderData.unit,
    pricePerUnit: orderData.pricePerUnit,
    totalAmountINR: orderData.totalAmountINR,
    buyerId: orderData.buyerId,
    buyerName: orderData.buyerName,
    sellerId: orderData.sellerId,
    sellerName: orderData.sellerName,
    deliveryLocation: orderData.deliveryLocation || 'On file',
    paymentMethod: orderData.paymentMethod,
    createdAt: now,
  });

  const initialTimelineItem: OrderStatusHistoryItem = {
    status: 'Order Placed',
    timestamp: now,
    note: `Order registered with Digital Transaction Agreement ${agreement.agreementId}`,
    updatedBy: orderData.buyerName,
    updaterRole: 'BUYER',
    hash: passport.latestHash,
  };

  const newOrder: Order = {
    ...orderData,
    id: orderDocId,
    orderId: uniqueOrderId,
    passportId: passport.passportId,
    agreementId: agreement.agreementId,
    agreement,
    agreementStatus: 'CREATED',
    lifecycleStatus: 'AGREEMENT_CREATED',
    status: 'Order Placed',
    paymentStatus: orderData.paymentStatus || 'SUCCESS',
    paymentMethod: orderData.paymentMethod || 'UPI',
    paymentAmount: orderData.paymentAmount ?? orderData.totalAmountINR,
    paymentTimestamp: orderData.paymentTimestamp || now,
    transactionId: orderData.transactionId || `TXN-DEMO-${Date.now()}`,
    latestHash: passport.latestHash,
    statusTimeline: [initialTimelineItem],
    createdAt: now,
    updatedAt: now,
  };

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('orders').insert({
        id: orderDocId,
        order_id: uniqueOrderId,
        listing_id: orderData.listingId,
        passport_id: passport.passportId,
        agreement_id: agreement.agreementId,
        buyer_id: orderData.buyerId,
        buyer_name: orderData.buyerName,
        buyer_email: orderData.buyerEmail,
        buyer_phone: orderData.buyerPhone,
        seller_id: orderData.sellerId,
        seller_name: orderData.sellerName,
        material_name: orderData.materialName,
        category: orderData.category,
        quantity: orderData.quantity,
        unit: orderData.unit,
        price_per_unit: orderData.pricePerUnit,
        total_amount_inr: orderData.totalAmountINR,
        payment_status: orderData.paymentStatus || 'SUCCESS',
        payment_method: orderData.paymentMethod || 'UPI',
        payment_amount: orderData.paymentAmount ?? orderData.totalAmountINR,
        payment_timestamp: orderData.paymentTimestamp || now,
        transaction_id: orderData.transactionId || `TXN-DEMO-${Date.now()}`,
        status: 'Order Placed',
        delivery_location: orderData.deliveryLocation,
        latest_hash: passport.latestHash,
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase order insert warning:', err);
    }
  }

  // 3. Cache locally
  saveLocalOrder(newOrder);

  return newOrder;
};

/**
 * Fetch orders placed by buyer
 */
export const getBuyerOrders = async (buyerId: string): Promise<Order[]> => {
  let supabaseOrders: Order[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        supabaseOrders = data.map((d: any) => ({
          id: d.id,
          orderId: d.order_id || d.id,
          listingId: d.listing_id,
          passportId: d.passport_id,
          agreementId: d.agreement_id,
          buyerId: d.buyer_id,
          buyerName: d.buyer_name,
          buyerEmail: d.buyer_email,
          buyerPhone: d.buyer_phone,
          sellerId: d.seller_id,
          sellerName: d.seller_name,
          materialName: d.material_name,
          category: d.category,
          quantity: d.quantity,
          unit: d.unit,
          pricePerUnit: d.price_per_unit,
          pricePerUnitNumber: parseFloat(d.price_per_unit?.replace(/[^0-9.]/g, '')) || 0,
          totalAmountINR: d.total_amount_inr,
          paymentStatus: d.payment_status || 'SUCCESS',
          paymentMethod: d.payment_method || 'UPI',
          paymentAmount: d.payment_amount || d.total_amount_inr,
          paymentTimestamp: d.payment_timestamp || d.created_at,
          transactionId: d.transaction_id,
          status: d.status,
          deliveryLocation: d.delivery_location,
          latestHash: d.latest_hash,
          statusTimeline: d.status_timeline || [
            {
              status: d.status,
              timestamp: d.created_at,
              note: 'Order registered',
              updatedBy: d.buyer_name,
              updaterRole: 'BUYER',
            },
          ],
          createdAt: d.created_at,
          updatedAt: d.updated_at || d.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase buyer orders fetch warning, using local cache:', err);
    }
  }

  const localOrders = getLocalOrders().filter(
    (o) => o.buyerId === buyerId || (buyerId && buyerId.startsWith('demo-buyer'))
  );

  const mergedMap = new Map<string, Order>();
  supabaseOrders.forEach((o) => mergedMap.set(o.orderId, o));
  localOrders.forEach((o) => {
    if (!mergedMap.has(o.orderId)) mergedMap.set(o.orderId, o);
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Fetch orders received by seller
 */
export const getSellerOrders = async (sellerId: string): Promise<Order[]> => {
  let supabaseOrders: Order[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        supabaseOrders = data
          .filter(
            (d: any) =>
              d.seller_id === sellerId ||
              sellerId.startsWith('demo-seller') ||
              d.seller_id?.startsWith('demo-seller')
          )
          .map((d: any) => ({
            id: d.id,
            orderId: d.order_id || d.id,
            listingId: d.listing_id,
            passportId: d.passport_id,
            agreementId: d.agreement_id,
            buyerId: d.buyer_id,
            buyerName: d.buyer_name,
            buyerEmail: d.buyer_email,
            buyerPhone: d.buyer_phone,
            sellerId: d.seller_id,
            sellerName: d.seller_name,
            materialName: d.material_name,
            category: d.category,
            quantity: d.quantity,
            unit: d.unit,
            pricePerUnit: d.price_per_unit,
            pricePerUnitNumber: parseFloat(d.price_per_unit?.replace(/[^0-9.]/g, '')) || 0,
            totalAmountINR: d.total_amount_inr,
            status: d.status,
            deliveryLocation: d.delivery_location,
            latestHash: d.latest_hash,
            statusTimeline: d.status_timeline || [
              {
                status: d.status,
                timestamp: d.created_at,
                note: 'Order registered',
                updatedBy: d.buyer_name,
                updaterRole: 'BUYER',
              },
            ],
            createdAt: d.created_at,
            updatedAt: d.updated_at || d.created_at,
          }));
      }
    } catch (err) {
      console.warn('Supabase seller orders fetch warning, using local cache:', err);
    }
  }

  const allLocal = getLocalOrders();
  const localOrders = allLocal.filter(
    (o) =>
      o.sellerId === sellerId ||
      (sellerId && sellerId.startsWith('demo-seller')) ||
      (o.sellerId && o.sellerId.startsWith('demo-seller'))
  );

  const mergedMap = new Map<string, Order>();
  supabaseOrders.forEach((o) => mergedMap.set(o.orderId, o));
  localOrders.forEach((o) => {
    if (!mergedMap.has(o.orderId)) mergedMap.set(o.orderId, o);
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Advance an order's status and record in ChainCraft with SHA-256 hash
 */
export const updateOrderStatus = async (
  orderDocId: string,
  newStatus: OrderStatus,
  note?: string,
  updaterName: string = 'Seller',
  updaterRole: UserRole = 'SELLER'
): Promise<Order | null> => {
  const now = new Date().toISOString();
  const localOrders = getLocalOrders();
  const orderIdx = localOrders.findIndex((o) => o.id === orderDocId || o.orderId === orderDocId);

  const currentOrder = orderIdx !== -1 ? localOrders[orderIdx] : null;
  const orderId = currentOrder ? currentOrder.orderId : orderDocId;
  const lifecycleEvent = orderStatusToLifecycleEvent(newStatus);

  // 1. Advance ChainCraft Lifecycle & SHA-256 hash
  let newHash: string | undefined;
  try {
    const { passport } = await advanceChainCraftLifecycle({
      orderId,
      passportId: currentOrder?.passportId,
      eventName: lifecycleEvent,
      actor: updaterName,
      actorRole: updaterRole,
      note: note || `Status updated to ${newStatus}`,
    });
    newHash = passport.latestHash;
  } catch (err) {
    console.warn('ChainCraft lifecycle advancement warning:', err);
  }

  const newTimelineItem: OrderStatusHistoryItem = {
    status: newStatus,
    timestamp: now,
    note: note || `Status updated to ${newStatus}`,
    updatedBy: updaterName,
    updaterRole,
    hash: newHash,
  };

  let updatedOrder: Order | null = null;

  if (currentOrder) {
    const updatedTimeline = [...(currentOrder.statusTimeline || []), newTimelineItem];
    const agreement = await getAgreementByOrderId(orderId);

    updatedOrder = {
      ...currentOrder,
      status: newStatus,
      lifecycleStatus: lifecycleEvent,
      latestHash: newHash || currentOrder.latestHash,
      agreement: agreement || currentOrder.agreement,
      agreementStatus: agreement?.agreementStatus || currentOrder.agreementStatus,
      statusTimeline: updatedTimeline,
      updatedAt: now,
    };

    localOrders[orderIdx] = updatedOrder;
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(localOrders));
  }

  // 2. Persist update in Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('orders')
        .update({
          status: newStatus,
          latest_hash: newHash,
          updated_at: now,
        })
        .or(`id.eq.${orderDocId},order_id.eq.${orderDocId}`);
    } catch (err) {
      console.warn('Supabase update order status warning:', err);
    }
  }

  return updatedOrder;
};

/**
 * Record a demo payment record in Supabase and local cache
 */
export const recordDemoPayment = async (paymentData: DemoPaymentRecord): Promise<void> => {
  const now = new Date().toISOString();

  // 1. Persist to Supabase payments table and update order record
  if (isSupabaseConfigured) {
    try {
      await supabase.from('payments').insert({
        order_id: paymentData.order_id,
        payment_id: paymentData.payment_id,
        payment_method: paymentData.payment_method,
        amount: paymentData.amount,
        payment_status: paymentData.payment_status,
        created_at: paymentData.created_at || now,
        updated_at: paymentData.updated_at || now,
      });
    } catch (err) {
      console.warn('Supabase payments table insert notice:', err);
    }

    try {
      await supabase
        .from('orders')
        .update({
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method,
          payment_amount: paymentData.amount,
          transaction_id: paymentData.payment_id,
          payment_timestamp: now,
          updated_at: now,
        })
        .or(`order_id.eq.${paymentData.order_id},id.eq.${paymentData.order_id}`);
    } catch (err) {
      console.warn('Supabase order payment update notice:', err);
    }
  }

  // 2. Persist to local demo store
  try {
    const raw = localStorage.getItem('worthx_payments_store');
    const existing: DemoPaymentRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((p) => p.payment_id !== paymentData.payment_id);
    localStorage.setItem('worthx_payments_store', JSON.stringify([paymentData, ...filtered]));

    // Also update order in local orders store
    const localOrders = getLocalOrders();
    const idx = localOrders.findIndex((o) => o.orderId === paymentData.order_id || o.id === paymentData.order_id);
    if (idx !== -1) {
      localOrders[idx] = {
        ...localOrders[idx],
        paymentStatus: paymentData.payment_status === 'SUCCESS' ? 'SUCCESS' : 'Pending',
        paymentMethod: paymentData.payment_method,
        paymentAmount: paymentData.amount,
        transactionId: paymentData.payment_id,
        paymentTimestamp: now,
        updatedAt: now,
      };
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(localOrders));
    }
  } catch (err) {
    console.warn('LocalStorage demo payment store cache notice:', err);
  }
};

