import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MaterialListing, MaterialCategory } from '../types';
import { getMaterialImageUrl, getCategoryPlaceholderSvg, getPossibleUses } from '../utils/materialImages';
import { parseNaturalLanguageQuery, ParsedQuery, calculateQueryRelevance } from '../utils/naturalLanguageParser';
import { formatINR, parsePriceToNumber, parseQuantityToNumber } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { VoiceSearchModal } from './VoiceSearchModal';
import { LanguageSwitcher, SearchLanguage } from './LanguageSwitcher';
import {
  Sparkles,
  Search,
  Upload,
  Camera,
  Mic,
  MicOff,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Scale,
  DollarSign,
  Layers,
  Info,
  Loader2,
  Check,
  ShoppingCart
} from 'lucide-react';

interface AiSearchPageProps {
  listings: MaterialListing[];
  onSelectListing: (listing: MaterialListing) => void;
  onRequestToBuy: (listing: MaterialListing, desiredQuantity?: number) => void;
  initialQuery?: string;
}

const SUGGESTION_CHIPS = [
  'Coconut Husk',
  'Eggshell',
  'Orange Peel',
  'Coconut Shell',
  'Plastic Bottles',
  'Paper Waste',
  'Metal Scrap',
];

const CATEGORIES: ('All' | MaterialCategory)[] = [
  'All',
  'Agro & Organic',
  'Food Processing Waste',
  'Paper',
  'Plastic',
  'Industrial By-products',
  'Other Reusable Materials',
];

const RECENT_SEARCHES_KEY = 'worthx_recent_searches';

interface AiIdentificationResult {
  isCircularMaterial?: boolean;
  material: string;
  nonMaterialDetected?: string | null;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  possibleUses?: string[];
}

export const AiSearchPage: React.FC<AiSearchPageProps> = ({
  listings,
  onSelectListing,
  onRequestToBuy,
  initialQuery = '',
}) => {
  const { addToCart } = useCart();
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  // Search query states
  const [searchLanguage, setSearchLanguage] = useState<SearchLanguage>('en');
  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [executedQuery, setExecutedQuery] = useState<string>(initialQuery);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(() =>
    initialQuery ? parseNaturalLanguageQuery(initialQuery) : null
  );

  const getSearchPlaceholder = (lang: SearchLanguage) => {
    switch (lang) {
      case 'ta':
        return 'பொருளைத் தேடுங்கள்... (எ.கா. தேங்காய் நார், ஆரஞ்சு தோல், 500 kg)';
      case 'hi':
        return 'सामग्री खोजें... (उदा. संतरे के छिलके, नारियल का खोल, 500 kg)';
      case 'en':
      default:
        return 'Search for a material... (e.g. Orange Peel, Coconut Husk, 500 kg)';
    }
  };

  // Real-time camera & Voice search modals
  const [isRealTimeCameraOpen, setIsRealTimeCameraOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [imageMenuOpen, setImageMenuOpen] = useState<boolean>(false);

  // AI Image Identification states
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<AiIdentificationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Voice Search states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : ['Coconut Husk', 'Eggshell', 'Orange Peel'];
    } catch {
      return ['Coconut Husk', 'Eggshell', 'Orange Peel'];
    }
  });

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<'All' | MaterialCategory>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minAvailableQuantity, setMinAvailableQuantity] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Refs for file uploads
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Save recent search
  const saveSearchTerm = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore quota error
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Synchronize initialQuery changes
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== executedQuery) {
      triggerSearch(initialQuery, searchLanguage);
    }
  }, [initialQuery]);

  // Perform search with language awareness
  const triggerSearch = (queryText: string, lang: SearchLanguage = searchLanguage) => {
    const trimmed = queryText.trim();
    setSearchInput(trimmed);
    setExecutedQuery(trimmed);
    const parsed = parseNaturalLanguageQuery(trimmed, lang);
    setParsedQuery(parsed);
    if (trimmed) {
      saveSearchTerm(trimmed);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchInput, searchLanguage);
  };

  // Handle Image Upload / Camera Capture
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate size (under 12MB)
    if (file.size > 12 * 1024 * 1024) {
      setAiError('Image file is too large. Please select a photo under 10MB.');
      return;
    }

    setLastUploadedFile(file);
    setAiError(null);
    setIsUploadingImage(true);
    setAiResult(null);

    // Read base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadedImagePreview(base64);
      setIsUploadingImage(false);
      setIsAnalyzingImage(true);

      try {
        // Call backend proxy for AI Vision analysis
        const response = await fetch('/api/gemini/identify-material', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (!response.ok) {
          throw new Error('AI identification service returned an error status.');
        }

        const data = await response.json();

        if (data.isCircularMaterial === false || !data.identifiedMaterial || data.identifiedMaterial === 'Unknown') {
          setAiResult({
            isCircularMaterial: false,
            material: 'Unknown',
            nonMaterialDetected: data.nonMaterialDetected || 'Non-Recyclable Object',
            confidence: 'Low',
            reasoning: data.reasoning || 'This photo appears to depict a consumer item rather than a secondary circular or recyclable material.',
            possibleUses: [],
          });
        } else {
          const confidence = (data.confidence as 'High' | 'Medium' | 'Low') || 'Medium';
          const uses = data.possibleUses && data.possibleUses.length > 0 ? data.possibleUses : getPossibleUses(data.identifiedMaterial);

          setAiResult({
            isCircularMaterial: true,
            material: data.identifiedMaterial,
            confidence: confidence,
            reasoning: data.reasoning,
            possibleUses: uses,
          });

          // Enforce Flow: Uploaded Image → AI identifies material → Detected material becomes search query → Search marketplace → Show matching seller listings
          triggerSearch(data.identifiedMaterial);
        }
      } catch (err: any) {
        console.error('AI image identification failed:', err);
        setAiError('Image identification could not be completed. Please try again or continue with text search.');
      } finally {
        setIsAnalyzingImage(false);
      }
    };

    reader.onerror = () => {
      setIsUploadingImage(false);
      setIsAnalyzingImage(false);
      setAiError('Image identification could not be completed. Please try again or continue with text search.');
    };

    reader.readAsDataURL(file);
  };

  const handleTryAgain = () => {
    setAiError(null);
    if (lastUploadedFile) {
      handleImageUpload(lastUploadedFile);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Voice Search Handler
  const handleVoiceSearch = () => {
    setVoiceNotice(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice search is not supported in this browser. Please use text or image search.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setSearchInput(transcript);
          triggerSearch(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone permission denied. Please allow microphone access to use voice search.');
        } else {
          setVoiceNotice('Voice search was interrupted. Please speak clearly or use text search.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceNotice('Voice search is not supported in this browser. Please use text or image search.');
    }
  };

  // Extract unique locations from actual listings
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((item) => {
      if (item.location) {
        // e.g. "Pollachi, Tamil Nadu" -> extract city or full
        const city = item.location.split(',')[0].trim();
        if (city) set.add(city);
      }
    });
    return ['All', ...Array.from(set)];
  }, [listings]);

  // Filter and Sort Listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => {
        // 1. Category Filter
        if (selectedCategory !== 'All') {
          const matchCategory =
            listing.category === selectedCategory ||
            (selectedCategory === 'Industrial By-products' &&
              ((listing.category as string).includes('Industrial') || (listing.category as string).includes('Scrap')));
          if (!matchCategory) {
            return false;
          }
        }

        // 2. Location Filter (from UI dropdown)
        if (selectedLocation !== 'All') {
          const matchLoc = listing.location.toLowerCase().includes(selectedLocation.toLowerCase());
          if (!matchLoc) return false;
        }

        // 3. Price Filter (INR)
        const itemPrice = parsePriceToNumber(listing.price);
        if (minPrice && !isNaN(Number(minPrice))) {
          if (itemPrice < Number(minPrice)) return false;
        }
        if (maxPrice && !isNaN(Number(maxPrice))) {
          if (itemPrice > Number(maxPrice)) return false;
        }

        // 4. Available Quantity Filter
        const itemQty = parseQuantityToNumber(listing.quantity);
        if (minAvailableQuantity && !isNaN(Number(minAvailableQuantity))) {
          if (itemQty < Number(minAvailableQuantity)) return false;
        }

        // 5. Query Filter
        if (!executedQuery.trim()) {
          return true;
        }

        const relevance = calculateQueryRelevance(listing, executedQuery, parsedQuery || undefined);
        return relevance.matched;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return parsePriceToNumber(a.price) - parsePriceToNumber(b.price);
        }
        if (sortBy === 'price-desc') {
          return parsePriceToNumber(b.price) - parsePriceToNumber(a.price);
        }
        // If there's an active query, sort by relevance priority first
        if (executedQuery.trim()) {
          const relA = calculateQueryRelevance(a, executedQuery, parsedQuery || undefined).priority;
          const relB = calculateQueryRelevance(b, executedQuery, parsedQuery || undefined).priority;
          if (relB !== relA) {
            return relB - relA;
          }
        }
        // newest default
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [
    listings,
    executedQuery,
    parsedQuery,
    selectedCategory,
    selectedLocation,
    minPrice,
    maxPrice,
    minAvailableQuantity,
    sortBy,
  ]);

  // Quantity analysis helper for Requirement 9
  const getQuantityFulfillmentStatus = (listing: MaterialListing) => {
    if (!parsedQuery?.quantity) return null;

    const requested = parsedQuery.quantity.value;
    const available = parseQuantityToNumber(listing.quantity);
    const minOrder = parseQuantityToNumber(listing.minimumOrderQuantity || listing.minOrder);

    if (requested > available) {
      return {
        type: 'shortage',
        message: `Only ${listing.quantity} ${listing.unit || 'kg'} is currently available`,
        detail: `(You requested: ${requested} ${parsedQuery.quantity.unit})`,
      };
    }

    if (requested < 1) {
      return {
        type: 'below_min',
        message: 'Minimum purchase quantity is 1 kg',
        detail: `(You requested: ${requested} ${parsedQuery.quantity.unit})`,
      };
    }

    return {
      type: 'fulfilled',
      message: `Can fulfill your ${requested} ${parsedQuery.quantity.unit} request`,
      detail: `(Available: ${listing.quantity} ${listing.unit || 'kg'} • Min: 1 ${listing.unit || 'kg'})`,
    };
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TOP SECTION: AI Material Discovery Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900 text-white text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>AI-Powered Material Discovery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Find Materials with AI
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Search, identify and discover reusable materials.
          </p>
        </div>

        {/* SEARCH CONSOLE CARD */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4">
          
          {/* Header row with search mode and visible Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Multilingual Natural Language Sourcing</span>
            </div>
            <LanguageSwitcher
              currentLanguage={searchLanguage}
              onLanguageChange={(newLang) => {
                setSearchLanguage(newLang);
                if (searchInput.trim()) {
                  triggerSearch(searchInput, newLang);
                }
              }}
            />
          </div>

          {/* Main Search Input Form */}
          <form onSubmit={handleFormSubmit} className="relative flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={getSearchPlaceholder(searchLanguage)}
                className="w-full pl-11 pr-32 py-3.5 sm:py-4 text-sm sm:text-base bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 focus:border-emerald-800 focus:bg-white focus:outline-none placeholder:text-slate-400 transition-all font-medium"
              />

              {/* Clear button inside search input */}
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setExecutedQuery('');
                    setParsedQuery(null);
                  }}
                  className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                  title="Clear input"
                >
                  ✕
                </button>
              )}

              {/* Direct Camera action icon inside search bar */}
              <button
                type="button"
                onClick={() => setIsRealTimeCameraOpen(true)}
                title="Search with Real-time Camera"
                className="absolute right-11 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-emerald-900 hover:bg-slate-100"
              >
                <Camera className="w-4 h-4 text-emerald-800" />
              </button>

              {/* Mic action icon inside search bar */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                title="Open Voice Search with Real-time Microphone"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-emerald-900 hover:bg-slate-100"
              >
                <Mic className="w-4 h-4 text-emerald-800" />
              </button>
            </div>

            {/* Three Actions Required: Image, Voice, Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto relative">
              {/* Image Action button with dropdown for Live Camera or File Upload */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setImageMenuOpen(!imageMenuOpen)}
                  className="w-full sm:w-auto px-4 py-3.5 sm:py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Identify material with Live Camera or Image Upload"
                >
                  <Camera className="w-4 h-4 text-emerald-800" />
                  <span>Image</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {imageMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImageMenuOpen(false);
                        setIsRealTimeCameraOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div>Real-Time Camera</div>
                        <span className="text-[10px] text-slate-400 font-normal">Live video viewfinder</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageMenuOpen(false);
                        cameraInputRef.current?.click();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-800" />
                      <div>
                        <div>Device Camera</div>
                        <span className="text-[10px] text-slate-400 font-normal">Direct mobile/system snap</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div>Upload Image File</div>
                        <span className="text-[10px] text-slate-400 font-normal">Choose from device</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Voice Action button */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800"
                title="Search using Voice Speech Recognition"
              >
                <Mic className="w-4 h-4 text-emerald-800" />
                <span>Voice</span>
              </button>

              {/* Search Action button */}
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3.5 sm:py-4 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 text-emerald-300" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Hidden File and Camera Inputs - accepts JPG, JPEG, PNG, WEBP */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Voice Search Feedback / Error Notice */}
          {voiceNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{voiceNotice}</span>
              </div>
              <button
                onClick={() => setVoiceNotice(null)}
                className="text-amber-800 hover:text-amber-950 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* SUGGESTION CHIPS */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Popular materials:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => triggerSearch(chip)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  executedQuery.toLowerCase().includes(chip.toLowerCase())
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* RECENT SEARCHES LIST */}
          {recentSearches.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 mr-1">
                  <Clock className="w-3 h-3" />
                  Recent:
                </span>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => triggerSearch(term)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <button
                onClick={clearHistory}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear History
              </button>
            </div>
          )}

          {/* UPLOADING STATE FOR IMAGE */}
          {isUploadingImage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold animate-pulse">
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              <span>Uploading image...</span>
            </div>
          )}

          {/* LOADING STATE FOR IMAGE ANALYSIS */}
          {isAnalyzingImage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold animate-pulse">
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              <span>Analyzing image... Identifying visual content and material composition...</span>
            </div>
          )}

          {/* AI IDENTIFICATION RESULT - displays Detected Material, Confidence, Possible Applications, Suggested Search */}
          {aiResult && !isAnalyzingImage && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {uploadedImagePreview && (
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded test sample"
                      className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0 bg-white"
                    />
                  )}
                  <div className="space-y-1.5">
                    {aiResult.isCircularMaterial === false || aiResult.material === 'Unknown' ? (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded-md">
                            Non-Circular Item Detected
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-950">
                            {aiResult.nonMaterialDetected || 'Personal / Consumer Object'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                          {aiResult.reasoning || 'This photo appears to show an everyday consumer object rather than a circular or recyclable feedstock.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            Detected Material:
                          </span>
                          <span className="text-base font-black text-slate-950 px-2.5 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300">
                            {aiResult.material}
                          </span>
                          <span className="text-xs font-bold text-slate-500 ml-2">
                            Confidence:
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              aiResult.confidence === 'High'
                                ? 'bg-emerald-200 text-emerald-950'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {aiResult.confidence}
                          </span>
                        </div>

                        {aiResult.reasoning && (
                          <p className="text-xs text-slate-600">
                            {aiResult.reasoning}
                          </p>
                        )}

                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            Suggested Search:
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerSearch(aiResult.material)}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white cursor-pointer shadow-2xs transition-colors"
                          >
                            {aiResult.material} (Showing matching seller listings below)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => {
                    setAiResult(null);
                    setUploadedImagePreview(null);
                  }}
                  className="self-end sm:self-auto p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  title="Dismiss AI analysis"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Possible Applications */}
              {aiResult.possibleUses && aiResult.possibleUses.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <p className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1.5">
                    Possible Applications:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.possibleUses.map((use, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-200 text-[11px] font-medium text-emerald-900"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action for Unknown AI material */}
              {aiResult.material === 'Unknown' && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      searchInputRef.current?.focus();
                      setAiResult(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Search by Name
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI ERROR BANNER WITH TRY AGAIN BUTTON */}
          {aiError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-medium">{aiError}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => setAiError(null)}
                  className="p-1 text-amber-800 hover:text-amber-950 cursor-pointer font-bold"
                  title="Dismiss error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

        </div>

        {/* SEARCH RESULTS SECTION */}
        <div className="space-y-6">
          
          {/* Header & Status Indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Search Results
                </h2>
                {executedQuery && (
                  <span className="text-sm sm:text-base font-semibold text-emerald-800">
                    — Results for: &ldquo;{executedQuery}&rdquo;
                  </span>
                )}
              </div>

              {/* Requirement 3: Natural Language Structured Parameters Badge */}
              {parsedQuery && (parsedQuery.canonicalName || parsedQuery.quantity || parsedQuery.location) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500 font-semibold">Parsed parameters:</span>
                  {parsedQuery.canonicalName && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 text-xs font-bold border border-emerald-200">
                      Material: {parsedQuery.canonicalName}
                    </span>
                  )}
                  {parsedQuery.quantity && (
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-950 text-xs font-bold border border-sky-200">
                      Quantity: {parsedQuery.quantity.value} {parsedQuery.quantity.unit}
                    </span>
                  )}
                  {parsedQuery.location && (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-950 text-xs font-bold border border-purple-200">
                      Location: {parsedQuery.location}
                    </span>
                  )}
                </div>
              )}

              {/* Separation of AI & Marketplace message (Requirement 5) */}
              {aiResult && aiResult.material !== 'Unknown' && (
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {filteredListings.length > 0
                    ? `${aiResult.material} — ${filteredListings.length} listing${filteredListings.length === 1 ? '' : 's'} found in actual marketplace.`
                    : `No ${aiResult.material} listings are currently available in the marketplace.`}
                </p>
              )}
            </div>

            {/* Mobile Filter Toggle & Sort Dropdown */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
                Filters
                {showMobileFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-xs">
                <span className="text-slate-400 font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* FILTERS BAR (Requirement 8: Category, Location, Price Range, Available Quantity) */}
          <div
            className={`bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4 ${
              showMobileFilters ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Category Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category Filter
                </label>
                {(selectedCategory !== 'All' || selectedLocation !== 'All' || minPrice || maxPrice || minAvailableQuantity) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedLocation('All');
                      setMinPrice('');
                      setMaxPrice('');
                      setMinAvailableQuantity('');
                    }}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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
            </div>

            {/* Filter Inputs Grid: Location, Price Range, Available Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              
              {/* Location selector */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Location (India)
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800 cursor-pointer"
                >
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === 'All' ? 'All Locations' : loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range in INR ₹ */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Price Range (₹/kg)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
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
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-800"
                />
              </div>

            </div>

          </div>

          {/* LISTINGS RESULTS GRID */}
          {filteredListings.length === 0 ? (
            /* EMPTY STATE (Requirement 18) */
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No matching materials found.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Try another material or change your filters. Check suggestion chips like Coconut Husk, Eggshell, or Orange Peel.
              </p>
              <button
                onClick={() => {
                  setSearchInput('');
                  setExecutedQuery('');
                  setParsedQuery(null);
                  setSelectedCategory('All');
                  setSelectedLocation('All');
                  setMinPrice('');
                  setMaxPrice('');
                  setMinAvailableQuantity('');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Clear All & View All Materials
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredListings.map((listing) => {
                const displayImg = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
                const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);
                const qtyStatus = getQuantityFulfillmentStatus(listing);

                return (
                  <div
                    key={listing.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview: Fixed 16:10 aspect ratio, accurate material */}
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

                        {/* Top Badges */}
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

                        {/* Price per Unit Badge in INR ₹ */}
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="px-2.5 py-1 rounded-md bg-white/95 text-emerald-950 font-black text-xs shadow-xs border border-slate-100">
                            {listing.price}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 space-y-2.5">
                        
                        {/* Title & Availability */}
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

                        {/* Quantity-Aware Status Alert (Requirement 9) */}
                        {qtyStatus && (
                          <div
                            className={`p-2 rounded-xl text-[11px] font-semibold flex items-start gap-1.5 ${
                              qtyStatus.type === 'fulfilled'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                                : qtyStatus.type === 'shortage'
                                ? 'bg-rose-50 border border-rose-200 text-rose-900'
                                : 'bg-amber-50 border border-amber-200 text-amber-900'
                            }`}
                          >
                            {qtyStatus.type === 'fulfilled' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span>{qtyStatus.message}</span>
                              <span className="block text-[10px] font-normal opacity-90">{qtyStatus.detail}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>

                        {/* Structured specs */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5" />
                              Available Qty:
                            </span>
                            <span className="font-bold text-slate-800">
                              {listing.quantity} {listing.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Min Order Qty:
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
                            <span className="font-medium text-slate-700 truncate max-w-[160px]">
                              {listing.location}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              Seller:
                            </span>
                            <span className="font-medium text-slate-700 truncate max-w-[160px]">
                              {listing.sellerName || 'Verified Producer'}
                            </span>
                          </div>

                          {/* Condition / Quality info (Requirement 2) */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              Condition:
                            </span>
                            <span className="font-semibold text-emerald-800 text-[11px] truncate max-w-[160px]">
                              {listing.verificationBadge || listing.purityGrade || 'Inspected Standard'}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Card Actions (Requirement 2: View Details & Add to Cart) */}
                    <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => onSelectListing(listing)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        View Details
                      </button>

                      <button
                        onClick={() => {
                          const desired = parsedQuery?.quantity?.value;
                          const res = addToCart(listing, desired);
                          if (res.success) {
                            setAddedToCartId(listing.id);
                            setTimeout(() => setAddedToCartId(null), 2500);
                          }
                        }}
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

      </div>

      {/* Real-time Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isRealTimeCameraOpen}
        onClose={() => setIsRealTimeCameraOpen(false)}
        onPhotoCaptured={(capturedFile) => {
          setIsRealTimeCameraOpen(false);
          handleImageUpload(capturedFile);
        }}
        onSwitchToFileUpload={() => {
          setIsRealTimeCameraOpen(false);
          fileInputRef.current?.click();
        }}
      />

      {/* Real-time Voice Speech Recognition Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialLanguage={searchLanguage}
        onTranscriptReady={(transcript) => {
          setIsVoiceModalOpen(false);
          setSearchInput(transcript);
          triggerSearch(transcript, searchLanguage);
        }}
      />

    </div>
  );
};
