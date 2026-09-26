import React from 'react';
import { ArrowRight, Sparkles, Layers, ArrowUpRight } from 'lucide-react';
import { VERIFIED_MATERIAL_IMAGES } from '../utils/materialImages';

interface HeroProps {
  onExploreMarketplace: () => void;
  onOpenAiSearch: () => void;
  onSelectMaterial: (materialId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreMarketplace,
  onOpenAiSearch,
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
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/60">
      {/* Subtle organic gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/40 via-emerald-50/10 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Label badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              AI-Powered Resource Marketplace
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.08]">
              Where Waste <br className="hidden sm:inline" />
              <span className="text-emerald-800">Finds Value.</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Turn unused materials into valuable resources. Connect generators of agricultural, industrial, and post-consumer by-products with processors seeking raw inputs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreMarketplace}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <Layers className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                Explore Marketplace
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAiSearch}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 text-emerald-700" />
                AI Search
              </button>
            </div>

            {/* Micro Trust Proof */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Real Firestore Database
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Verified Circular Traceability
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Zero Waste to Landfill
              </div>
            </div>
          </div>

          {/* Right Hero Visual Showcase */}
          <div className="lg:col-span-6">
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
                  6 Core Feedstocks
                </span>
              </div>

              {/* 2x3 Grid of materials */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  className="font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1"
                >
                  View all listings <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
