export type UserRole = 'BUYER' | 'SELLER' | 'PROCESSOR' | 'GENERAL_USER';

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  bio?: string;
  location?: string;
}

export type MaterialCategory =
  | 'Agro & Organic'
  | 'Paper'
  | 'Plastic'
  | 'Industrial By-products'
  | 'Food Processing Waste'
  | 'Other Reusable Materials'
  | 'Recyclable / Industrial Scrap';

export interface MaterialListing {
  id: string;
  listingId?: string;
  sellerId?: string;
  sellerName?: string;
  materialName: string;
  category: MaterialCategory;
  description: string;
  quantity: string;
  unit: string;
  minimumOrderQuantity?: string;
  pricePerUnit?: string;
  price: string;
  location: string;
  imageUrl: string;
  images?: string[];
  availability: 'Available' | 'Reserved' | 'In Demand';
  isDemo?: boolean;
  minOrder?: string;
  moistureContent?: string;
  purityGrade?: string;
  applications?: string[];
  possibleUses?: string[];
  verificationBadge?: string;
  co2Offset?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  passportId?: string;
  verificationHash?: string;
}

export interface MaterialRequirement {
  id: string;
  userId: string;
  userName: string;
  materialName: string;
  category: MaterialCategory;
  targetQuantity: string;
  frequency: 'One-time' | 'Daily' | 'Weekly' | 'Monthly';
  maxPricePerUnit: string;
  deliveryLocation: string;
  notes?: string;
  status: 'Open' | 'Fulfilled' | 'Closed';
  createdAt: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Seller Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'REQUESTED'
  | 'ACCEPTED';

export type ChainCraftLifecycleEventName =
  | 'LISTING_CREATED'
  | 'RESOURCE_VERIFIED'
  | 'ORDER_CREATED'
  | 'AGREEMENT_CREATED'
  | 'ORDER_ACCEPTED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'RECEIVED'
  | 'COMPLETED';

export interface ChainCraftEvent {
  id: string;
  eventId: string;
  passportId: string;
  listingId?: string;
  orderId?: string;
  agreementId?: string;
  eventName: ChainCraftLifecycleEventName;
  statusLabel: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole | 'SYSTEM';
  actorId?: string;
  details: string;
  payload: Record<string, unknown>;
  hash: string;
  previousHash: string;
}

export interface ChainCraftPassport {
  id: string;
  passportId: string;
  listingId: string;
  materialName: string;
  category: MaterialCategory;
  quantity: string;
  unit: string;
  sellerId: string;
  sellerName: string;
  orderId?: string;
  agreementId?: string;
  verificationStatus: 'ChainCraft Verified' | 'Pending Verification';
  lifecycleStatus: ChainCraftLifecycleEventName;
  genesisHash: string;
  latestHash: string;
  createdAt: string;
  updatedAt: string;
  events: ChainCraftEvent[];
}

export type AgreementStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'RECEIVED'
  | 'COMPLETED';

export interface DigitalAgreement {
  id: string;
  agreementId: string;
  orderId: string;
  listingId?: string;
  passportId?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  materialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  pricePerUnit: string;
  totalAmountINR: number;
  deliveryLocation?: string;
  paymentMethod?: string;
  sellerAcceptance: boolean;
  sellerAcceptedAt?: string;
  buyerAcceptance: boolean;
  buyerAcceptedAt?: string;
  agreementStatus: AgreementStatus;
  agreementHash?: string;
  hash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
  updaterRole?: UserRole;
  hash?: string;
}

export interface OrderItem {
  listingId: string;
  materialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  pricePerUnit: string;
  pricePerUnitNumber: number;
  totalAmountINR: number;
  sellerId: string;
  sellerName: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderId: string;
  listingId?: string;
  passportId?: string;
  agreementId?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  materialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  pricePerUnit: string;
  pricePerUnitNumber: number;
  totalAmountINR: number;
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'COD' | 'PENDING_COD';
  paymentMethod?: 'UPI' | 'Net Banking' | 'Wallet' | 'Cash on Delivery (COD)';
  paymentAmount?: number;
  paymentTimestamp?: string;
  transactionId?: string;
  status: OrderStatus;
  lifecycleStatus?: ChainCraftLifecycleEventName;
  deliveryLocation?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    contactName: string;
    contactPhone: string;
    notes?: string;
  };
  notes?: string;
  items?: OrderItem[];
  rejectionReason?: string;
  rejectionTimestamp?: string;
  agreementStatus?: AgreementStatus;
  agreement?: DigitalAgreement;
  materialImage?: string;
  statusTimeline: OrderStatusHistoryItem[];
  latestHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  listing: MaterialListing;
  quantity: number;
  unitPriceNum: number;
  totalINR: number;
}

export interface AppNotification {
  id: string;
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  orderId?: string;
  listingId?: string;
  type?: 'ORDER_REQUEST' | 'ORDER_ACCEPTED' | 'ORDER_REJECTED' | 'ORDER_STATUS' | 'AGREEMENT';
  read: boolean;
  createdAt: string;
}

export interface DemoPaymentRecord {
  order_id: string;
  payment_id: string;
  payment_method: 'UPI' | 'Net Banking' | 'Wallet' | 'Cash on Delivery (COD)';
  amount: number;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'COD' | 'PENDING_COD';
  created_at: string;
  updated_at: string;
}

