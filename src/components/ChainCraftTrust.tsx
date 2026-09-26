import React, { useState } from 'react';
import { ShieldCheck, FileCheck, ArrowLeftRight, Check, Hash, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { ChainCraftPassportModal } from './ChainCraftPassportModal';
import { ChainCraftPassport, DigitalAgreement } from '../types';

export const ChainCraftTrust: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const demoPassport: ChainCraftPassport = {
    id: 'pass-sample-demo',
    passportId: 'WX-PASSPORT-CC7829',
    listingId: 'listing-demo-eggshell',
    materialName: 'Clean Dried Eggshell Flakes (Bio-Calcium)',
    category: 'Food Processing Waste',
    quantity: '2,500',
    unit: 'Kg',
    sellerId: 'producer-bio-cal',
    sellerName: 'Tamil Nadu Poultry Processors',
    orderId: 'WX-ORD-882194',
    agreementId: 'WX-AGR-49120',
    verificationStatus: 'ChainCraft Verified',
    lifecycleStatus: 'COMPLETED',
    genesisHash: '0x1c8b3e839210a40239c89182390aefbc48291048201948201948201948201948',
    latestHash: '0x42afa063e68e4b309c9cec5c608e5451e39a7b9c109283746501928374650192',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    events: [
      {
        id: 'ev-1',
        eventId: 'EV-1001-LISTING',
        passportId: 'WX-PASSPORT-CC7829',
        eventName: 'LISTING_CREATED',
        statusLabel: 'Listing Published',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        actor: 'Tamil Nadu Poultry Processors',
        actorRole: 'SELLER',
        details: 'Resource registered with certified moisture < 3% and calcium carbonate purity grade 94%.',
        payload: { listingId: 'listing-demo-eggshell', quantity: 2500, pricePerUnit: '₹14/Kg' },
        hash: '0x1c8b3e839210a40239c89182390aefbc48291048201948201948201948201948',
        previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
      {
        id: 'ev-2',
        eventId: 'EV-1002-VERIFY',
        passportId: 'WX-PASSPORT-CC7829',
        eventName: 'RESOURCE_VERIFIED',
        statusLabel: 'Resource Verified',
        timestamp: new Date(Date.now() - 86400000 * 2.8).toISOString(),
        actor: 'ChainCraft Automated AI Lab',
        actorRole: 'PROCESSOR',
        details: 'AI Vision and laboratory analysis verified material composition as industrial-grade calcium feedstock.',
        payload: { verified: true, confidence: 'High', standard: 'ISO-14021' },
        hash: '0x8f2a91b402837461928374650192837465019283746501928374650192837465',
        previousHash: '0x1c8b3e839210a40239c89182390aefbc48291048201948201948201948201948',
      },
      {
        id: 'ev-3',
        eventId: 'EV-1003-ORDER',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'ORDER_CREATED',
        statusLabel: 'Order Created',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        actor: 'EcoMineral Tech Pvt Ltd',
        actorRole: 'BUYER',
        details: 'Procurement covenant established for fertilizer soil amendment manufacturing.',
        payload: { orderId: 'WX-ORD-882194', quantity: 2500, totalINR: 35000 },
        hash: '0x3d7e102938475610293847561029384756102938475610293847561029384756',
        previousHash: '0x8f2a91b402837461928374650192837465019283746501928374650192837465',
      },
      {
        id: 'ev-4',
        eventId: 'EV-1004-AGR',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'AGREEMENT_CREATED',
        statusLabel: 'Digital Transaction Agreement Stamped',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        actor: 'ChainCraft Governance Protocol',
        actorRole: 'PROCESSOR',
        details: 'Digital procurement covenant signed with bilateral commitments on transit moisture and delivery terms.',
        payload: { agreementId: 'WX-AGR-49120', amount: 35000, termsAccepted: true },
        hash: '0x5b9c019283746501928374650192837465019283746501928374650192837465',
        previousHash: '0x3d7e102938475610293847561029384756102938475610293847561029384756',
      },
      {
        id: 'ev-5',
        eventId: 'EV-1005-ACCEPT',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'ORDER_ACCEPTED',
        statusLabel: 'Order Accepted by Producer',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        actor: 'Tamil Nadu Poultry Processors',
        actorRole: 'SELLER',
        details: 'Producer accepted delivery timetable and began dispatch packaging.',
        payload: { dispatchScheduled: true },
        hash: '0x7e8f019283746501928374650192837465019283746501928374650192837465',
        previousHash: '0x5b9c019283746501928374650192837465019283746501928374650192837465',
      },
      {
        id: 'ev-6',
        eventId: 'EV-1006-PREP',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'PREPARING',
        statusLabel: 'Material Prepared & Weighed',
        timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(),
        actor: 'Tamil Nadu Poultry Processors',
        actorRole: 'SELLER',
        details: 'Calibrated weighbridge gross weight 2,500 Kg recorded and bagged in clean polypropylene woven sacks.',
        payload: { weightKg: 2500, batches: 50 },
        hash: '0x9a0b019283746501928374650192837465019283746501928374650192837465',
        previousHash: '0x7e8f019283746501928374650192837465019283746501928374650192837465',
      },
      {
        id: 'ev-7',
        eventId: 'EV-1007-SHIP',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'DISPATCHED',
        statusLabel: 'Consignment Dispatched',
        timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(),
        actor: 'Southern Freight Logistics',
        actorRole: 'SELLER',
        details: 'Vehicle TN-38-BZ-4910 loaded. Waybill WB-882194 assigned.',
        payload: { truckNumber: 'TN-38-BZ-4910', carrier: 'Southern Freight' },
        hash: '0x2c4d019283746501928374650192837465019283746501928374650192837465',
        previousHash: '0x9a0b019283746501928374650192837465019283746501928374650192837465',
      },
      {
        id: 'ev-8',
        eventId: 'EV-1008-RECV',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'RECEIVED',
        statusLabel: 'Consignment Received at Facility',
        timestamp: new Date(Date.now() - 86400000 * 0.2).toISOString(),
        actor: 'EcoMineral Tech Pvt Ltd',
        actorRole: 'BUYER',
        details: 'Inbound inspection passed. Net weight 2,500 Kg confirmed at Coimbatore processing plant.',
        payload: { receivedAt: 'Coimbatore Plant', qcPassed: true },
        hash: '0x6e1f019283746501928374650192837465019283746501928374650192837465',
        previousHash: '0x2c4d019283746501928374650192837465019283746501928374650192837465',
      },
      {
        id: 'ev-9',
        eventId: 'EV-1009-DONE',
        passportId: 'WX-PASSPORT-CC7829',
        orderId: 'WX-ORD-882194',
        agreementId: 'WX-AGR-49120',
        eventName: 'COMPLETED',
        statusLabel: 'Transaction Completed & Verified',
        timestamp: new Date().toISOString(),
        actor: 'ChainCraft Settlement Engine',
        actorRole: 'PROCESSOR',
        details: 'Zero landfill diversion confirmed. Material incorporated into bio-mineral soil rejuvenator production.',
        payload: { divertedKg: 2500, carbonSavedKgCO2e: 420 },
        hash: '0x42afa063e68e4b309c9cec5c608e5451e39a7b9c109283746501928374650192',
        previousHash: '0x6e1f019283746501928374650192837465019283746501928374650192837465',
      },
    ],
  };

  const demoAgreement: DigitalAgreement = {
    id: 'agr-sample-demo',
    agreementId: 'WX-AGR-49120',
    orderId: 'WX-ORD-882194',
    passportId: 'WX-PASSPORT-CC7829',
    sellerId: 'producer-bio-cal',
    sellerName: 'Tamil Nadu Poultry Processors',
    buyerId: 'buyer-ecomineral',
    buyerName: 'EcoMineral Tech Pvt Ltd',
    materialName: 'Clean Dried Eggshell Flakes (Bio-Calcium)',
    category: 'Food Processing Waste',
    quantity: 2500,
    unit: 'Kg',
    pricePerUnit: '₹14/Kg',
    totalAmountINR: 35000,
    paymentMethod: 'UPI',
    agreementStatus: 'COMPLETED',
    sellerAcceptance: true,
    sellerAcceptedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    buyerAcceptance: true,
    buyerAcceptedAt: new Date().toISOString(),
    hash: '0x5b9c019283746501928374650192837465019283746501928374650192837465',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const trustCards = [
    {
      icon: ShieldCheck,
      title: 'Resource Passport',
      desc: 'Cryptographic provenance stamped for every published resource and secondary raw material.',
      badge: 'SHA-256 Immutability',
      detail: 'Timestamped origin tracking ensures zero contamination and authentic diversion from landfill.',
    },
    {
      icon: FileCheck,
      title: 'Digital Transaction Agreement',
      desc: 'Standardized mutual terms between sellers and buyers with real-time bilateral acceptance.',
      badge: 'Bilateral Execution',
      detail: 'Automated quantity thresholds, moisture tolerances, and delivery covenants.',
    },
    {
      icon: ArrowLeftRight,
      title: 'End-to-End Lifecycle',
      desc: 'From listing creation to dispatch, receipt, and quality verification, all recorded in Supabase.',
      badge: 'Full Traceability',
      detail: 'Chain of custody reporting for regulatory ESG compliance and circular credits.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            ChainCraft™ Protocol & Verification Layer
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
            Built for Real Trust & Traceability
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Deterministic SHA-256 resource passports and digital transaction agreements connected directly to live marketplace listings.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {card.title}
                  </h3>

                  <p className="text-sm text-slate-600 mb-4 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{card.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Resource Passport Inspection Card */}
        <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Live Verification Passport Preview
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-950">
              Interactive ChainCraft Resource Passport & Agreement
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              Inspect how 9-stage lifecycle events (Listing → Verification → Order → Agreement → Accepted → Preparing → Dispatched → Received → Completed) maintain cryptographic SHA-256 integrity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="py-3 px-5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Open Resource Passport</span>
            </button>
          </div>
        </div>

        {/* Preview Ledger Hash Bar */}
        <div className="mt-4 bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-300">Genesis Ledger Root:</span>
            <code className="text-[11px] font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded truncate max-w-[280px] sm:max-w-md">
              0x42afa063e68e4b309c9cec5c608e5451e39a7b9c
            </code>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/50">
            ChainCraft Status: Active & Synced
          </span>
        </div>

      </div>

      {/* Modal */}
      <ChainCraftPassportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        passport={demoPassport}
        agreement={demoAgreement}
      />
    </section>
  );
};
