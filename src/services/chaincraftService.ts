import { supabase, isSupabaseConfigured, computeSHA256 } from '../lib/supabase';
import {
  ChainCraftEvent,
  ChainCraftPassport,
  ChainCraftLifecycleEventName,
  DigitalAgreement,
  AgreementStatus,
  MaterialListing,
  UserRole,
} from '../types';

const PASSPORTS_STORAGE_KEY = 'worthx_chaincraft_passports';
const AGREEMENTS_STORAGE_KEY = 'worthx_digital_agreements';

export function getLocalPassports(): ChainCraftPassport[] {
  try {
    const raw = localStorage.getItem(PASSPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPassports(passports: ChainCraftPassport[]): void {
  try {
    localStorage.setItem(PASSPORTS_STORAGE_KEY, JSON.stringify(passports));
  } catch (err) {
    console.warn('Could not save passports to localStorage:', err);
  }
}

export function getLocalAgreements(): DigitalAgreement[] {
  try {
    const raw = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAgreements(agreements: DigitalAgreement[]): void {
  try {
    localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(agreements));
  } catch (err) {
    console.warn('Could not save agreements to localStorage:', err);
  }
}

/**
 * Generate human-readable IDs
 */
export function generatePassportId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WX-PASSPORT-${rand}`;
}

export function generateAgreementId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WX-AGR-${rand}`;
}

/**
 * Create a new ChainCraft Resource Passport when a listing is published
 * Emits LISTING_CREATED and RESOURCE_VERIFIED events.
 */
export async function createResourcePassport(
  listing: Pick<MaterialListing, 'id' | 'materialName' | 'category' | 'quantity' | 'unit' | 'sellerId' | 'sellerName' | 'location' | 'price'>
): Promise<ChainCraftPassport> {
  const passportId = generatePassportId();
  const now = new Date().toISOString();

  // 1. Event: LISTING_CREATED
  const event1Payload = {
    passportId,
    listingId: listing.id,
    materialName: listing.materialName,
    category: listing.category,
    quantity: listing.quantity,
    unit: listing.unit,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    location: listing.location,
    price: listing.price,
    timestamp: now,
  };
  const event1Hash = await computeSHA256(event1Payload);
  const genesisHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  const event1: ChainCraftEvent = {
    id: `ev-${Date.now()}-1`,
    eventId: `EV-${Date.now()}-01`,
    passportId,
    listingId: listing.id,
    eventName: 'LISTING_CREATED',
    statusLabel: 'Listing Published',
    timestamp: now,
    actor: listing.sellerName || 'Verified Producer',
    actorRole: 'SELLER',
    actorId: listing.sellerId,
    details: `Seller published ${listing.quantity} ${listing.unit} of verified ${listing.materialName} to the WORTHX marketplace.`,
    payload: event1Payload,
    hash: event1Hash,
    previousHash: genesisHash,
  };

  // 2. Event: RESOURCE_VERIFIED
  const event2Time = new Date(Date.now() + 200).toISOString();
  const event2Payload = {
    passportId,
    listingId: listing.id,
    materialName: listing.materialName,
    verificationStandard: 'WORTHX Circular Economy Provenance Standard (CEPS)',
    sha256Digest: event1Hash,
    timestamp: event2Time,
  };
  const event2Hash = await computeSHA256({ ...event2Payload, previousHash: event1Hash });

  const event2: ChainCraftEvent = {
    id: `ev-${Date.now()}-2`,
    eventId: `EV-${Date.now()}-02`,
    passportId,
    listingId: listing.id,
    eventName: 'RESOURCE_VERIFIED',
    statusLabel: 'Resource Verified',
    timestamp: event2Time,
    actor: 'ChainCraft Protocol Engine',
    actorRole: 'SYSTEM',
    details: `Initial origin parameters and material classification verified against circular secondary feedstocks.`,
    payload: event2Payload,
    hash: event2Hash,
    previousHash: event1Hash,
  };

  const newPassport: ChainCraftPassport = {
    id: passportId,
    passportId,
    listingId: listing.id,
    materialName: listing.materialName,
    category: listing.category,
    quantity: listing.quantity,
    unit: listing.unit,
    sellerId: listing.sellerId || 'seller',
    sellerName: listing.sellerName || 'Seller',
    verificationStatus: 'ChainCraft Verified',
    lifecycleStatus: 'RESOURCE_VERIFIED',
    genesisHash,
    latestHash: event2Hash,
    createdAt: now,
    updatedAt: event2Time,
    events: [event1, event2],
  };

  // Persist to Supabase if available
  if (isSupabaseConfigured) {
    try {
      await supabase.from('resource_passports').insert({
        passport_id: passportId,
        listing_id: listing.id,
        material_name: listing.materialName,
        category: listing.category,
        quantity: listing.quantity,
        unit: listing.unit,
        seller_id: listing.sellerId,
        seller_name: listing.sellerName,
        verification_status: 'ChainCraft Verified',
        lifecycle_status: 'RESOURCE_VERIFIED',
        latest_hash: event2Hash,
        created_at: now,
      });

      await supabase.from('chaincraft_events').insert([
        {
          event_id: event1.eventId,
          passport_id: passportId,
          listing_id: listing.id,
          event_name: event1.eventName,
          timestamp: event1.timestamp,
          actor: event1.actor,
          actor_role: event1.actorRole,
          hash: event1.hash,
          previous_hash: event1.previousHash,
          details: event1.details,
          payload: event1.payload,
        },
        {
          event_id: event2.eventId,
          passport_id: passportId,
          listing_id: listing.id,
          event_name: event2.eventName,
          timestamp: event2.timestamp,
          actor: event2.actor,
          actor_role: event2.actorRole,
          hash: event2.hash,
          previous_hash: event2.previousHash,
          details: event2.details,
          payload: event2.payload,
        },
      ]);
    } catch (err) {
      console.warn('Supabase passport insert warning, local storage updated:', err);
    }
  }

  // Save to local storage cache
  const localList = getLocalPassports();
  saveLocalPassports([newPassport, ...localList.filter((p) => p.listingId !== listing.id)]);

  return newPassport;
}

/**
 * Record order creation and digital transaction agreement in ChainCraft
 */
export async function recordOrderInChainCraft(params: {
  orderId: string;
  listingId?: string;
  passportId?: string;
  materialName: string;
  category: any;
  quantity: number;
  unit: string;
  pricePerUnit: string;
  totalAmountINR: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  deliveryLocation: string;
  paymentMethod?: string;
  createdAt?: string;
}): Promise<{ passport: ChainCraftPassport; agreement: DigitalAgreement }> {
  const now = new Date().toISOString();
  const localPassports = getLocalPassports();

  // Find or create passport for this resource
  let passport = localPassports.find(
    (p) =>
      (params.passportId && p.passportId === params.passportId) ||
      (params.listingId && p.listingId === params.listingId)
  );

  if (!passport) {
    passport = await createResourcePassport({
      id: params.listingId || `mat-${Date.now()}`,
      materialName: params.materialName,
      category: params.category,
      quantity: `${params.quantity}`,
      unit: params.unit,
      sellerId: params.sellerId,
      sellerName: params.sellerName,
      location: params.deliveryLocation,
      price: params.pricePerUnit,
    });
  }

  const prevHash = passport.latestHash;

  // 1. ORDER_CREATED Event
  const orderEventPayload = {
    passportId: passport.passportId,
    orderId: params.orderId,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    sellerId: params.sellerId,
    quantity: params.quantity,
    unit: params.unit,
    totalINR: params.totalAmountINR,
    deliveryLocation: params.deliveryLocation,
    timestamp: now,
  };
  const orderHash = await computeSHA256({ ...orderEventPayload, previousHash: prevHash });

  const orderEvent: ChainCraftEvent = {
    id: `ev-${Date.now()}-ord`,
    eventId: `EV-${Date.now()}-ORD`,
    passportId: passport.passportId,
    listingId: params.listingId,
    orderId: params.orderId,
    eventName: 'ORDER_CREATED',
    statusLabel: 'Order Created',
    timestamp: now,
    actor: params.buyerName,
    actorRole: 'BUYER',
    actorId: params.buyerId,
    details: `Buyer registered procurement order for ${params.quantity} ${params.unit} of ${params.materialName}. Total: ₹${params.totalAmountINR}.`,
    payload: orderEventPayload,
    hash: orderHash,
    previousHash: prevHash,
  };

  // 2. Create Digital Transaction Agreement
  const agreementId = generateAgreementId();
  const agrTime = params.createdAt || new Date(Date.now() + 150).toISOString();
  const agreementPayload = {
    agreementId,
    orderId: params.orderId,
    passportId: passport.passportId,
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    materialName: params.materialName,
    quantity: params.quantity,
    unit: params.unit,
    totalAmountINR: params.totalAmountINR,
    deliveryLocation: params.deliveryLocation,
    paymentMethod: params.paymentMethod,
    covenant: 'WORTHX Standard Bilateral Secondary Resource Procurement Covenant',
    createdAt: agrTime,
  };
  const agreementHash = await computeSHA256(agreementPayload);

  const agreement: DigitalAgreement = {
    id: agreementId,
    agreementId,
    orderId: params.orderId,
    listingId: params.listingId,
    passportId: passport.passportId,
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    buyerId: params.buyerId,
    buyerName: params.buyerName,
    materialName: params.materialName,
    category: params.category,
    quantity: params.quantity,
    unit: params.unit,
    pricePerUnit: params.pricePerUnit,
    totalAmountINR: params.totalAmountINR,
    deliveryLocation: params.deliveryLocation,
    paymentMethod: params.paymentMethod,
    sellerAcceptance: false,
    buyerAcceptance: true,
    buyerAcceptedAt: agrTime,
    agreementStatus: 'CREATED',
    agreementHash,
    createdAt: agrTime,
    updatedAt: agrTime,
  };

  // 3. AGREEMENT_CREATED Event
  const agrEventPayload = {
    agreementId,
    agreementHash,
    orderId: params.orderId,
    terms: 'Bilateral covenant executed on ChainCraft ledger',
    timestamp: agrTime,
  };
  const agrEventHash = await computeSHA256({ ...agrEventPayload, previousHash: orderHash });

  const agrEvent: ChainCraftEvent = {
    id: `ev-${Date.now()}-agr`,
    eventId: `EV-${Date.now()}-AGR`,
    passportId: passport.passportId,
    listingId: params.listingId,
    orderId: params.orderId,
    agreementId,
    eventName: 'AGREEMENT_CREATED',
    statusLabel: 'Agreement Created',
    timestamp: agrTime,
    actor: 'ChainCraft Protocol Engine',
    actorRole: 'SYSTEM',
    details: `Digital Transaction Agreement ${agreementId} formalized between ${params.sellerName} and ${params.buyerName}.`,
    payload: agrEventPayload,
    hash: agrEventHash,
    previousHash: orderHash,
  };

  // Update passport
  const updatedPassport: ChainCraftPassport = {
    ...passport,
    orderId: params.orderId,
    agreementId,
    lifecycleStatus: 'AGREEMENT_CREATED',
    latestHash: agrEventHash,
    updatedAt: agrTime,
    events: [...passport.events, orderEvent, agrEvent],
  };

  // Save to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('agreements').insert({
        agreement_id: agreementId,
        order_id: params.orderId,
        passport_id: passport.passportId,
        seller_id: params.sellerId,
        seller_name: params.sellerName,
        buyer_id: params.buyerId,
        buyer_name: params.buyerName,
        material_name: params.materialName,
        quantity: params.quantity,
        unit: params.unit,
        total_amount_inr: params.totalAmountINR,
        delivery_location: params.deliveryLocation,
        agreement_status: 'CREATED',
        agreement_hash: agreementHash,
        created_at: agrTime,
      });

      await supabase.from('chaincraft_events').insert([
        {
          event_id: orderEvent.eventId,
          passport_id: passport.passportId,
          order_id: params.orderId,
          event_name: orderEvent.eventName,
          timestamp: orderEvent.timestamp,
          actor: orderEvent.actor,
          actor_role: orderEvent.actorRole,
          hash: orderEvent.hash,
          previous_hash: orderEvent.previousHash,
          details: orderEvent.details,
          payload: orderEvent.payload,
        },
        {
          event_id: agrEvent.eventId,
          passport_id: passport.passportId,
          order_id: params.orderId,
          agreement_id: agreementId,
          event_name: agrEvent.eventName,
          timestamp: agrEvent.timestamp,
          actor: agrEvent.actor,
          actor_role: agrEvent.actorRole,
          hash: agrEvent.hash,
          previous_hash: agrEvent.previousHash,
          details: agrEvent.details,
          payload: agrEvent.payload,
        },
      ]);
    } catch (err) {
      console.warn('Supabase sync warning for agreement/order:', err);
    }
  }

  // Update local storage
  const currentPassports = getLocalPassports();
  saveLocalPassports([
    updatedPassport,
    ...currentPassports.filter((p) => p.passportId !== updatedPassport.passportId),
  ]);

  const currentAgreements = getLocalAgreements();
  saveLocalAgreements([agreement, ...currentAgreements.filter((a) => a.agreementId !== agreementId)]);

  return { passport: updatedPassport, agreement };
}

/**
 * Advance ChainCraft lifecycle stage
 */
export async function advanceChainCraftLifecycle(params: {
  orderId: string;
  passportId?: string;
  eventName: ChainCraftLifecycleEventName;
  actor: string;
  actorRole: UserRole;
  actorId?: string;
  note?: string;
}): Promise<{ passport: ChainCraftPassport; agreement?: DigitalAgreement }> {
  const now = new Date().toISOString();
  const localPassports = getLocalPassports();

  let passport = localPassports.find(
    (p) =>
      p.orderId === params.orderId ||
      (params.passportId && p.passportId === params.passportId)
  );

  if (!passport) {
    passport = localPassports[0];
  }

  if (!passport) {
    throw new Error('Resource passport not found for this transaction.');
  }

  const prevHash = passport.latestHash;
  const eventPayload = {
    passportId: passport.passportId,
    orderId: params.orderId,
    eventName: params.eventName,
    actor: params.actor,
    actorRole: params.actorRole,
    note: params.note || `Lifecycle transitioned to ${params.eventName}`,
    timestamp: now,
  };

  const eventHash = await computeSHA256({ ...eventPayload, previousHash: prevHash });

  const statusLabels: Record<ChainCraftLifecycleEventName, string> = {
    LISTING_CREATED: 'Listing Published',
    RESOURCE_VERIFIED: 'Resource Verified',
    ORDER_CREATED: 'Order Created',
    AGREEMENT_CREATED: 'Agreement Created',
    ORDER_ACCEPTED: 'Order Accepted',
    PREPARING: 'Material Preparing',
    DISPATCHED: 'Consignment Dispatched',
    RECEIVED: 'Material Received',
    COMPLETED: 'Transaction Completed & Verified',
  };

  const newEvent: ChainCraftEvent = {
    id: `ev-${Date.now()}-${params.eventName.toLowerCase()}`,
    eventId: `EV-${Date.now()}-${params.eventName}`,
    passportId: passport.passportId,
    orderId: params.orderId,
    agreementId: passport.agreementId,
    eventName: params.eventName,
    statusLabel: statusLabels[params.eventName] || params.eventName,
    timestamp: now,
    actor: params.actor,
    actorRole: params.actorRole,
    actorId: params.actorId,
    details:
      params.note ||
      `Transaction status updated to ${params.eventName} by ${params.actor} (${params.actorRole}). SHA-256 integrity stamped.`,
    payload: eventPayload,
    hash: eventHash,
    previousHash: prevHash,
  };

  const updatedPassport: ChainCraftPassport = {
    ...passport,
    lifecycleStatus: params.eventName,
    latestHash: eventHash,
    updatedAt: now,
    events: [...passport.events, newEvent],
  };

  // Update digital agreement if present
  const agreements = getLocalAgreements();
  let updatedAgreement: DigitalAgreement | undefined;

  const agrIdx = agreements.findIndex(
    (a) => a.orderId === params.orderId || a.agreementId === passport?.agreementId
  );

  if (agrIdx !== -1) {
    const agr = agreements[agrIdx];
    const newStatus: AgreementStatus =
      params.eventName === 'ORDER_ACCEPTED'
        ? 'ACCEPTED'
        : params.eventName === 'PREPARING'
        ? 'PREPARING'
        : params.eventName === 'DISPATCHED'
        ? 'DISPATCHED'
        : params.eventName === 'RECEIVED'
        ? 'RECEIVED'
        : params.eventName === 'COMPLETED'
        ? 'COMPLETED'
        : agr.agreementStatus;

    updatedAgreement = {
      ...agr,
      agreementStatus: newStatus,
      sellerAcceptance:
        params.eventName === 'ORDER_ACCEPTED' || params.eventName === 'DISPATCHED' || params.eventName === 'COMPLETED'
          ? true
          : agr.sellerAcceptance,
      sellerAcceptedAt:
        params.eventName === 'ORDER_ACCEPTED' && !agr.sellerAcceptedAt ? now : agr.sellerAcceptedAt,
      buyerAcceptance:
        params.eventName === 'RECEIVED' || params.eventName === 'COMPLETED'
          ? true
          : agr.buyerAcceptance,
      buyerAcceptedAt:
        params.eventName === 'RECEIVED' && !agr.buyerAcceptedAt ? now : agr.buyerAcceptedAt,
      updatedAt: now,
    };
    agreements[agrIdx] = updatedAgreement;
    saveLocalAgreements(agreements);
  }

  // Update local passports
  const currentPassports = getLocalPassports();
  saveLocalPassports([
    updatedPassport,
    ...currentPassports.filter((p) => p.passportId !== updatedPassport.passportId),
  ]);

  // Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('chaincraft_events').insert({
        event_id: newEvent.eventId,
        passport_id: passport.passportId,
        order_id: params.orderId,
        event_name: newEvent.eventName,
        timestamp: newEvent.timestamp,
        actor: newEvent.actor,
        actor_role: newEvent.actorRole,
        hash: newEvent.hash,
        previous_hash: newEvent.previousHash,
        details: newEvent.details,
        payload: newEvent.payload,
      });

      if (updatedAgreement) {
        await supabase
          .from('agreements')
          .update({
            agreement_status: updatedAgreement.agreementStatus,
            seller_acceptance: updatedAgreement.sellerAcceptance,
            buyer_acceptance: updatedAgreement.buyerAcceptance,
            updated_at: now,
          })
          .eq('agreement_id', updatedAgreement.agreementId);
      }
    } catch (err) {
      console.warn('Supabase lifecycle sync warning:', err);
    }
  }

  return { passport: updatedPassport, agreement: updatedAgreement };
}

/**
 * Get the passport for a listing or order
 */
export async function getPassportByListingId(listingId: string): Promise<ChainCraftPassport | null> {
  const localList = getLocalPassports();
  const found = localList.find((p) => p.listingId === listingId);
  if (found) return found;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('resource_passports')
        .select('*')
        .eq('listing_id', listingId)
        .single();
      if (data) return data as ChainCraftPassport;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Get passport by Order ID
 */
export async function getPassportByOrderId(orderId: string): Promise<ChainCraftPassport | null> {
  const localList = getLocalPassports();
  const found = localList.find((p) => p.orderId === orderId);
  if (found) return found;
  return null;
}

/**
 * Get Digital Agreement for an order
 */
export async function getAgreementByOrderId(orderId: string): Promise<DigitalAgreement | null> {
  const agreements = getLocalAgreements();
  const found = agreements.find((a) => a.orderId === orderId);
  return found || null;
}

/**
 * Get all passports relevant to a user or all platform passports
 */
export async function getAllUserPassports(userId?: string): Promise<ChainCraftPassport[]> {
  const localList = getLocalPassports();
  if (!userId) return localList;
  return localList.filter((p) => p.sellerId === userId || p.orderId);
}

/**
 * Get all agreements relevant to a user
 */
export async function getAllUserAgreements(userId?: string): Promise<DigitalAgreement[]> {
  const agreements = getLocalAgreements();
  if (!userId) return agreements;
  return agreements.filter((a) => a.sellerId === userId || a.buyerId === userId);
}

/**
 * Verify SHA-256 integrity of an event or agreement
 */
export async function verifySHA256Integrity(data: any, expectedHash: string): Promise<boolean> {
  const computed = await computeSHA256(data);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}
