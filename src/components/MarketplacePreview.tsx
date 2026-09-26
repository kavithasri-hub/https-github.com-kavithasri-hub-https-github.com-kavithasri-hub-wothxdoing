import React, { useState, useMemo } from 'react';
import { MaterialListing, MaterialCategory } from '../types';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../utils/materialImages';
import { parsePriceToNumber, parseQuantityToNumber, formatINR } from '../utils/currency';
import { matchListingAgainstQuery } from '../utils/naturalLanguageParser';
import { LanguageSwitcher, SearchLanguage } from './LanguageSwitcher';
import { useCart } from '../context/CartContext';
import {
  Search,
  Filter,
  Eye,
  MapPin,
  Scale,
  Sparkles,
  PlusCircle,
  Clock,
  Tag,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CheckCircle2,
  Check
} from 'lucide-react';

interface MarketplacePreviewProps {
  listings: MaterialListing[];
  onSelectListing: (listing: MaterialListing) => void;
  onRequestToBuy?: (listing: MaterialListing) => void;
  onOpenCreateListing: () => void;
  canCreateListing: boolean;
  activeSearchQuery?: string;
  onResetSearch?: () => void;
  isLoading?: boolean;
}

const CATEGORIES: ('All' | MaterialCategory)[] = [
  'All',
  'Agro & Organic',
  'Food Processing Waste',
  'Paper',
  'Plastic',
  'Industrial By-products',
  'Other Reusable Materials',
];

export const MarketplacePreview: React.FC<MarketplacePreviewProps> = ({
  listings,
  onSelectListing,
  onRequestToBuy,
  onOpenCreateListing,
  canCreateListing,
  activeSearchQuery = '',
  onResetSearch,
  isLoading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | MaterialCategory>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minAvailableQuantity, setMinAvailableQuantity] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [searchLanguage, setSearchLanguage] = useState<SearchLanguage>('en');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const { addToCart, setIsCartOpen } = useCart();
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  const handleAddToCartCard = (listing: MaterialListing) => {
    addToCart(listing, 1);
    setAddedToCartId(listing.id);
    setTimeout(() => {
      setAddedToCartId((curr) => (curr === listing.id ? null : curr));
    }, 2000);
  };

  const searchQuery = activeSearchQuery || localSearch;

  // Extract available unique locations
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((item) => {
      if (item.location) {
        const city = item.location.split(',')[0].trim();
        if (city) set.add(city);
      }
    });
    return ['All', ...Array.from(set)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'All') {
          const matchCategory =
            item.category === selectedCategory ||
            (selectedCategory === 'Industrial By-products' &&
              ((item.category as string).includes('Industrial') || (item.category as string).includes('Scrap')));
          if (!matchCategory) {
            return false;
          }
        }

        // Location filter
        if (selectedLocation !== 'All') {
          const matchLoc = item.location.toLowerCase().includes(selectedLocation.toLowerCase());
          if (!matchLoc) return false;
        }

        // Price filter (INR)
        const priceNum = parsePriceToNumber(item.price);
        if (minPrice && !isNaN(Number(minPrice))) {
          if (priceNum < Number(minPrice)) return false;
        }
        if (maxPrice && !isNaN(Number(maxPrice))) {
          if (priceNum > Number(maxPrice)) return false;
        }

        // Available Quantity filter
        const qtyNum = parseQuantityToNumber(item.quantity);
        if (minAvailableQuantity && !isNaN(Number(minAvailableQuantity))) {
          if (qtyNum < Number(minAvailableQuantity)) return false;
        }

        // Multilingual NLP and fuzzy search matching
        const q = searchQuery.trim();
        if (!q) return true;

        const relevance = matchListingAgainstQuery(item, q);
        if (relevance.matched) return true;

        const qLower = q.toLowerCase();
        return (
          item.materialName.toLowerCase().includes(qLower) ||
          item.category.toLowerCase().includes(qLower) ||
          item.description.toLowerCase().includes(qLower) ||
          item.location.toLowerCase().includes(qLower) ||
          item.applications?.some((app) => app.toLowerCase().includes(qLower))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return parsePriceToNumber(a.price) - parsePriceToNumber(b.price);
        }
        if (sortBy === 'price-desc') {
          return parsePriceToNumber(b.price) - parsePriceToNumber(a.price);
        }
        // If there's an active search query, prioritize higher NLP relevance matches
        if (searchQuery.trim()) {
          const relA = matchListingAgainstQuery(a, searchQuery).priority;
          const relB = matchListingAgainstQuery(b, searchQuery).priority;
          if (relB !== relA) {
            return relB - relA;
          }
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [
    listings,
    selectedCategory,
    selectedLocation,
    minPrice,
    maxPrice,
    minAvailableQuantity,
    sortBy,
    searchQuery,
  ]);

  return (
    <section id="marketplace" className="py-10 sm:py-16 bg-[#FBFBFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Create Listing CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Tag className="w-3.5 h-3.5" />
              Circular Marketplace (INR ₹)
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
              Available Feedstocks
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              Procure verified agricultural residues, manufacturing by-products, and post-consumer plastics with flexible order quantities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreateListing && (
              <button
                onClick={onOpenCreateListing}
                className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                List Material
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar (Requirement 8) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs mb-8 space-y-4">
          
          {/* Top Row: Categories & Search Box */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs font-medium">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-emerald-900 text-white font-bold border-emerald-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input & Language Switcher & Mobile Filter Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSwitcher
                currentLanguage={searchLanguage}
                onLanguageChange={(newLang) => setSearchLanguage(newLang)}
              />

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (onResetSearch && activeSearchQuery) onResetSearch();
                  }}
                  placeholder={
                    searchLanguage === 'ta'
                      ? 'பொருளைத் தேடுங்கள்...'
                      : searchLanguage === 'hi'
                      ? 'सामग्री खोजें...'
                      : 'Search material, location...'
                  }
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-800 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setLocalSearch('');
                      if (onResetSearch) onResetSearch();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
                {showMobileFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Expanded Filter Row: Location, Price Range, Available Qty, Sort */}
          <div
            className={`pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${
              showMobileFilters ? 'block' : 'hidden lg:grid'
            }`}
          >
            {/* Location */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Location (India)
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800 cursor-pointer"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'All' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range (₹/kg) */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Price Range (₹/kg)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
                />
              </div>
            </div>

            {/* Available Quantity */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Min Available Qty (kg)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minAvailableQuantity}
                onChange={(e) => setMinAvailableQuantity(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
              />
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Sort Listings
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>

        </div>

        {/* Active Search Notification */}
        {activeSearchQuery && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Filtering materials matching: <strong>&ldquo;{activeSearchQuery}&rdquo;</strong>
              </span>
            </div>
            {onResetSearch && (
              <button
                onClick={onResetSearch}
                className="font-bold underline hover:text-emerald-900 cursor-pointer"
              >
                View all materials
              </button>
            )}
          </div>
        )}

        {/* Loading State (Requirement 19: "Loading listings...") */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-800 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Loading listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          /* Empty state (Requirement 18: "No matching materials found.") */
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching materials found.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try another material or change your filters. Select &ldquo;All&rdquo; or list a new by-product to get started.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLocation('All');
                setMinPrice('');
                setMaxPrice('');
                setMinAvailableQuantity('');
                setLocalSearch('');
                if (onResetSearch) onResetSearch();
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Requirement 2 & 7: Clean material cards with same image size and aspect ratio */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.map((listing) => {
              const displayImg = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
              const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);

              return (
                <div
                  key={listing.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Card Image: uniform 16:10 aspect ratio */}
                    <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={displayImg}
                        alt={listing.materialName}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = fallbackSvg;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Top Badges: Starter / Demo vs Live */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {listing.isDemo ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100/95 text-amber-900 font-bold text-[10px] tracking-wide border border-amber-300/60 shadow-2xs">
                            Starter / Demo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100/95 text-emerald-950 font-bold text-[10px] tracking-wide border border-emerald-300/60 shadow-2xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live
                          </span>
                        )}
                        
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-medium text-[10px] backdrop-blur-xs">
                          {listing.category}
                        </span>
                      </div>

                      {/* Price Badge in INR ₹ */}
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-white/95 text-emerald-950 font-black text-xs shadow-xs border border-slate-100">
                          {listing.price}
                        </span>
                      </div>
                    </div>

                    {/* Card Content - Requirement 7: Material Name, Category, Available Quantity, Minimum Order Quantity, Price per Unit, Location, Seller, Availability */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base text-slate-950 group-hover:text-emerald-900 transition-colors line-clamp-1">
                          {listing.materialName}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          listing.availability === 'In Demand'
                            ? 'bg-amber-100 text-amber-800'
                            : listing.availability === 'Reserved'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {listing.availability || 'Available'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>

                      {/* Metadata tags */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5" />
                            Available:
                          </span>
                          <span className="font-bold text-slate-800">
                            {listing.quantity} {listing.unit}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Min Order:
                          </span>
                          <span className="font-semibold text-slate-800">
                            1 {listing.unit || 'kg'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            Location:
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {listing.location}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            Seller:
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {listing.sellerName || 'Producer'}
                          </span>
                        </div>

                        {/* Condition / Quality info (Requirement 2) */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            Condition:
                          </span>
                          <span className="font-semibold text-emerald-800 text-[11px] truncate max-w-[150px]">
                            {listing.verificationBadge || listing.purityGrade || 'Inspected Standard'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions (Requirement 2) - View Details and Add to Cart */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onSelectListing(listing)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleAddToCartCard(listing)}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        addedToCartId === listing.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {addedToCartId === listing.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
