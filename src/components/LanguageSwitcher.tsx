import React from 'react';
import { Globe } from 'lucide-react';

export type SearchLanguage = 'en' | 'ta' | 'hi';

interface LanguageSwitcherProps {
  currentLanguage: SearchLanguage;
  onLanguageChange: (lang: SearchLanguage) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold transition-all ${
        isDark
          ? 'bg-slate-900/90 border border-slate-700 text-slate-300'
          : 'bg-white border border-slate-200/90 text-slate-700 shadow-2xs'
      } ${className}`}
      role="group"
      aria-label="Search Language Selection"
    >
      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold px-1">
        <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Language:</span>
      </div>

      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={() => onLanguageChange('en')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentLanguage === 'en'
              ? 'bg-emerald-900 text-white shadow-xs'
              : isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="English search (supports Tanglish and mixed queries)"
        >
          English
        </button>

        <span className={`px-1 text-xs select-none ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          |
        </span>

        <button
          type="button"
          onClick={() => onLanguageChange('ta')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentLanguage === 'ta'
              ? 'bg-emerald-900 text-white shadow-xs'
              : isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="தமிழ் மொழித் தேடல் (Tamil & Tanglish search)"
        >
          தமிழ்
        </button>

        <span className={`px-1 text-xs select-none ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          |
        </span>

        <button
          type="button"
          onClick={() => onLanguageChange('hi')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentLanguage === 'hi'
              ? 'bg-emerald-900 text-white shadow-xs'
              : isDark
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="हिन्दी खोज (Hindi search)"
        >
          हिन्दी
        </button>
      </div>
    </div>
  );
};
