import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Search, AlertCircle, Sparkles, RefreshCw, Languages } from 'lucide-react';
import { detectLanguage, parseNaturalLanguageQuery } from '../utils/naturalLanguageParser';
import { SearchLanguage } from './LanguageSwitcher';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReady: (transcript: string) => void;
  initialLanguage?: SearchLanguage;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReady,
  initialLanguage = 'en',
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SearchLanguage>(initialLanguage);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedLangLabel, setDetectedLangLabel] = useState<string>('English');
  const [detectedMaterialLabel, setDetectedMaterialLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSelectedLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setErrorMessage(null);
      setDetectedMaterialLabel(null);
      return;
    }

    startListening(selectedLanguage);

    return () => {
      stopListening();
    };
  }, [isOpen, selectedLanguage]);

  const getRecognitionLangCode = (lang: SearchLanguage): string => {
    switch (lang) {
      case 'ta':
        return 'ta-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const stopListening = () => {
    // 1. Clean up real microphone audio stream tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      audioStreamRef.current = null;
    }

    // 2. Clean up SpeechRecognition listeners and stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  const startListening = async (lang: SearchLanguage = selectedLanguage) => {
    setErrorMessage(null);
    setTranscript('');
    setDetectedMaterialLabel(null);

    stopListening();

    // 1. Request real device microphone access via getUserMedia
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStreamRef.current = mediaStream;
    } catch (err: any) {
      console.warn('Real-time microphone access issue:', err);
      const errName = err.name || '';

      if (errName === 'NotAllowedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
      } else if (errName === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission was denied. Please enable microphone permissions in your system settings.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device was detected on your system. Please connect a microphone or use text search.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setErrorMessage('Microphone is currently busy or in use by another application.');
      } else if (errName === 'OverconstrainedError') {
        setErrorMessage('The requested microphone audio constraints are not supported.');
      } else if (errName === 'SecurityError') {
        setErrorMessage('Microphone access was blocked due to browser security restrictions.');
      } else {
        setErrorMessage('Could not initialize microphone. Please check your browser audio settings.');
      }
      setIsListening(false);
      return;
    }

    // 2. Initialize Real Speech Recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech Recognition API is not supported in this browser. Please use the text search bar.'
      );
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getRecognitionLangCode(lang);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          setTranscript(currentText);

          // Real-time language and material detection
          const detected = detectLanguage(currentText);
          setDetectedLangLabel(detected);

          const parsed = parseNaturalLanguageQuery(currentText, lang);
          if (parsed.canonicalName) {
            setDetectedMaterialLabel(parsed.canonicalName);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error || '';
        if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser or use text search.'
          );
          setIsListening(false);
        } else if (errorType === 'audio-capture') {
          setErrorMessage('Audio capture failed. Please check your microphone connection.');
          setIsListening(false);
        } else if (errorType === 'no-speech') {
          // Keep listening silently without failing
        } else if (errorType === 'network') {
          setErrorMessage('Network connection error during speech recognition. Please retry.');
          setIsListening(false);
        } else {
          setErrorMessage('Voice input was interrupted. Please speak clearly or click Retry.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Only set listening to false if modal is still open or recognition ended naturally
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Voice recognition initialization notice:', err);
      setIsListening(false);
      setErrorMessage('Voice input could not start. Please retry or use text search.');
    }
  };

  const handleLanguageToggle = (lang: SearchLanguage) => {
    setSelectedLanguage(lang);
    stopListening();
  };

  const handleSubmit = () => {
    stopListening();
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-6 sm:p-8 flex flex-col items-center text-center text-white space-y-5 cursor-default"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close voice search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Multilingual Voice Search
          </div>
          <h3 className="text-xl font-black text-white">
            {isListening ? 'Listening in real-time...' : 'Voice Search'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Speak in English, Tamil (தமிழ்), Hindi (हिन्दी), or Tanglish.
          </p>
        </div>

        {/* Language selector in voice search */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
          <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1">
            <Languages className="w-3 h-3 text-emerald-400" />
            Language:
          </span>
          <button
            type="button"
            onClick={() => handleLanguageToggle('en')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedLanguage === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={() => handleLanguageToggle('ta')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedLanguage === 'ta' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            தமிழ்
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={() => handleLanguageToggle('hi')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedLanguage === 'hi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            हिन्दी
          </button>
        </div>

        {/* Visual Pulse / Equalizer Animation */}
        <div className="relative flex items-center justify-center my-2">
          {isListening && (
            <>
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="absolute w-32 h-32 rounded-full bg-emerald-500/10 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              else startListening(selectedLanguage);
            }}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isListening ? 'Click to pause' : 'Click to start speaking'}
          >
            {isListening ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
          </button>
        </div>

        {/* Live Transcript Display */}
        <div className="w-full min-h-[76px] p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center space-y-1.5">
          {transcript ? (
            <>
              <p className="text-sm sm:text-base font-extrabold text-white text-center leading-relaxed">
                &ldquo;{transcript}&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-emerald-300 font-semibold">
                  Detected: {detectedLangLabel}
                </span>
                {detectedMaterialLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                    Intent: {detectedMaterialLabel}
                  </span>
                )}
              </div>
            </>
          ) : isListening ? (
            <p className="text-xs text-slate-400 italic animate-pulse">
              Listening... Speak a material (e.g. &ldquo;orange peel venum&rdquo; or &ldquo;coconut husk&rdquo;)
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Click the microphone button to speak.
            </p>
          )}
        </div>

        {/* Error message with Retry and fallback */}
        {errorMessage && (
          <div className="w-full p-3 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-200 text-xs flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => startListening(selectedLanguage)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  onClose();
                }}
                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                Use Text Search Instead
              </button>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="w-full flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!transcript.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search {detectedMaterialLabel ? detectedMaterialLabel : 'Query'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
