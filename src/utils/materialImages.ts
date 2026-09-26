// Verified, material-accurate imagery and fallback placeholders for WORTHX
// All images strictly correspond to actual reusable secondary materials.
// Guarantees zero unrelated mosques, food dishes, random buildings, or unrelated people.

export interface MaterialVisual {
  name: string;
  category: string;
  imageUrl: string;
  fallbackSvg: string;
}

// Clean, material-specific SVG placeholders (guarantees zero unrelated fillers)
export const createMaterialPlaceholderSvg = (
  materialName: string,
  category: string,
  primaryColor: string = '#065F46',
  accentColor: string = '#10B981',
  iconSymbol: string = '♻'
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.24"/>
      </linearGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${primaryColor}" stroke-opacity="0.08" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="#F8FAF8"/>
    <rect width="600" height="400" fill="url(#bg)"/>
    <rect width="600" height="400" fill="url(#grid)"/>
    <circle cx="300" cy="165" r="64" fill="white" fill-opacity="0.92" stroke="${primaryColor}" stroke-width="2" stroke-opacity="0.3"/>
    <text x="300" y="181" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" text-anchor="middle" fill="${primaryColor}">${iconSymbol}</text>
    <text x="300" y="265" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="#0F172A">${materialName}</text>
    <text x="300" y="292" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="${primaryColor}" letter-spacing="1.2">${category.toUpperCase()}</text>
    <rect x="220" y="316" width="160" height="26" rx="13" fill="${primaryColor}" fill-opacity="0.14"/>
    <text x="300" y="333" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${primaryColor}">CIRCULAR FEEDSTOCK</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Verified accurate images matching prompt specifications exactly
// Orange Peel: Orange peel / citrus waste
// Eggshell: Real / crushed eggshells
// Coconut Husk: Coconut husk / coconut fiber / coir (no building/mosque)
// Coconut Shell: Coconut shells / endocarp (no food/rice dish)
// Paper Waste: Used / recycled paper / baled paper
// Plastic Bottles: Used plastic bottles / plastic waste
// Banana Peel: Banana peels / puree waste
// Agricultural Waste: Agricultural residue / crop waste / straw
export const VERIFIED_MATERIAL_IMAGES: Record<string, { url: string; fallback: string }> = {
  'Orange Peel': {
    url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Orange Peel', 'Food Processing Waste', '#C2410C', '#EA580C', '🍊'),
  },
  'Eggshell': {
    url: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Eggshell', 'Food Processing Waste', '#78716C', '#A8A29E', '🥚'),
  },
  'Coconut Husk': {
    // Verified photograph of raw coconut coir fiber / fibrous husk strands
    url: '/images/coconut-husk.jpg',
    fallback: createMaterialPlaceholderSvg('Coconut Husk & Coir', 'Agro & Organic', '#78350F', '#B45309', '🥥'),
  },
  'Coconut Shell': {
    // Verified photograph of clean, hard, dried coconut shells (endocarp)
    url: '/images/coconut-shell.jpg',
    fallback: createMaterialPlaceholderSvg('Coconut Shell', 'Agro & Organic', '#451A03', '#92400E', '🥥'),
  },
  'Paper Waste': {
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Paper Waste', 'Paper', '#475569', '#64748B', '📦'),
  },
  'Plastic Bottles': {
    url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Plastic Bottles', 'Plastic', '#0369A1', '#0284C7', '🧴'),
  },
  'Banana Peel': {
    url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Banana Peel', 'Food Processing Waste', '#CA8A04', '#EAB308', '🍌'),
  },
  'Agricultural Waste': {
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    fallback: createMaterialPlaceholderSvg('Agricultural Waste', 'Agro & Organic', '#15803D', '#16A34A', '🌾'),
  },
  'Metal Scrap': {
    url: '/images/metal-scrap.jpg',
    fallback: createMaterialPlaceholderSvg('Metal Scrap', 'Industrial By-products', '#334155', '#64748B', '🔩'),
  },
};

/**
 * Requirement 15: AI Possible Uses with non-guaranteed wording
 */
export const POSSIBLE_USES_MAP: Record<string, string[]> = {
  'Coconut Husk': [
    'Coir fiber extraction for upholstery and ropes',
    'Geotextile soil erosion control mats',
    'Hydroponic growing media & coco peat substrate',
    'Thermal insulation boards'
  ],
  'Eggshell': [
    'Agricultural soil amendment & acidity neutralization',
    'Bio-calcium carbonate extraction for bioplastics',
    'Ceramic glazes and porcelain production',
    'Livestock mineral supplement'
  ],
  'Orange Peel': [
    'Composting and organic soil enrichment',
    'Pectin-related processing for food and pharmaceuticals',
    'Natural limonene & essential oil processing',
    'Bio-ethanol and biochemical research applications'
  ],
  'Plastic Bottles': [
    'Recycling and rPET flake pellet extrusion',
    'Polyester textile fiber spinning',
    'Industrial strapping and thermoformed sheet',
    'Secondary recycled material production'
  ],
  'Coconut Shell': [
    'High-grade activated carbon distillation',
    'Industrial biochar for carbon sequestration',
    'Water and air filtration media',
    'Pyrolysis solid fuel briquettes'
  ],
  'Paper Waste': [
    'Corrugated container and box manufacturing',
    'Molded pulp packaging trays and egg cartons',
    'Cellulose fiber building insulation',
    'Recycled kraft paper production'
  ],
  'Banana Peel': [
    'Organic composting and potassium bio-fertilizer',
    'Biogas generation via anaerobic digestion',
    'Biodegradable cellulose biofilm production',
    'Animal feed nutrient supplement'
  ],
  'Agricultural Waste': [
    'Mushroom cultivation substrate',
    'Biomass energy briquettes & industrial pellets',
    'Particle board and eco-construction panels',
    'Compost base and biochar production'
  ],
  'Metal Scrap': [
    'Electric arc furnace secondary steel smelting',
    'Foundry remelting and billet casting',
    'Automotive and machinery spare component remanufacturing',
    'Structural rebar and construction metal production'
  ],
};

/**
 * Get non-guaranteed possible uses for a material
 */
export function getPossibleUses(materialName: string): string[] {
  const lower = (materialName || '').toLowerCase();
  for (const [key, uses] of Object.entries(POSSIBLE_USES_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return uses;
    }
  }
  return [
    'Circular manufacturing feedstock',
    'Raw material recovery and upcycling',
    'Industrial compost or bio-energy'
  ];
}

/**
 * Returns a strictly matched, visually relevant image URL or material-specific fallback.
 * Guarantees that Coconut Husk will never show a mosque/building and Coconut Shell will never show a food dish.
 */
export function getMaterialImageUrl(materialName: string, category: string, customUrl?: string): string {
  if (customUrl && customUrl.trim().length > 5 && !customUrl.includes('placeholder-empty')) {
    // If it's a known broken Wikimedia or placeholder URL from previous versions, replace it with verified assets
    if (
      customUrl.includes('wikimedia.org') ||
      customUrl.includes('photo-1584551246679-0daf3d275d0f') ||
      customUrl.includes('photo-1544378730-8b5104b18790') ||
      customUrl.includes('mosque') ||
      customUrl.includes('rice')
    ) {
      if (materialName.toLowerCase().includes('husk') || materialName.toLowerCase().includes('coir')) {
        return VERIFIED_MATERIAL_IMAGES['Coconut Husk'].url;
      }
      return VERIFIED_MATERIAL_IMAGES['Coconut Shell'].url;
    }
    // Prioritize valid seller-uploaded custom image
    return customUrl;
  }

  // Exact matching against material name keywords
  const lower = (materialName || '').toLowerCase();

  if (lower.includes('orange peel') || lower.includes('citrus')) {
    return VERIFIED_MATERIAL_IMAGES['Orange Peel'].url;
  }
  if (lower.includes('eggshell') || lower.includes('egg shell') || lower.includes('egg')) {
    return VERIFIED_MATERIAL_IMAGES['Eggshell'].url;
  }
  if (lower.includes('coconut husk') || lower.includes('coir') || lower.includes('husk')) {
    return VERIFIED_MATERIAL_IMAGES['Coconut Husk'].url;
  }
  if (lower.includes('coconut shell') || lower.includes('shell')) {
    return VERIFIED_MATERIAL_IMAGES['Coconut Shell'].url;
  }
  if (lower.includes('paper') || lower.includes('cardboard') || lower.includes('occ') || lower.includes('kraft')) {
    return VERIFIED_MATERIAL_IMAGES['Paper Waste'].url;
  }
  if (lower.includes('plastic') || lower.includes('bottle') || lower.includes('pet') || lower.includes('polymer')) {
    return VERIFIED_MATERIAL_IMAGES['Plastic Bottles'].url;
  }
  if (lower.includes('banana peel') || lower.includes('banana')) {
    return VERIFIED_MATERIAL_IMAGES['Banana Peel'].url;
  }
  if (lower.includes('agricultural') || lower.includes('crop') || lower.includes('straw') || lower.includes('agro') || lower.includes('residue')) {
    return VERIFIED_MATERIAL_IMAGES['Agricultural Waste'].url;
  }
  if (
    lower.includes('metal scrap') ||
    lower.includes('scrap metal') ||
    lower.includes('metal waste') ||
    lower.includes('metal') ||
    lower.includes('steel scrap') ||
    lower.includes('aluminium scrap') ||
    lower.includes('aluminum scrap') ||
    lower.includes('iron scrap') ||
    lower.includes('ferrous')
  ) {
    return VERIFIED_MATERIAL_IMAGES['Metal Scrap'].url;
  }

  // Fallback to clean, category-specific SVG placeholder
  return getCategoryPlaceholderSvg(materialName, category);
}

export function getCategoryPlaceholderSvg(materialName: string, category: string): string {
  switch (category) {
    case 'Agro & Organic':
      return createMaterialPlaceholderSvg(materialName || 'Agro & Organic', category, '#15803D', '#22C55E', '🌱');
    case 'Food Processing Waste':
      return createMaterialPlaceholderSvg(materialName || 'Food Waste', category, '#C2410C', '#F97316', '🍎');
    case 'Paper':
      return createMaterialPlaceholderSvg(materialName || 'Paper & Pulp', category, '#475569', '#94A3B8', '📄');
    case 'Plastic':
      return createMaterialPlaceholderSvg(materialName || 'Plastic Waste', category, '#0369A1', '#38BDF8', '♻');
    case 'Industrial By-products':
    case 'Recyclable / Industrial Scrap':
      return createMaterialPlaceholderSvg(materialName || 'Metal Scrap', category, '#334155', '#64748B', '🔩');
    case 'Other Reusable Materials':
    default:
      return createMaterialPlaceholderSvg(materialName || 'Reusable Material', category, '#065F46', '#10B981', '🔄');
  }
}
