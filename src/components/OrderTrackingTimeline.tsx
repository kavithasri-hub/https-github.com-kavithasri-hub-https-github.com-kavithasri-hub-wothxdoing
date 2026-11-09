import React from 'react';
import { OrderStatus, OrderStatusHistoryItem } from '../types';
import { CheckCircle2, Clock, Truck, Package, ShieldCheck, Check, AlertCircle, MapPin } from 'lucide-react';

interface OrderTrackingTimelineProps {
  currentStatus: OrderStatus;
  timeline?: OrderStatusHistoryItem[];
  expectedDeliveryDate?: string;
}

interface StageConfig {
  key: string;
  label: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}

const STAGES: StageConfig[] = [
  {
    key: 'Order Placed',
    label: 'Order Placed',
    desc: 'Order verified & recorded',
    icon: Clock,
  },
  {
    key: 'Confirmed',
    label: 'Confirmed',
    desc: 'Seller accepted material specifications',
    icon: CheckCircle2,
  },
  {
    key: 'Shipped',
    label: 'Shipped',
    desc: 'Dispatched with logistics carrier',
    icon: Truck,
  },
  {
    key: 'Out for Delivery',
    label: 'Out for Delivery',
    desc: 'Consignment en route to destination',
    icon: MapPin,
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    desc: 'Material received & inspected at facility',
    icon: ShieldCheck,
  },
];

// Helper to determine active step rank (0 to 4)
export const getStatusRank = (status: OrderStatus): number => {
  switch (status) {
    case 'Order Placed':
    case 'REQUESTED':
      return 0;
    case 'Seller Confirmed':
    case 'ACCEPTED':
    case 'Processing':
      return 1;
    case 'Shipped':
      return 2;
    case 'Out for Delivery':
      return 3;
    case 'Delivered':
    case 'Completed':
      return 4;
    case 'Cancelled':
      return -1;
    default:
      return 0;
  }
};

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  currentStatus,
  timeline = [],
  expectedDeliveryDate,
}) => {
  const currentRank = getStatusRank(currentStatus);
  const isCancelled = currentStatus === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>This order was cancelled. No further fulfillment actions pending.</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-950 font-bold uppercase text-[10px]">
          Cancelled
        </span>
      </div>
    );
  }

  // Find matching timeline item for a stage
  const getTimelineItemForStage = (stageIdx: number) => {
    if (!timeline || timeline.length === 0) return null;
    if (stageIdx === 0) {
      return timeline.find((t) => t.status === 'Order Placed' || t.status === 'REQUESTED') || timeline[0];
    }
    if (stageIdx === 1) {
      return timeline.find((t) => t.status === 'Seller Confirmed' || t.status === 'ACCEPTED' || t.status === 'Processing');
    }
    if (stageIdx === 2) {
      return timeline.find((t) => t.status === 'Shipped');
    }
    if (stageIdx === 3) {
      return timeline.find((t) => t.status === 'Out for Delivery');
    }
    if (stageIdx === 4) {
      return timeline.find((t) => t.status === 'Delivered' || t.status === 'Completed');
    }
    return null;
  };

  return (
    <div className="py-2 space-y-4">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between relative px-2">
          {/* Background Connecting Line */}
          <div className="absolute top-5 left-10 right-10 h-1 bg-slate-200 -z-0" />
          
          {/* Active Progress Bar */}
          <div
            className="absolute top-5 left-10 h-1 bg-emerald-600 transition-all duration-500 -z-0"
            style={{
              width: `${Math.min(100, Math.max(0, (currentRank / (STAGES.length - 1)) * 100))}%`,
            }}
          />

          {STAGES.map((stage, idx) => {
            const isDone = currentRank > idx;
            const isCurrent = currentRank === idx;
            const isPending = currentRank < idx;
            const Icon = stage.icon;
            const matchingTimelineItem = getTimelineItemForStage(idx);

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center relative z-10 max-w-[120px]"
              >
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Stage Title */}
                <h5
                  className={`text-xs mt-2.5 font-bold leading-tight ${
                    isCurrent
                      ? 'text-emerald-950 font-black'
                      : isDone
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  {stage.label}
                </h5>

                {/* Status pill / description */}
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {isCurrent ? (
                    <span className="text-emerald-700 font-semibold">In Progress</span>
                  ) : isDone ? (
                    <span className="text-slate-500">Completed</span>
                  ) : (
                    'Pending'
                  )}
                </span>

                {/* Timestamp if recorded */}
                {matchingTimelineItem && (
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                    {new Date(matchingTimelineItem.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-4 pl-1">
        {STAGES.map((stage, idx) => {
          const isDone = currentRank > idx;
          const isCurrent = currentRank === idx;
          const isPending = currentRank < idx;
          const Icon = stage.icon;
          const matchingTimelineItem = getTimelineItemForStage(idx);

          return (
            <div key={stage.key} className="flex items-start gap-3.5 relative">
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-8 left-4 w-0.5 h-10 -z-0 ${
                    currentRank > idx ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              )}

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h5
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-emerald-950 font-black'
                        : isDone
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </h5>
                  {matchingTimelineItem && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(matchingTimelineItem.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
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

