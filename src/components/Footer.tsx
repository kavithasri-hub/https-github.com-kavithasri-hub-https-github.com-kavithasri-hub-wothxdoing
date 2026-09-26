import React from 'react';
import { Recycle, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenLogin,
  onOpenSignup,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold">
                <Recycle className="w-4 h-4 text-emerald-200" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                WORTH<span className="text-emerald-500">X</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium italic">
              &ldquo;Where Waste Finds Value&rdquo;
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI for inclusive digital transformation. Connecting by-product generators with circular industrial processors.
            </p>
          </div>

          {/* Col 2: Marketplace Feeds */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Agro & Organic Waste
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Industrial By-products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Paper, Pulp & Packaging
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Polymers & rPET Flakes
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform & AI */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Platform & AI
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('ai-search')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  AI Multimodal Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  ChainCraft™ Protocol
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Trust & Verification Center
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Real Auth */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Access & Accounts
            </h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={onOpenLogin}
                className="block hover:text-emerald-400 transition-colors"
              >
                Sign In to Dashboard
              </button>
              <button
                onClick={onOpenSignup}
                className="block hover:text-emerald-400 transition-colors"
              >
                Create Seller / Buyer Account
              </button>
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-[11px] text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Firebase Firestore Connected
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} WORTHX Inc. All rights reserved. Zero Waste to Landfill Mission.</p>
          <p className="flex items-center gap-1">
            Built with Firebase & Clean Architecture
          </p>
        </div>
      </div>
    </footer>
  );
};
