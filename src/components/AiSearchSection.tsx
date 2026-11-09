import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Camera,
  Mic,
  MicOff,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';
import { getPossibleUses } from '../utils/materialImages';
import { CameraCaptureModal } from './CameraCaptureModal';
import { VoiceSearchModal } from './VoiceSearchModal';
import { LanguageSwitcher, SearchLanguage } from './LanguageSwitcher';

interface AiSearchSectionProps {
  onSearchSubmit: (query: string) => void;
  onOpenDetailedSearch?: () => void;
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

export const AiSearchSection: React.FC<AiSearchSectionProps> = ({
  onSearchSubmit,
  onOpenDetailedSearch,
}) => {
  const [searchLanguage, setSearchLanguage] = useState<SearchLanguage>('en');
  const [searchInput, setSearchInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiIdentified, setAiIdentified] = useState<{
    isCircularMaterial?: boolean;
    material: string;
    nonMaterialDetected?: string | null;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning?: string;
    possibleUses: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time camera & voice modals
  const [isRealTimeCameraOpen, setIsRealTimeCameraOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);

  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onSearchSubmit(searchInput.trim());
  };

  const handleImageFile = async (file: File) => {
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select a photo under 10MB.');
      return;
    }

    setLastUploadedFile(file);
    setErrorMessage(null);
    setIsUploading(true);
    setAiIdentified(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setImageFileName(file.name);
      setIsUploading(false);
      setIsAnalyzing(true);

      try {
        const response = await fetch('/api/gemini/identify-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (!response.ok) {
          throw new Error('AI analysis service returned an error status');
        }

        const data = await response.json();

        if (data.isCircularMaterial === false || !data.identifiedMaterial || data.identifiedMaterial === 'Unknown') {
          setAiIdentified({
            isCircularMaterial: false,
            material: 'Unknown',
            nonMaterialDetected: data.nonMaterialDetected || 'Non-Recyclable Object',
            confidence: 'Low',
            reasoning: data.reasoning || 'This photo appears to show a consumer or personal object rather than a circular recyclable material.',
            possibleUses: [],
          });
        } else {
          const confidence = (data.confidence as any) || 'Medium';
          const uses = data.possibleUses && data.possibleUses.length > 0 ? data.possibleUses : getPossibleUses(data.identifiedMaterial);

          setAiIdentified({
            isCircularMaterial: true,
            material: data.identifiedMaterial,
            confidence,
            reasoning: data.reasoning,
            possibleUses: uses,
          });

          setSearchInput(data.identifiedMaterial);
          // Flow: Uploaded Image → AI identifies material → Detected material becomes search query → Search marketplace → Show matching seller listings
          onSearchSubmit(data.identifiedMaterial);
        }
      } catch (err) {
        console.error('AI image identification failed:', err);
        setErrorMessage('Image identification could not be completed. Please try again or continue with text search.');
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setIsAnalyzing(false);
      setErrorMessage('Image identification could not be completed. Please try again or continue with text search.');
    };

    reader.readAsDataURL(file);
  };

  const handleTryAgain = () => {
    setErrorMessage(null);
    if (lastUploadedFile) {
      handleImageFile(lastUploadedFile);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVoiceClick = () => {
    setErrorMessage(null);
    setIsVoiceModalOpen(true);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageFileName(null);
    setAiIdentified(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <section id="ai-search" className="py-12 sm:py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-800/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        
        {/* Header - Requirements 1: "Find Materials with AI" & "Search, identify and discover reusable materials." */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI Resource Discovery
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Find Materials with AI
          </h2>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-normal">
            Search, identify and discover reusable materials.
          </p>
        </div>

        {/* Search & Action Console */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl space-y-4">
          
          {/* Top header row with Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-700/70">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multilingual Sourcing:</span>
            </div>
            <LanguageSwitcher
              theme="dark"
              currentLanguage={searchLanguage}
              onLanguageChange={(newLang) => setSearchLanguage(newLang)}
            />
          </div>

          {/* Main Search Input Form (Placeholder: "Search for a material...") */}
          <form onSubmit={handleTextSearch} className="relative flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  searchLanguage === 'ta'
                    ? 'பொருளைத் தேடுங்கள்... (எ.கா. தேங்காய் நார், ஆரஞ்சு தோல்)'
                    : searchLanguage === 'hi'
                    ? 'सामग्री खोजें... (उदा. संतरे के छिलके, नारियल का खोल)'
                    : 'Search for a material... (e.g. Orange Peel, Coconut Husk)'
                }
                className="w-full pl-11 pr-24 py-3.5 sm:py-4 text-sm sm:text-base bg-slate-900/90 text-white rounded-2xl border border-slate-700 focus:border-emerald-500 focus:outline-none placeholder:text-slate-500 transition-colors font-medium"
              />
              
              {/* Direct Camera button inside input */}
              <button
                type="button"
                onClick={() => setIsRealTimeCameraOpen(true)}
                title="Search with Real-time Camera"
                className="absolute right-10 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Voice icon inside input */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                title="Voice Search with Microphone"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Three actions: Image, Voice, Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto relative">
              {/* Image action with live camera option */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setImageMenuOpen(!imageMenuOpen)}
                  className="w-full sm:w-auto px-4 py-3.5 sm:py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Identify material with Live Camera or Image Upload"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Image</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {imageMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-1.5 z-30 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImageMenuOpen(false);
                        setIsRealTimeCameraOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
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
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 text-emerald-300" />
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
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div>Upload Image File</div>
                        <span className="text-[10px] text-slate-400 font-normal">Choose from device</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Voice action */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-700 hover:bg-slate-600 text-white"
                title="Search using Voice Speech Recognition"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Voice</span>
              </button>

              {/* Search action */}
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
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
              if (file) handleImageFile(file);
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
              if (file) handleImageFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Suggestion Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs border-t border-slate-700/60">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Suggestion chips:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSearchInput(chip);
                  onSearchSubmit(chip);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/80 hover:text-emerald-300 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Uploading State */}
          {isUploading && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl flex items-center justify-center gap-2.5 text-emerald-300 text-xs font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Uploading image...</span>
            </div>
          )}

          {/* Analyzing Loading State */}
          {isAnalyzing && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl flex items-center justify-center gap-2.5 text-emerald-300 text-xs font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing image... Identifying visual content and material composition...</span>
            </div>
          )}

          {/* AI Identified Card - displays Detected Material, Confidence, Possible Applications, Suggested Search */}
          {aiIdentified && !isAnalyzing && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Sample"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950"
                    />
                  )}
                  <div className="space-y-1">
                    {aiIdentified.isCircularMaterial === false || aiIdentified.material === 'Unknown' ? (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                            Non-Circular Item Detected
                          </span>
                          <span className="text-sm font-extrabold text-white">
                            {aiIdentified.nonMaterialDetected || 'Non-Recyclable Object'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {aiIdentified.reasoning || 'This photo appears to show an everyday consumer object rather than a circular recyclable material.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            Detected Material:
                          </span>
                          <span className="text-base font-black text-white px-2.5 py-0.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300">
                            {aiIdentified.material}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-2">
                            Confidence:
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
                              aiIdentified.confidence === 'High'
                                ? 'bg-emerald-900 text-emerald-200'
                                : 'bg-amber-900 text-amber-200'
                            }`}
                          >
                            {aiIdentified.confidence}
                          </span>
                        </div>

                        {aiIdentified.reasoning && (
                          <p className="text-xs text-slate-300 mt-1">
                            {aiIdentified.reasoning}
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            Suggested Search:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchInput(aiIdentified.material);
                              onSearchSubmit(aiIdentified.material);
                            }}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer transition-colors shadow-2xs"
                          >
                            {aiIdentified.material} (View Marketplace Listings →)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={clearImage}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Possible Applications */}
              {aiIdentified.possibleUses && aiIdentified.possibleUses.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-400 font-bold block mb-1">
                    Possible Applications:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiIdentified.possibleUses.map((use, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300 font-medium"
                      >
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message with Try Again Button */}
          {errorMessage && (
            <div className="p-3.5 bg-amber-950/70 border border-amber-800 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 text-amber-300 hover:text-white cursor-pointer"
                  title="Dismiss error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Link to dedicated full-page AI Search console */}
          {onOpenDetailedSearch && (
            <div className="text-center pt-1">
              <button
                onClick={onOpenDetailedSearch}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 cursor-pointer"
              >
                Open Advanced AI Search Studio →
              </button>
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
          handleImageFile(capturedFile);
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
        onTranscriptReady={(spokenTranscript) => {
          setIsVoiceModalOpen(false);
          setSearchInput(spokenTranscript);
          onSearchSubmit(spokenTranscript);
        }}
      />

    </section>
  );
};
