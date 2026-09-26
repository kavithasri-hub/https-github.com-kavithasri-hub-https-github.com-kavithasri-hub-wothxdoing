import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface OrderDeliveryAnimationProps {
  orderId: string;
  materialName: string;
  quantity: string | number;
  unit: string;
  onComplete: () => void;
}

export const OrderDeliveryAnimation: React.FC<OrderDeliveryAnimationProps> = ({
  orderId,
  materialName,
  quantity,
  unit,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'WALKING' | 'DELIVERING' | 'SUCCESS'>('WALKING');

  useEffect(() => {
    // Step 1: Walking with box (0 - 1.2s)
    const t1 = setTimeout(() => {
      setPhase('DELIVERING');
    }, 1200);

    // Step 2: Hand-delivering box & waving (1.2s - 2.2s)
    const t2 = setTimeout(() => {
      setPhase('SUCCESS');
    }, 2200);

    // Step 3: Success checkmark displayed (2.2s - 3.2s), then proceed to confirmed order view
    const t3 = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="w-full py-8 px-4 sm:px-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      {/* Visual Animation Stage */}
      <div className="relative w-full max-w-md h-52 bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 rounded-3xl border border-emerald-100/80 shadow-xs overflow-hidden flex flex-col justify-end p-4">
        
        {/* Sky / Ambient background elements */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-60">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-emerald-800">
            DISPATCH IN PROGRESS • {orderId}
          </span>
        </div>

        {/* Small decorative clouds */}
        <div className="absolute top-7 right-8 w-12 h-4 bg-emerald-100/50 rounded-full blur-[1px]" />
        <div className="absolute top-10 left-12 w-8 h-3 bg-emerald-100/40 rounded-full blur-[1px]" />

        {/* Dotted Delivery Route Path */}
        <div className="absolute bottom-11 left-6 right-16 border-b-2 border-dashed border-emerald-300/80" />

        {/* Destination Doorstep / Delivery Point Marker */}
        <div className="absolute bottom-8 right-6 flex flex-col items-center">
          <div className="w-12 h-1.5 rounded-full bg-emerald-900/15" />
          <div className="text-[9px] font-black uppercase tracking-wider text-emerald-800 mt-1 px-1.5 py-0.5 rounded bg-emerald-100/70 border border-emerald-300/50">
            Delivery Point
          </div>
        </div>

        {/* Character & Order Package Container */}
        <div
          className="absolute bottom-9 left-4 flex items-end transition-all duration-1000 ease-out"
          style={{
            transform:
              phase === 'WALKING'
                ? 'translateX(30px)'
                : 'translateX(min(220px, calc(100% - 150px)))',
          }}
        >
          {/* Friendly Delivery Courier SVG */}
          <div className="relative flex flex-col items-center">
            
            {/* Friendly Courier Character */}
            <svg
              className="w-20 h-28 drop-shadow-sm select-none"
              viewBox="0 0 100 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Delivery Cap */}
              <ellipse cx="50" cy="22" rx="20" ry="8" fill="#064e3b" />
              <path
                d="M32 24 C32 12, 68 12, 68 24 Z"
                fill="#065f46"
              />
              <path
                d="M48 24 L72 26 C75 26, 75 29, 70 30 L48 26 Z"
                fill="#047857"
              />
              <circle cx="50" cy="18" r="3" fill="#a7f3d0" />

              {/* Head / Friendly Face */}
              <circle cx="50" cy="36" r="14" fill="#fde047" />
              {/* Eyes */}
              <circle cx="45" cy="34" r="2" fill="#1e293b" />
              <circle cx="55" cy="34" r="2" fill="#1e293b" />
              {/* Smile */}
              <path
                d="M45 40 Q50 46 55 40"
                stroke="#1e293b"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Rosy cheeks */}
              <circle cx="42" cy="39" r="2" fill="#fca5a5" opacity="0.6" />
              <circle cx="58" cy="39" r="2" fill="#fca5a5" opacity="0.6" />

              {/* Body / Uniform */}
              <path
                d="M36 50 L64 50 L68 85 L32 85 Z"
                fill="#065f46"
                rx="4"
              />
              {/* Uniform details */}
              <line x1="50" y1="50" x2="50" y2="85" stroke="#047857" strokeWidth="2" />
              <circle cx="50" cy="60" r="1.5" fill="#f8fafc" />
              <circle cx="50" cy="70" r="1.5" fill="#f8fafc" />

              {/* Character Left Arm */}
              <path
                d="M36 54 Q28 66 38 74"
                stroke="#064e3b"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Character Right Arm - waves when delivering/success! */}
              {phase === 'WALKING' ? (
                <path
                  d="M64 54 Q72 66 62 74"
                  stroke="#064e3b"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M64 54 Q78 40 82 28"
                  stroke="#064e3b"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="animate-bounce"
                  fill="none"
                />
              )}

              {/* Legs - Walking animation */}
              <g
                className={
                  phase === 'WALKING' ? 'animate-pulse origin-top' : ''
                }
              >
                {/* Left Leg */}
                <line
                  x1="42"
                  y1="85"
                  x2="40"
                  y2="114"
                  stroke="#1e293b"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Left Shoe */}
                <ellipse cx="37" cy="115" rx="7" ry="3.5" fill="#047857" />

                {/* Right Leg */}
                <line
                  x1="58"
                  y1="85"
                  x2="60"
                  y2="114"
                  stroke="#1e293b"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Right Shoe */}
                <ellipse cx="63" cy="115" rx="7" ry="3.5" fill="#047857" />
              </g>
            </svg>

            {/* Customer's Order Box / Package */}
            <div
              className={`absolute transition-all duration-700 ease-out flex flex-col items-center ${
                phase === 'WALKING'
                  ? 'bottom-8 left-11 scale-95'
                  : 'bottom-0 left-20 scale-100 drop-shadow-md'
              }`}
            >
              {/* Package Box */}
              <div className="w-13 h-11 bg-amber-200 border border-amber-400 rounded-md relative shadow-sm flex items-center justify-center">
                {/* Seam tape */}
                <div className="absolute top-0 bottom-0 w-2.5 bg-amber-300/80" />
                <div className="absolute left-0 right-0 h-2 bg-amber-300/60" />
                {/* Sustainable Leaf Icon on the package */}
                <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                  🌱
                </div>
              </div>

              {/* Box Drop Shadow when placed */}
              {phase !== 'WALKING' && (
                <div className="w-14 h-1.5 bg-slate-400/30 rounded-full mt-0.5 animate-in fade-in duration-300" />
              )}
            </div>

            {/* Sparkles / Delivery Burst when placed */}
            {phase !== 'WALKING' && (
              <div className="absolute -top-1 -right-4 flex items-center gap-1 animate-bounce">
                <span className="text-amber-500 text-xs">✨</span>
                <span className="text-emerald-500 text-xs">✨</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Indicator Badges at bottom */}
        <div className="relative z-10 flex items-center justify-center gap-2 pt-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              phase === 'WALKING'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            1. En Route
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              phase === 'DELIVERING'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            2. Hand-Delivering
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              phase === 'SUCCESS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            3. Confirmed
          </span>
        </div>
      </div>

      {/* Text Notification Area */}
      <div className="mt-5 space-y-2">
        {phase === 'SUCCESS' ? (
          <div className="animate-in zoom-in-95 duration-300 space-y-1">
            <div className="inline-flex items-center gap-2 text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>✓ Order Placed Successfully!</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Your order has been confirmed.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {quantity} {unit} of {materialName} is now recorded and secured via ChainCraft protocol.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {phase === 'WALKING'
                  ? 'Courier carrying your material package...'
                  : 'Delivering package to destination...'}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800">
              Processing Circular Procurement
            </h3>
            <p className="text-xs text-slate-500">
              Finalizing digital agreement &amp; environmental registration
            </p>
          </div>
        )}
      </div>

      {/* Skip / Continue Button so user is never blocked */}
      <button
        type="button"
        onClick={onComplete}
        className="mt-4 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
      >
        <span>Continue to Order Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
