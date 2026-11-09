import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { VERIFIED_MATERIAL_IMAGES } from '../utils/materialImages';

interface HeroProps {
  onExploreMarketplace: () => void;
  onOpenAiSearch?: () => void;
  onSelectMaterial: (materialId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreMarketplace,
  onSelectMaterial,
}) => {
  const spotlightMaterials = [
    {
      id: 'demo-orange-peel',
      name: 'Orange Peel',
      resource: 'Pectin & Bio-Fuel',
      tag: 'Food Processing Waste',
      img: VERIFIED_MATERIAL_IMAGES['Orange Peel'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Orange Peel'].fallback,
    },
    {
      id: 'demo-eggshell',
      name: 'Eggshell',
      resource: 'Bio-CaCO3 & Fertilizer',
      tag: 'Food Processing Waste',
      img: VERIFIED_MATERIAL_IMAGES['Eggshell'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Eggshell'].fallback,
    },
    {
      id: 'demo-coconut-husk',
      name: 'Coconut Husk',
      resource: 'Coir Fiber Substrate',
      tag: 'Agro & Organic',
      img: VERIFIED_MATERIAL_IMAGES['Coconut Husk'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Coconut Husk'].fallback,
    },
    {
      id: 'demo-coconut-shell',
      name: 'Coconut Shell',
      resource: 'Activated Carbon Stock',
      tag: 'Agro & Organic',
      img: VERIFIED_MATERIAL_IMAGES['Coconut Shell'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Coconut Shell'].fallback,
    },
    {
      id: 'demo-paper-waste',
      name: 'Paper Waste',
      resource: 'Recycled Kraft Pulp',
      tag: 'Paper',
      img: VERIFIED_MATERIAL_IMAGES['Paper Waste'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Paper Waste'].fallback,
    },
    {
      id: 'demo-plastic-bottles',
      name: 'Plastic Bottles',
      resource: 'Pure rPET Flakes',
      tag: 'Plastic',
      img: VERIFIED_MATERIAL_IMAGES['Plastic Bottles'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Plastic Bottles'].fallback,
    },
    {
      id: 'demo-metal-scrap',
      name: 'Metal Scrap',
      resource: 'Smelting & Rebar Grade',
      tag: 'Recyclable / Industrial Scrap',
      img: VERIFIED_MATERIAL_IMAGES['Metal Scrap'].url,
      fallback: VERIFIED_MATERIAL_IMAGES['Metal Scrap'].fallback,
    },
  ];

  return (
    <section className="relative overflow-hidden py-6 sm:py-8 border-b border-slate-200/60">
      {/* Subtle organic gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-emerald-100/30 via-emerald-50/10 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Circular Material Transformations
              </h2>
              <p className="text-xs text-slate-500">
                Real-world waste streams converting into industrial inputs
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
              {spotlightMaterials.length} Core Feedstocks
            </span>
          </div>

          {/* Grid of materials */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {spotlightMaterials.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectMaterial(item.id)}
                className="group relative bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-2.5 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer text-left shadow-2xs hover:shadow-xs"
              >
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden mb-2 bg-slate-200">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = item.fallback;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-emerald-800 font-semibold truncate">
                    → {item.resource}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium truncate">
                    {item.tag}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Click any material to view specifications</span>
            <button
              onClick={onExploreMarketplace}
              className="font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
            >
              View all listings <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
