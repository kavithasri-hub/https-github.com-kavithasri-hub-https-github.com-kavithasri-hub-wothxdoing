import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MaterialListing, MaterialRequirement } from '../types';
import { createResourcePassport } from './chaincraftService';

const LOCAL_LISTINGS_KEY = 'worthx_custom_listings';
const LOCAL_REQUIREMENTS_KEY = 'worthx_custom_requirements';

export const getLocalListings = (): MaterialListing[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalListings = (listings: MaterialListing[]) => {
  try {
    localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings));
  } catch (err) {
    console.warn('Could not save listings locally:', err);
  }
};

export const getFirestoreListings = async (): Promise<MaterialListing[]> => {
  let supabaseItems: MaterialListing[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        supabaseItems = data.map((d: any) => ({
          id: d.id || d.listing_id,
          listingId: d.listing_id || d.id,
          sellerId: d.seller_id,
          sellerName: d.seller_name,
          materialName: d.material_name,
          category: d.category,
          description: d.description,
          quantity: d.quantity,
          unit: d.unit,
          minimumOrderQuantity: d.min_order_quantity || d.min_order || '1 kg',
          pricePerUnit: d.price_per_unit || d.price,
          price: d.price,
          location: d.location,
          imageUrl: d.image_url,
          availability: d.availability || 'Available',
          isDemo: Boolean(d.is_demo),
          passportId: d.passport_id,
          verificationHash: d.verification_hash,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase listings fetch notice, using local cache:', err);
    }
  }

  const localItems = getLocalListings();
  const mergedMap = new Map<string, MaterialListing>();
  supabaseItems.forEach((item) => mergedMap.set(item.id, item));
  localItems.forEach((item) => {
    if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
  });

  return Array.from(mergedMap.values());
};

export const getSellerListings = async (sellerId: string): Promise<MaterialListing[]> => {
  const allListings = await getFirestoreListings();
  return allListings.filter(
    (item) => item.sellerId === sellerId || (sellerId && sellerId.startsWith('demo-seller'))
  );
};

export const createFirestoreListing = async (
  listing: Omit<MaterialListing, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaterialListing> => {
  const now = new Date().toISOString();
  const generatedId = `list-${Date.now()}`;

  // 1. Automatically generate ChainCraft Resource Passport with SHA-256 verification
  const passport = await createResourcePassport({
    id: generatedId,
    materialName: listing.materialName,
    category: listing.category,
    quantity: listing.quantity,
    unit: listing.unit,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    location: listing.location,
    price: listing.price,
  });

  const newDocData: MaterialListing = {
    ...listing,
    id: generatedId,
    listingId: generatedId,
    passportId: passport.passportId,
    verificationHash: passport.latestHash,
    verificationBadge: 'ChainCraft Verified',
    createdAt: now,
    updatedAt: now,
  };

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('listings').insert({
        id: generatedId,
        listing_id: generatedId,
        seller_id: listing.sellerId,
        seller_name: listing.sellerName,
        material_name: listing.materialName,
        category: listing.category,
        description: listing.description,
        quantity: listing.quantity,
        unit: listing.unit,
        price: listing.price,
        location: listing.location,
        image_url: listing.imageUrl,
        passport_id: passport.passportId,
        verification_hash: passport.latestHash,
        created_at: now,
      });
    } catch (err) {
      console.warn('Supabase insert listing warning:', err);
    }
  }

  // 3. Cache in local storage
  const current = getLocalListings();
  saveLocalListings([newDocData, ...current.filter((item) => item.id !== generatedId)]);

  return newDocData;
};

export const deleteFirestoreListing = async (listingId: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('listings').delete().eq('id', listingId);
    } catch (err) {
      console.warn('Supabase delete listing notice:', err);
    }
  }
  const current = getLocalListings();
  saveLocalListings(current.filter((l) => l.id !== listingId));
};

export const updateFirestoreListing = async (
  listingId: string,
  updatedData: Partial<MaterialListing>
): Promise<void> => {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('listings')
        .update({
          material_name: updatedData.materialName,
          category: updatedData.category,
          description: updatedData.description,
          quantity: updatedData.quantity,
          unit: updatedData.unit,
          price: updatedData.price,
          location: updatedData.location,
          image_url: updatedData.imageUrl,
          updated_at: now,
        })
        .eq('id', listingId);
    } catch (err) {
      console.warn('Supabase update listing notice:', err);
    }
  }

  const current = getLocalListings();
  const idx = current.findIndex((l) => l.id === listingId);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updatedData, updatedAt: now };
    saveLocalListings(current);
  }
};

export const createRequirement = async (
  req: Omit<MaterialRequirement, 'id' | 'createdAt'>
): Promise<MaterialRequirement> => {
  const now = new Date().toISOString();
  const id = `req-${Date.now()}`;
  const data: MaterialRequirement = {
    ...req,
    id,
    createdAt: now,
  };

  try {
    const raw = localStorage.getItem(LOCAL_REQUIREMENTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_REQUIREMENTS_KEY, JSON.stringify([data, ...existing]));
  } catch (err) {
    console.warn('Could not cache requirement:', err);
  }

  return data;
};

export const getUserRequirements = async (userId: string): Promise<MaterialRequirement[]> => {
  try {
    const raw = localStorage.getItem(LOCAL_REQUIREMENTS_KEY);
    const existing: MaterialRequirement[] = raw ? JSON.parse(raw) : [];
    return existing.filter((r) => r.userId === userId);
  } catch {
    return [];
  }
};
