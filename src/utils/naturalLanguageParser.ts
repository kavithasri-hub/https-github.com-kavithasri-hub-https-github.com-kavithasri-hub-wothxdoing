// Universal Multilingual NLP Query Parser and Tolerant Search Matching for WORTHX

export interface ParsedQuantity {
  value: number;
  unit: string;
  originalText: string;
}

export interface ParsedQuery {
  originalQuery: string;
  detectedLanguage?: 'English' | 'Tamil' | 'Hindi' | 'Tanglish' | 'Mixed';
  material: string | null;
  canonicalName: string | null;
  quantity: ParsedQuantity | null;
  location: string | null;
  cleanKeywords: string[];
}

export const CANONICAL_MATERIALS = [
  'Coconut Shell',
  'Coconut Husk',
  'Eggshell',
  'Orange Peel',
  'Plastic Bottles',
  'Paper Waste',
  'Banana Peel',
  'Agricultural Waste',
  'Metal Scrap',
] as const;

export type CanonicalMaterial = (typeof CANONICAL_MATERIALS)[number];

// Comprehensive Multilingual (English, Tamil, Hindi, Tanglish) dictionary
export const MULTILINGUAL_SYNONYMS: Record<CanonicalMaterial, string[]> = {
  'Coconut Shell': [
    'coconut shell',
    'coconutshell',
    'coconut-shell',
    'coconut shells',
    'coco shell',
    'endocarp',
    'charcoal shell',
    'activated carbon shell',
    'dried coconut shell',
    'hard shell',
    // Tamil script
    'தேங்காய் ஓடு',
    'தேங்காயோடு',
    'சிரட்டை',
    'தேங்காய் சிரட்டை',
    'கொட்டாங்குச்சி',
    'தேங்காய் கொட்டாங்குச்சி',
    'ஓடு',
    // Tanglish / Transliterated Tamil
    'thengai odu',
    'thenga odu',
    'thenga chirattai',
    'thengai chirattai',
    'chirattai',
    'cirattai',
    'tengai odu',
    'thengai koodu',
    'thengai kottanguchi',
    'thenga kottanguchi',
    'kottanguchi',
    // Hindi & Hinglish
    'नारियल खोल',
    'नारियल का खोल',
    'नारियल कटोरी',
    'नारियल शैल',
    'नारियल छिलका',
    'nariyal shell',
    'nariyal ka khol',
    'nariyal khol',
    'nariyal katori',
    'nariyal chhilka hard',
  ],
  'Coconut Husk': [
    'coconut husk',
    'coconuthusk',
    'coconut-husk',
    'coconut husks',
    'coir',
    'coir fiber',
    'coir fibre',
    'coco peat',
    'cocopeat',
    'raw coir',
    'coconut coir',
    'coconut fiber',
    'coir pith',
    // Tamil script
    'தேங்காய் நார்',
    'தேங்காயின் மட்டை',
    'மட்டை நார்',
    'கயிறு நார்',
    'தேங்காய் மட்டை',
    'மட்டை',
    'நார்',
    // Tanglish
    'thengai naar',
    'thenga naar',
    'thengai mattai',
    'thenga mattai',
    'mattai naar',
    'mattai',
    'thenga fiber',
    'kayiru naar',
    'coir naar',
    // Hindi & Hinglish
    'नारियल जटा',
    'नारियल रेशा',
    'नारियल छिलका',
    'नारियल बाल',
    'nariyal jutta',
    'nariyal rassa',
    'nariyal fiber',
    'nariyal chhilka',
    'nariyal resha',
    'nariyal baal',
  ],
  'Eggshell': [
    'eggshell',
    'egg shell',
    'egg-shell',
    'egg shells',
    'eggshells',
    'eggshell waste',
    'egg shell waste',
    'bio calcium',
    'biocalcium',
    'poultry shell',
    'poultry eggshell',
    // Tamil script
    'முட்டை ஓடு',
    'முட்டையோடு',
    'கோழி முட்டை ஓடு',
    // Tanglish
    'muttai odu',
    'muttai thol',
    'mottai odu',
    'mutta odu',
    // Hindi & Hinglish
    'अंडे का छिलका',
    'अंडे के छिलके',
    'अंडा छिलका',
    'ande ka chilka',
    'ande ka chhilka',
    'ande ke chilke',
    'anda chilka',
    'egg chilka',
  ],
  'Orange Peel': [
    'orange peel',
    'orangepeel',
    'orange-peel',
    'orange peels',
    'citrus rind',
    'citrus peel',
    'citrus waste',
    'lemon peel',
    'orange skin',
    'orange rinds',
    // Tamil script
    'ஆரஞ்சு தோல்',
    'ஆரஞ்சு பழத்தோல்',
    'ஆரஞ்சு பழ தோல்',
    'ஆரஞ்சு',
    'சாத்துக்குடி தோல்',
    'எலுமிச்சை தோல்',
    // Tanglish
    'orange thol',
    'aranju thol',
    'arunchu thol',
    'orange peel',
    'orange skin',
    // Hindi & Hinglish
    'संतरे के छिलके',
    'संतरे का छिलका',
    'संतरा छिलका',
    'संतरा',
    'नारंगी छिलका',
    'santra chhilka',
    'santra chilka',
    'santre ke chilke',
    'santre ke chhilke',
    'santre ka chilka',
    'narangi chhilka',
    'mosambi chilka',
  ],
  'Plastic Bottles': [
    'plastic bottle',
    'plastic bottles',
    'plasticbottle',
    'plastic-bottle',
    'pet bottle',
    'pet bottles',
    'rpet',
    'rpet flakes',
    'plastic container scrap',
    'recycled plastic bottles',
    // Tamil script
    'பிளாஸ்டிக் பாட்டில்',
    'பிளாஸ்டிக் பாட்டில்கள்',
    'பிளாஸ்டிக் கழிவு',
    // Tanglish
    'plastic bottle',
    'plastic bottle-gal',
    'plastic kuppai',
    // Hindi & Hinglish
    'प्लास्टिक की बोतलें',
    'प्लास्टिक बोतल',
    'प्लास्टिक स्क्रैप',
    'plastic botal',
    'plastic bottle scrap',
    'pet botal',
  ],
  'Paper Waste': [
    'paper waste',
    'paperwaste',
    'paper-waste',
    'scrap paper',
    'shredded paper',
    'cardboard',
    'occ cardboard',
    'kraft paper',
    'waste paper',
    // Tamil script
    'காகித கழிவு',
    'பழைய பேப்பர்',
    'அட்டைப்பெட்டி',
    'காகிதம்',
    // Tanglish
    'paper kuppai',
    'palaiya paper',
    'cardboard',
    'attai',
    // Hindi & Hinglish
    'रद्दी कागज',
    'रद्दी कागज़',
    'पुराना कागज',
    'गत्ता',
    'kagaz raddi',
    'raddi kagaz',
    'paper raddi',
    'gatta',
  ],
  'Banana Peel': [
    'banana peel',
    'bananapeel',
    'banana-peel',
    'banana peels',
    'banana skin',
    'banana waste',
    // Tamil script
    'வாழைப்பழ தோல்',
    'வாழைப்பழத்தோல்',
    'வாழைத்தோல்',
    // Tanglish
    'vazhai pazham thol',
    'vazhaithol',
    'vazhai thol',
    'valai thol',
    // Hindi & Hinglish
    'केले का छिलका',
    'केले के छिलके',
    'kela chhilka',
    'kela chilka',
    'kele ke chilke',
  ],
  'Agricultural Waste': [
    'agricultural waste',
    'agro waste',
    'crop residue',
    'paddy straw',
    'sugarcane bagasse',
    'mustard stalk',
    'rice husk',
    'stubble',
    // Tamil script
    'விவசாய கழிவு',
    'வைக்கோல்',
    'கரும்பு சக்கை',
    'நெல் உமி',
    // Tanglish
    'vaikol',
    'karumbu sakkai',
    'vivasaya kazhivu',
    'nellu umi',
    // Hindi & Hinglish
    'कृषि अपशिष्ट',
    'पराली',
    'धान की भूसी',
    'गन्ने की खोई',
    'parali',
    'kisan kachra',
    'paddy kachra',
    'fasal avshesh',
  ],
  'Metal Scrap': [
    'metal scrap',
    'metal',
    'metals',
    'scrap metal',
    'metal waste',
    'industrial metal scrap',
    'steel scrap',
    'aluminium scrap',
    'aluminum scrap',
    'iron scrap',
    'ferrous scrap',
    'non ferrous scrap',
    'non-ferrous scrap',
    'copper scrap',
    'brass scrap',
    'industrial scrap',
    'metal turnings',
    'scrap iron',
    'scrap steel',
    // Tamil script
    'இரும்பு கழிவு',
    'பழைய இரும்பு',
    'உலோக கழிவு',
    'இரும்பு',
    // Tanglish
    'irumbu kuppai',
    'palaiya irumbu',
    'metal kuppai',
    'irumbu',
    // Hindi & Hinglish
    'लोहा स्क्रैप',
    'धातु स्क्रैप',
    'धातु कचरा',
    'पुराना लोहा',
    'लोहे का कबाड़',
    'कबाड़',
    'loha scrap',
    'dhatu scrap',
    'loha raddi',
    'scrap loha',
  ],
};

/**
 * Normalizes text: trims, lowercases, replaces hyphens and symbols with spaces, removes extra whitespace
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text to contiguous alpha-numeric string for space-free comparison
 * e.g. "egg-shell" -> "eggshell", "orange peel" -> "orangepeel"
 */
export function toContiguousString(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF\u0900-\u097F]/g, '');
}

/**
 * Detect language script
 */
export function detectLanguage(text: string): 'Tamil' | 'Hindi' | 'Tanglish' | 'English' {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  const lower = text.toLowerCase();
  const tanglishWords = [
    'thengai', 'thenga', 'chirattai', 'cirattai', 'naar', 'muttai', 'thol', 'vaikol', 'kazhivu',
    'venum', 'enakku', 'enaku', 'thevai', 'kedaikuma', 'kudunga', 'kottanguchi', 'mattai', 'vanganum', 'irukka'
  ];
  if (tanglishWords.some((w) => lower.includes(w))) return 'Tanglish';

  const hinglishWords = [
    'chahiye', 'chilka', 'chhilka', 'nariyal', 'santra', 'santre', 'ande', 'kahan', 'milega', 'mujhe', 'dikhaye', 'kharidna', 'katori', 'khol'
  ];
  if (hinglishWords.some((w) => lower.includes(w))) return 'Hindi';

  return 'English';
}

/**
 * Universal tolerant matching:
 * Supports lowercase, whitespace, punctuation, hyphens, partial words,
 * word-order tolerance, multilingual synonyms, and typo tolerance.
 * Enforces strict material intent: if a material is identified (e.g. Orange Peel),
 * unrelated materials (e.g. Coconut Shell, Eggshell) are strictly excluded.
 */
export function matchListingAgainstQuery(
  listing: {
    materialName: string;
    category: string;
    description?: string;
    location?: string;
    tags?: string[];
    applications?: string[];
  },
  query: string,
  _parsed?: ParsedQuery
): { matched: boolean; priority: number } {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    return { matched: true, priority: 1 };
  }

  const parsedInfo = _parsed || parseNaturalLanguageQuery(query);
  const normName = normalizeSearchText(listing.materialName);
  const contiguousName = toContiguousString(listing.materialName);
  const contiguousQuery = toContiguousString(normQuery);

  // If a specific canonical material was identified in the user query (or AI vision image):
  // Strictly ensure only listings matching that canonical material are returned!
  if (parsedInfo.canonicalName) {
    const targetCanonical = parsedInfo.canonicalName;
    const targetCanonicalLower = targetCanonical.toLowerCase();
    const targetContig = toContiguousString(targetCanonical);

    // Check if this listing is for the target canonical material
    let isListingTarget =
      normName.includes(targetCanonicalLower) ||
      contiguousName.includes(targetContig) ||
      targetCanonicalLower.includes(normName);

    if (!isListingTarget) {
      // Check if listing material name matches any synonym of the target material
      const targetSynonyms = MULTILINGUAL_SYNONYMS[targetCanonical as CanonicalMaterial] || [];
      for (const syn of targetSynonyms) {
        const normSyn = normalizeSearchText(syn);
        const contigSyn = toContiguousString(syn);
        if (normName === normSyn || contiguousName === contigSyn || normName.includes(normSyn)) {
          isListingTarget = true;
          break;
        }
      }
    }

    if (isListingTarget) {
      // Prioritize exact name matches
      const priority = normName === targetCanonicalLower || contiguousName === targetContig ? 100 : 90;
      return { matched: true, priority };
    }

    // Strictly exclude unrelated materials when a clear material intent is present
    return { matched: false, priority: 0 };
  }

  // General flexible matching when no specific canonical material is recognized:
  // 1. Exact match (Priority 100)
  if (normName === normQuery || contiguousName === contiguousQuery) {
    return { matched: true, priority: 100 };
  }

  // 2. Multilingual Synonym Match across dictionary
  for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const canonicalLower = canonical.toLowerCase();
    const isTargetListing = normName.includes(canonicalLower) || contiguousName.includes(toContiguousString(canonical));

    if (isTargetListing) {
      for (const syn of synonyms) {
        const normSyn = normalizeSearchText(syn);
        const contigSyn = toContiguousString(syn);

        if (
          normQuery === normSyn ||
          contiguousQuery === contigSyn ||
          normQuery.includes(normSyn) ||
          normSyn.includes(normQuery)
        ) {
          return { matched: true, priority: 95 };
        }
      }
    }
  }

  const queryTokens = normQuery.split(' ').filter((t) => t.length > 1);

  // 3. Word-order tolerance & All tokens in Material Name (Priority 85)
  // e.g. "shell coconut" or "husk coir"
  const nameMatchesAllTokens = queryTokens.every(
    (token) => normName.includes(token) || contiguousName.includes(token)
  );
  if (nameMatchesAllTokens && queryTokens.length > 0) {
    return { matched: true, priority: 85 };
  }

  // 4. Meaningful tokens in Material Name (Priority 75)
  const nameMatchesTokens = queryTokens.filter(
    (token) => token.length >= 3 && (normName.includes(token) || contiguousName.includes(token))
  );
  if (nameMatchesTokens.length >= Math.ceil(queryTokens.length / 2) && nameMatchesTokens.length > 0) {
    return { matched: true, priority: 75 };
  }

  // 5. Location Match (Priority 50)
  const normLoc = normalizeSearchText(listing.location || '');
  if (queryTokens.some((t) => t.length >= 3 && normLoc.includes(t))) {
    return { matched: true, priority: 50 };
  }

  // 6. Category Match (Priority 40)
  const normCat = normalizeSearchText(listing.category);
  if (normCat.includes(normQuery) || queryTokens.some((t) => t.length >= 4 && normCat.includes(t))) {
    return { matched: true, priority: 40 };
  }

  return { matched: false, priority: 0 };
}

/**
 * Natural Language Parser for conversational queries:
 * Extracts Material intent, Quantity, Location, and detected Language.
 */
export function parseNaturalLanguageQuery(query: string, languageContext?: 'en' | 'ta' | 'hi'): ParsedQuery {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return {
      originalQuery: '',
      material: null,
      canonicalName: null,
      quantity: null,
      location: null,
      cleanKeywords: [],
    };
  }

  const detectedLang = detectLanguage(trimmed);

  // 1. Extract Quantity: e.g. "50 kg", "1,000 kg", "5 tons", "10 tonnes", "100 kgs"
  let parsedQuantity: ParsedQuantity | null = null;
  const quantityRegex =
    /\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|ton|tons|tonne|tonnes|metric\s*tons|mt|quintal|quintals|bales)\b/i;
  const qMatch = trimmed.match(quantityRegex);
  if (qMatch) {
    const rawVal = qMatch[1].replace(/,/g, '');
    const val = parseFloat(rawVal);
    let unit = qMatch[2].toLowerCase();
    if (unit.startsWith('kg') || unit.startsWith('kilo')) unit = 'kg';
    if (unit.startsWith('ton') || unit === 'mt') unit = 'Tons';
    if (unit.startsWith('quint')) unit = 'Quintal';

    parsedQuantity = {
      value: val,
      unit,
      originalText: qMatch[0],
    };
  }

  // 2. Extract Location
  let location: string | null = null;
  const locationPrefixRegex =
    /\b(?:near|in|at|around|close to|located in|from)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i;
  const locMatch = trimmed.match(locationPrefixRegex);
  if (locMatch) {
    const candidate = locMatch[1].trim();
    const candidateLower = candidate.toLowerCase();
    const ignoreList = ['kg', 'material', 'materials', 'feedstock', 'here', 'now', 'nearby', 'good', 'cheap', 'making', 'products'];
    if (!ignoreList.includes(candidateLower)) {
      location = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  if (!location) {
    const knownCities = [
      'Chennai',
      'Coimbatore',
      'Pollachi',
      'Namakkal',
      'Nagpur',
      'Sivakasi',
      'Theni',
      'Thanjavur',
      'Mumbai',
      'Pune',
      'Bengaluru',
      'Bangalore',
      'Hyderabad',
      'Ahmedabad',
      'Madurai',
      'Salem',
      'Tirupur',
    ];
    for (const city of knownCities) {
      const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
      if (cityRegex.test(trimmed)) {
        location = city;
        break;
      }
    }
  }

  // 3. Extract Material Intent through multilingual dictionary and normalization
  // Strip conversational wrappers in English, Tamil, Hindi, Tanglish
  let strippedQuery = trimmed
    .replace(quantityRegex, ' ')
    // English wrappers
    .replace(/\b(show me|i need|i want|want|looking for|find|where can i get|procure|buy|purchase|supplier of|available|cheap|bulk|reusable|waste|feedstock|for making products|for recycling)\b/gi, ' ')
    // Tamil wrappers
    .replace(/(எனக்கு|வேண்டும்|தேவை|வாங்க வேண்டும்|எங்கு கிடைக்கும்|காட்டுங்கள்|பொருட்கள்|கழிவு)/gi, ' ')
    // Tanglish wrappers
    .replace(/\b(enakku|enaku|venum|thevai|kedaikuma|venum nu|irukka|kudunga|paakanum|vanganum)\b/gi, ' ')
    // Hindi wrappers
    .replace(/(मुझे|चाहिए|दिखाइए|कहाँ मिलेगा|खरीदना है|कचरा|अपशिष्ट|सामग्री)/gi, ' ')
    // Hinglish wrappers
    .replace(/\b(mujhe|chahiye|dikhaye|kahan milega|kharidna hai|mangta hai|dikhado)\b/gi, ' ')
    .trim();

  let canonicalName: CanonicalMaterial | null = null;
  let materialMatchStr: string | null = null;

  const normQuery = normalizeSearchText(trimmed);
  const contigQuery = toContiguousString(trimmed);
  const normStripped = normalizeSearchText(strippedQuery);
  const contigStripped = toContiguousString(strippedQuery);

  // Match against all canonical materials and synonyms
  for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const canonicalTyped = canonical as CanonicalMaterial;
    for (const syn of synonyms) {
      const normSyn = normalizeSearchText(syn);
      const contigSyn = toContiguousString(syn);

      if (
        normStripped === normSyn ||
        contigStripped === contigSyn ||
        normQuery === normSyn ||
        contigQuery === contigSyn ||
        normStripped.includes(normSyn) ||
        contigStripped.includes(contigSyn) ||
        normQuery.includes(normSyn) ||
        contigQuery.includes(contigSyn)
      ) {
        canonicalName = canonicalTyped;
        materialMatchStr = syn;
        break;
      }
    }
    if (canonicalName) break;
  }

  // Clean keywords
  const cleanKeywords = (strippedQuery || trimmed)
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return {
    originalQuery: trimmed,
    detectedLanguage: detectedLang,
    material: materialMatchStr || canonicalName,
    canonicalName,
    quantity: parsedQuantity,
    location,
    cleanKeywords,
  };
}

export const calculateQueryRelevance = matchListingAgainstQuery;

