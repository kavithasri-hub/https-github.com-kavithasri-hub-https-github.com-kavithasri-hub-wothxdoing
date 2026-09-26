import React from 'react';
import { OrderStatus, OrderStatusHistoryItem } from '../types';
import { CheckCircle2, Clock, Truck, Package, ShieldCheck, Check } from 'lucide-react';

interface OrderTrackingTimelineProps {
  currentStatus: OrderStatus;
  timeline?: OrderStatusHistoryItem[];
}

const STAGES: { key: OrderStatus; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  {
    key: 'Order Placed',
    label: 'Order Placed',
    desc: 'Procurement covenant registered',
    icon: Clock,
  },
  {
    key: 'Seller Confirmed',
    label: 'Seller Confirmed',
    desc: 'Seller accepted material specifications',
    icon: CheckCircle2,
  },
  {
    key: 'Processing',
    label: 'Processing',
    desc: 'Weight verification & packaging',
    icon: Package,
  },
  {
    key: 'Shipped',
    label: 'Shipped',
    desc: 'In transit with freight carrier',
    icon: Truck,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    desc: 'Delivered to buyer facility',
    icon: ShieldCheck,
  },
  {
    key: 'Completed',
    label: 'Completed',
    desc: 'Quality check passed & settled',
    icon: Check,
  },
];

// Helper to determine index of status
const getStatusRank = (status: OrderStatus): number => {
  switch (status) {
    case 'Order Placed':
    case 'REQUESTED':
      return 0;
    case 'Seller Confirmed':
    case 'ACCEPTED':
      return 1;
    case 'Processing':
      return 2;
    case 'Shipped':
      return 3;
    case 'Delivered':
      return 4;
    case 'Completed':
      return 5;
    case 'Cancelled':
      return -1;
    default:
      return 0;
  }
};

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  currentStatus,
  timeline = [],
}) => {
  const currentRank = getStatusRank(currentStatus);
  const isCancelled = currentStatus === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
        <span>This order was cancelled.</span>
        <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-950 font-bold uppercase text-[10px]">
          Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0" />
        {/* Active Progress Bar */}
        <div
          className="absolute top-5 left-6 h-1 bg-emerald-600 transition-all duration-500 -z-0"
          style={{
            width: `${Math.min(100, Math.max(0, (currentRank / (STAGES.length - 1)) * 100))}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isDone = currentRank >= idx;
          const isCurrent = currentRank === idx;
          const Icon = stage.icon;
          const matchingTimelineItem = timeline.find((t) => t.status === stage.key);

          return (
            <div
              key={stage.key}
              className="flex flex-col items-center text-center relative z-10 max-w-[90px]"
            >
              {/* Node Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
                  isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold'
                    : isDone
                    ? 'bg-emerald-900 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Title */}
              <h5
                className={`text-xs font-bold mt-2.5 leading-tight ${
                  isCurrent
                    ? 'text-emerald-950 font-extrabold'
                    : isDone
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </h5>

              {/* Timestamp if present */}
              {matchingTimelineItem && (
                <div className="flex flex-col items-center mt-0.5">
                  <span className="text-[10px] text-slate-400">
                    {new Date(matchingTimelineItem.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  {matchingTimelineItem.hash && (
                    <span className="font-mono text-[9px] text-emerald-800 bg-emerald-50 px-1 rounded truncate max-w-[85px] mt-0.5">
                      #{matchingTimelineItem.hash.slice(0, 6)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-4">
        {STAGES.map((stage, idx) => {
          const isDone = currentRank >= idx;
          const isCurrent = currentRank === idx;
          const Icon = stage.icon;
          const matchingTimelineItem = timeline.find((t) => t.status === stage.key);

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-8 left-4 w-0.5 h-8 -z-0 ${
                    currentRank > idx ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              )}

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                  isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : isDone
                    ? 'bg-emerald-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h5
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-emerald-950 font-extrabold'
                        : isDone
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </h5>
                  {matchingTimelineItem && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(matchingTimelineItem.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
