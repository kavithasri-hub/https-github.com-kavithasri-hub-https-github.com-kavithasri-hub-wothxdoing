import React from 'react';
import { Search, PlusCircle, Sparkles, PackageCheck } from 'lucide-react';

interface QuickActionsProps {
  onFindMaterials: () => void;
  onSellMaterials: () => void;
  onAiSearch: () => void;
  onTrackOrders: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onFindMaterials,
  onSellMaterials,
  onAiSearch,
  onTrackOrders,
}) => {
  const actions = [
    {
      icon: Search,
      title: 'Find Materials',
      desc: 'Browse agro, industrial, and post-consumer feedstocks.',
      action: onFindMaterials,
      badge: 'Buyers',
    },
    {
      icon: PlusCircle,
      title: 'Sell Materials',
      desc: 'List your factory or farm by-products directly for sale.',
      action: onSellMaterials,
      badge: 'Sellers',
    },
    {
      icon: Sparkles,
      title: 'AI Search',
      desc: 'Identify materials by photo, name, or chemical properties.',
      action: onAiSearch,
      badge: 'Multimodal',
    },
    {
      icon: PackageCheck,
      title: 'Track Orders',
      desc: 'Monitor deliveries, contracts, and verification status.',
      action: onTrackOrders,
      badge: 'Supply Chain',
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Quick Actions
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Start Your Circular Journey
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {actions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className="group relative text-left p-5 rounded-2xl bg-[#FBFBFA] hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white transition-colors shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-900 px-2 py-0.5 rounded-full transition-colors">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-950 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
