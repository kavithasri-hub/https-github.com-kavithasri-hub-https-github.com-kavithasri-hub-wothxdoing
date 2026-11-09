import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Upload, SwitchCamera, Smartphone } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
  onSwitchToFileUpload: () => void;
}

// Convert dataURL directly to File synchronously without risk of canvas clear
const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  onSwitchToFileUpload,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Sync stream to video element whenever stream changes or video element mounts
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        setIsVideoReady(true);
        setIsInitializing(false);
        video.play().catch((playErr) => {
          console.warn('Video auto-play non-critical notice:', playErr);
        });
      };
      // Fallback in case onloadedmetadata already fired
      if (video.readyState >= 2) {
        setIsVideoReady(true);
        setIsInitializing(false);
      }
    }
  }, [stream]);

  // Start camera stream when modal opens or facing mode toggles
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotoUrl(null);
      setCapturedFile(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  const startCamera = async () => {
    setIsInitializing(true);
    setIsVideoReady(false);
    setCameraError(null);
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // Fallback for OverconstrainedError or specific resolution limits
        if (firstErr.name === 'OverconstrainedError' || firstErr.name === 'ConstraintNotSatisfiedError') {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          setIsVideoReady(true);
          setIsInitializing(false);
          video.play().catch((playErr) => {
            console.warn('Video play delayed:', playErr);
          });
        };
      }
      // Safety timeout so user isn't stuck on spinner if metadata event was missed
      setTimeout(() => {
        setIsInitializing(false);
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          setIsVideoReady(true);
        }
      }, 1000);
    } catch (err: any) {
      console.warn('Real-time camera access issue:', err);
      setIsInitializing(false);
      setIsVideoReady(false);
      const errName = err.name || '';

      if (errName === 'NotAllowedError') {
        setCameraError('Live browser camera was denied or blocked by iframe permissions. Tap below to use your device camera directly:');
      } else if (errName === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Tap below to use your device camera:');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('No active webcam detected. You can snap a photo with your phone or upload an image:');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraError('Camera is currently busy or in use by another app. Tap below to use your device camera:');
      } else if (errName === 'SecurityError') {
        setCameraError('Browser security policy blocked the live video feed. Tap below to open device camera:');
      } else {
        setCameraError('Live camera feed could not be started in this environment. Use your device camera directly:');
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current real-time video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const file = dataUrlToFile(dataUrl, `material-snapshot-${Date.now()}.jpg`);

    setCapturedPhotoUrl(dataUrl);
    setCapturedFile(file);

    // Stop video stream after capture to conserve battery
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleConfirmPhoto = () => {
    if (capturedFile) {
      onPhotoCaptured(capturedFile);
      stopCamera();
      onClose();
      return;
    }

    if (capturedPhotoUrl) {
      const file = dataUrlToFile(capturedPhotoUrl, `material-snapshot-${Date.now()}.jpg`);
      onPhotoCaptured(file);
      stopCamera();
      onClose();
    }
  };

  // Handle direct photo capture via device native camera input
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedPhotoUrl(result);
        setCapturedFile(file);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Hidden Native Camera Input with capture="environment" for 100% reliable device camera access */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Real-Time Material Camera
              </h3>
              <p className="text-[11px] text-slate-400">
                Live capture for secondary raw materials, scrap, and circular feedstocks
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-black overflow-hidden flex items-center justify-center">
          
          {capturedPhotoUrl ? (
            /* Frozen captured preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPhotoUrl}
                alt="Captured sample"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-900/90 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Snapshot Ready
              </div>
            </div>
          ) : cameraError ? (
            /* Error display with direct device camera fallback */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-700 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-amber-200 leading-relaxed font-medium">
                {cameraError}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1 w-full">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>Open Device Camera</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                  <span>Retry Stream</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Video Feed */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder targeting crosshair */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-emerald-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 text-emerald-300 text-[10px] font-bold backdrop-blur-xs">
                    {isVideoReady ? 'Material in live frame • Ready' : 'Align material inside frame'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {/* Camera switch toggle button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors backdrop-blur-xs cursor-pointer shadow-md"
                title="Switch Front/Back Camera"
              >
                <SwitchCamera className="w-4 h-4 text-emerald-300" />
              </button>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs text-slate-300 font-medium gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to real-time camera...</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for High-Resolution Frame Grab */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Footer */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPhotoUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="text-xs text-slate-300 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
                  title="Open phone or tablet native camera app"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Device Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                    onSwitchToFileUpload();
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={Boolean(cameraError) || isInitializing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                  <span>Capture Photo</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
