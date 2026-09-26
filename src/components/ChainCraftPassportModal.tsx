import React, { useState } from 'react';
import { ChainCraftPassport, DigitalAgreement } from '../types';
import { formatINR } from '../utils/currency';
import {
  ShieldCheck,
  X,
  Hash,
  Clock,
  CheckCircle2,
  FileCheck,
  Truck,
  Package,
  Layers,
  Building2,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ChainCraftPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: ChainCraftPassport | null;
  agreement?: DigitalAgreement | null;
}

function formatAgreementDateTime(timestamp?: string): string {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

export const ChainCraftPassportModal: React.FC<ChainCraftPassportModalProps> = ({
  isOpen,
  onClose,
  passport,
  agreement,
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'lifecycle' | 'agreement'>('passport');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen || !passport) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {passport.passportId}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-slate-950">
                  {passport.verificationStatus}
                </span>
              </div>
              <h3 className="font-black text-lg sm:text-xl text-white mt-0.5">
                ChainCraft™ Resource Passport
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <button
            onClick={() => setActiveTab('passport')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'passport'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Resource Passport
          </button>

          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lifecycle'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            SHA-256 Event Chain ({passport.events.length})
          </button>

          {agreement && (
            <button
              onClick={() => setActiveTab('agreement')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'agreement'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Digital Agreement
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          
          {/* TAB 1: Resource Passport Overview */}
          {activeTab === 'passport' && (
            <div className="space-y-6">
              
              {/* Material & Provenance Overview Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Verified Material Feedstock
                    </span>
                    <h4 className="text-xl font-black text-slate-900">
                      {passport.materialName}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 font-extrabold text-xs">
                    {passport.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Registered Batch Qty</span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                      {passport.quantity} {passport.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Verified Producer</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {passport.sellerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Current State</span>
                    <span className="font-bold text-emerald-900 mt-0.5 block">
                      {passport.lifecycleStatus}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Registered On</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {new Date(passport.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Integrity Box */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                      Latest Tamper-Evident SHA-256 Digest
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(passport.latestHash)}
                    className="p-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy full SHA-256 hash"
                  >
                    {copiedHash === passport.latestHash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy Hash</span>
                      </>
                    )}
                  </button>
                </div>

                <code className="block p-3 rounded-xl bg-black/60 font-mono text-xs text-emerald-300 break-all border border-emerald-900/60 selection:bg-emerald-700 selection:text-white">
                  {passport.latestHash}
                </code>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generated deterministically from material quantity, physical origin, and lifecycle state. Ensures mathematical verification that records cannot be altered retroactively.
                </p>
              </div>

              {/* Order / Agreement Link if associated */}
              {passport.orderId && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Associated Order:</span>
                    <strong className="text-slate-900 font-mono text-sm">{passport.orderId}</strong>
                  </div>
                  {passport.agreementId && (
                    <button
                      onClick={() => setActiveTab('agreement')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 cursor-pointer"
                    >
                      View Agreement →
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SHA-256 Lifecycle Event Chain */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Chain of Custody Events
                  </h4>
                  <p className="text-xs text-slate-500">
                    Chronological verification blocks chained by previous hash references
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950">
                  {passport.events.length} Events Stamped
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-600">
                {passport.events.map((event, idx) => (
                  <div key={event.id || idx} className="relative space-y-2">
                    {/* Event Circle Node */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-xs">
                      {idx + 1}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {event.eventName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {new Date(event.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {event.details}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Actor: <strong className="text-slate-700">{event.actor}</strong> ({event.actorRole})</span>
                      </div>

                      {/* Hash detail toggle */}
                      <div className="pt-2 border-t border-slate-100 text-[10px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">SHA-256 Block Digest:</span>
                          <button
                            onClick={() => handleCopy(event.hash)}
                            className="text-emerald-800 hover:underline font-bold cursor-pointer"
                          >
                            {copiedHash === event.hash ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <code className="block p-1.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 break-all">
                          {event.hash}
                        </code>
                        <div className="text-slate-400 font-mono truncate">
                          Prev: {event.previousHash}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Digital Transaction Agreement */}
          {activeTab === 'agreement' && agreement && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Digital Procurement Agreement
                    </span>
                    <h4 className="text-lg font-black text-slate-900">
                      {agreement.agreementId}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 font-black text-xs">
                    STATUS: {agreement.agreementStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Material Specification</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {agreement.materialName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Covenant Quantity</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {agreement.quantity} {agreement.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Settlement Value</span>
                    <span className="font-black text-emerald-950 text-sm mt-0.5 block">
                      {formatINR(agreement.totalAmountINR)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Producer / Seller</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {agreement.sellerName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {agreement.sellerAcceptance ? '✓ Terms Accepted' : '• Pending Acceptance'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Procuring Buyer</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {agreement.buyerName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {agreement.buyerAcceptance ? '✓ Terms Accepted' : '• Pending'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Delivery Destination</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {agreement.deliveryLocation}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Date &amp; Time</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {formatAgreementDateTime(agreement.createdAt)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Payment Method</span>
                    <span className="font-bold text-emerald-900 mt-0.5 block truncate">
                      {agreement.paymentMethod || 'UPI'}
                    </span>
                  </div>
                </div>

                {/* Agreement SHA-256 Signature */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="text-slate-500 font-bold">Cryptographic Agreement Signature:</span>
                    <button
                      onClick={() => handleCopy(agreement.agreementHash || agreement.hash || '')}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      {copiedHash === (agreement.agreementHash || agreement.hash) ? 'Copied!' : 'Copy Hash'}
                    </button>
                  </div>
                  <code className="block p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-emerald-900 break-all">
                    {agreement.agreementHash || agreement.hash || 'SHA-256 Stamped'}
                  </code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <p className="font-bold">Standard WORTHX Circular Covenants:</p>
                <p className="text-[11px] text-emerald-900">
                  This digital transaction agreement establishes standardized moisture thresholds, weight verification standards upon delivery, and chain-of-custody transfer. It is tamper-evident and permanently recorded on the platform ledger.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            ChainCraft™ SHA-256 Provenance Protocol
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Close Passport
          </button>
        </div>

      </div>
    </div>
  );
};
