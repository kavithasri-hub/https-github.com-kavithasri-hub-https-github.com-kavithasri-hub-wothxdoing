import React from 'react';
import { Leaf, Recycle, Box, Nut, Sparkles } from 'lucide-react';

interface EnvironmentalImpactCardProps {
  materialName: string;
  category?: string;
  quantity: string | number;
  unit: string;
  orderId?: string;
}

interface ImpactMessageConfig {
  badgeTitle: string;
  headline: string;
  subheadline: string;
  supportingMessage: string;
  iconType: 'recycle' | 'leaf' | 'box' | 'coconut' | 'metal';
  gradientBg: string;
  badgeBg: string;
  textColor: string;
}

export const getEnvironmentalImpactInfo = (
  materialName: string,
  category: string = ''
): ImpactMessageConfig => {
  const normMat = (materialName || '').toLowerCase();
  const normCat = (category || '').toLowerCase();

  // 1. Coconut Shell
  if (normMat.includes('coconut shell') || (normMat.includes('shell') && normMat.includes('coconut'))) {
    return {
      badgeTitle: '🥥 Coconut Shell Reused',
      headline: 'Agricultural By-product Circulation',
      subheadline: 'Bio-carbon & industrial filler reuse',
      supportingMessage: 'Your purchase supports the reuse of a valuable agricultural by-product.',
      iconType: 'coconut',
      gradientBg: 'from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-950',
    };
  }

  // 2. Coconut Husk / Coir
  if (
    normMat.includes('coconut husk') ||
    normMat.includes('coir') ||
    normMat.includes('husk') ||
    normMat.includes('coconut fiber')
  ) {
    return {
      badgeTitle: '🌱 Coconut Husk Reused',
      headline: 'Agro-Fiber Resource Recovery',
      subheadline: 'Horticulture, geotextiles & erosion control',
      supportingMessage: 'Your purchase supports the recovery and reuse of an agricultural by-product.',
      iconType: 'coconut',
      gradientBg: 'from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-950',
    };
  }

  // General Coconut fallback if only "coconut"
  if (normMat.includes('coconut') || normMat.includes('copra')) {
    return {
      badgeTitle: '🥥 Coconut By-product Reused',
      headline: 'Agricultural By-product Circulation',
      subheadline: 'Supporting secondary agro-materials circulation',
      supportingMessage: 'Your purchase supports the reuse of a valuable agricultural by-product.',
      iconType: 'coconut',
      gradientBg: 'from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-950',
    };
  }

  // 3. Orange Peel
  if (normMat.includes('orange peel') || (normMat.includes('orange') && normMat.includes('peel'))) {
    return {
      badgeTitle: '🍊 Orange Peel Reused',
      headline: 'Organic Valorization',
      subheadline: 'Natural pectin, d-limonene & bio-enzymes',
      supportingMessage:
        'Your purchase gives an organic by-product another purpose and supports better resource utilization.',
      iconType: 'leaf',
      gradientBg: 'from-orange-500/10 via-amber-500/10 to-emerald-500/10 border-orange-200/80',
      badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
      textColor: 'text-orange-950',
    };
  }

  // 4. Eggshell
  if (normMat.includes('eggshell') || normMat.includes('egg shell')) {
    return {
      badgeTitle: '🥚 Eggshell Reused',
      headline: 'Bio-Calcium Recovery',
      subheadline: 'Organic soil enrichment & biomaterials',
      supportingMessage:
        'Your purchase helps give eggshell waste another useful purpose instead of treating it as waste.',
      iconType: 'leaf',
      gradientBg: 'from-amber-500/10 via-lime-500/10 to-emerald-500/10 border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-950',
    };
  }

  // 5. Pomegranate Peel
  if (normMat.includes('pomegranate') || (normMat.includes('pom') && normMat.includes('peel'))) {
    return {
      badgeTitle: '♻️ Pomegranate Peel Reused',
      headline: 'Polyphenol & Tannin Recovery',
      subheadline: 'Natural tanning, bio-colorants & organic extracts',
      supportingMessage:
        'Your purchase supports the reuse of an organic by-product and helps keep useful material in circulation.',
      iconType: 'leaf',
      gradientBg: 'from-rose-500/10 via-amber-500/10 to-emerald-500/10 border-rose-200/80',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      textColor: 'text-rose-950',
    };
  }

  // 6. Plastic Waste
  if (
    normMat.includes('plastic') ||
    normMat.includes('pet') ||
    normMat.includes('hdpe') ||
    normMat.includes('ldpe') ||
    normMat.includes('poly') ||
    normCat.includes('plastic')
  ) {
    return {
      badgeTitle: '♻️ Plastic Waste Reused',
      headline: 'Circular Polymer Recovery',
      subheadline: 'Diverting post-industrial & consumer plastics',
      supportingMessage:
        'Your purchase supports plastic recycling and helps keep reusable material away from disposal.',
      iconType: 'recycle',
      gradientBg: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-200/80',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      textColor: 'text-emerald-950',
    };
  }

  // 7. Metal Scrap
  if (
    normMat.includes('metal') ||
    normMat.includes('steel') ||
    normMat.includes('iron') ||
    normMat.includes('copper') ||
    normMat.includes('aluminum') ||
    normMat.includes('scrap') ||
    normCat.includes('metal')
  ) {
    return {
      badgeTitle: '🔩 Metal Scrap Recovered',
      headline: 'Infinitely Recyclable Resource',
      subheadline: 'Direct smelting & closed-loop manufacturing',
      supportingMessage:
        'Your purchase supports metal recovery and recycling, helping keep valuable materials in circulation.',
      iconType: 'metal',
      gradientBg: 'from-slate-500/10 via-emerald-500/10 to-blue-500/10 border-slate-200/90',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      textColor: 'text-slate-900',
    };
  }

  // 8. Paper / Cardboard
  if (
    normMat.includes('paper') ||
    normMat.includes('cardboard') ||
    normMat.includes('carton') ||
    normMat.includes('kraft') ||
    normCat.includes('paper')
  ) {
    return {
      badgeTitle: '📦 Paper & Cardboard Recovered',
      headline: 'Fiber Recovery & Reuse',
      subheadline: 'Preserving pulp and reducing virgin fiber demand',
      supportingMessage:
        'Your purchase supports the recovery and reuse of paper-based materials.',
      iconType: 'box',
      gradientBg: 'from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-amber-200/80',
      badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
      textColor: 'text-amber-950',
    };
  }

  // 9. Banana Peel or other food by-products
  if (
    normMat.includes('peel') ||
    normMat.includes('spent') ||
    normMat.includes('grain') ||
    normMat.includes('food') ||
    normMat.includes('coffee') ||
    normMat.includes('citrus') ||
    normCat.includes('food')
  ) {
    return {
      badgeTitle: '♻️ Food By-product Reused',
      headline: 'Bio-Feedstock Valorization',
      subheadline: 'Nutrient & essential compound recovery',
      supportingMessage:
        'Your purchase helps give this reusable food by-product another purpose instead of treating it as unnecessary waste.',
      iconType: 'leaf',
      gradientBg: 'from-lime-500/10 via-emerald-500/10 to-teal-500/10 border-lime-200/80',
      badgeBg: 'bg-lime-100 text-lime-900 border-lime-300',
      textColor: 'text-lime-950',
    };
  }

  // 10. Agricultural Waste / Crop residues
  if (
    normMat.includes('agricultural') ||
    normMat.includes('straw') ||
    normMat.includes('bagasse') ||
    normMat.includes('biomass') ||
    normMat.includes('agro') ||
    normCat.includes('organic') ||
    normCat.includes('agricultural')
  ) {
    return {
      badgeTitle: '🌱 Agricultural Residue Reused',
      headline: 'Bio-Circular Ecosystem',
      subheadline: 'Preventing crop residue disposal & open burning',
      supportingMessage:
        'Your purchase gives this agricultural by-product another use and supports more efficient resource utilization.',
      iconType: 'leaf',
      gradientBg: 'from-emerald-500/10 via-lime-500/10 to-teal-500/10 border-emerald-200/80',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      textColor: 'text-emerald-950',
    };
  }

  // 11. Other Eligible Materials
  const formattedCategory = category ? `${category} Reused` : 'Material Reused';
  return {
    badgeTitle: `♻️ ${formattedCategory}`,
    headline: 'Secondary Resource Recovery',
    subheadline: 'Responsible circular supply loop',
    supportingMessage:
      'By giving this reusable material a second life, your purchase supports recycling and helps keep recoverable waste in circulation.',
    iconType: 'recycle',
    gradientBg: 'from-emerald-500/10 via-teal-500/10 to-slate-500/10 border-emerald-200/80',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textColor: 'text-emerald-950',
  };
};

export const EnvironmentalImpactCard: React.FC<EnvironmentalImpactCardProps> = ({
  materialName,
  category = '',
  quantity,
  unit,
  orderId,
}) => {
  const impact = getEnvironmentalImpactInfo(materialName, category);

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${impact.gradientBg} p-4 sm:p-5 shadow-xs transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
            {impact.iconType === 'leaf' && <Leaf className="w-5 h-5 text-emerald-600" />}
            {impact.iconType === 'box' && <Box className="w-5 h-5 text-amber-700" />}
            {impact.iconType === 'coconut' && <Nut className="w-5 h-5 text-amber-800" />}
            {impact.iconType === 'metal' && <Sparkles className="w-5 h-5 text-slate-700" />}
            {impact.iconType === 'recycle' && <Recycle className="w-5 h-5 text-emerald-600" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                CIRCULAR SUPPLY COVENANT
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impact.badgeBg}`}
              >
                {impact.badgeTitle}
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mt-0.5">
              ♻️ Your Purchase Makes an Impact
            </h4>
          </div>
        </div>

        {orderId && (
          <span className="hidden sm:inline-block font-mono text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
            {orderId}
          </span>
        )}
      </div>

      <div className="mt-3.5 bg-white/90 backdrop-blur-xs rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="font-black text-sm text-slate-900">
            {quantity} {unit} {materialName}
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Supporting recycling &amp; reuse
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {impact.supportingMessage}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
        <span className="flex items-center gap-1 font-semibold text-emerald-800">
          <Leaf className="w-3 h-3 text-emerald-600" />
          Verified Circular Feedstock Diversion
        </span>
        <span className="font-medium text-[10px] text-slate-400">
          Zero Landfill Procurement Principle
        </span>
      </div>
    </div>
  );
};
