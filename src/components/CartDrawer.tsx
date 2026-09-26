import React from 'react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';
import { getMaterialImageUrl, getCategoryPlaceholderSvg } from '../utils/materialImages';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Package,
} from 'lucide-react';

interface CartDrawerProps {
  onOpenSignup?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenSignup }) => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotalINR,
    totalItemsCount,
    startCheckout,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-xs">
                <ShoppingCart className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  Procurement Cart
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bulk & flexible quantity resource procurement
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Discover reusable industrial by-products, agricultural residues, and post-consumer feedstocks in our marketplace.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const listing = item.listing;
                const displayImg = getMaterialImageUrl(listing.materialName, listing.category, listing.imageUrl);
                const fallbackSvg = getCategoryPlaceholderSvg(listing.materialName, listing.category);
                const availableNum = parseFloat(listing.quantity.replace(/,/g, '')) || 1000;
                const minOrderNum = 1;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <img
                          src={displayImg}
                          alt={listing.materialName}
                          onError={(e) => {
                            e.currentTarget.src = fallbackSvg;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200/60 uppercase">
                            {listing.category}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 truncate mt-1">
                          {listing.materialName}
                        </h4>

                        <p className="text-[11px] text-slate-500 truncate">
                          Seller: {listing.sellerName || 'Verified Producer'}
                        </p>

                        <p className="text-xs font-bold text-emerald-900 mt-0.5">
                          {listing.price}
                        </p>
                      </div>
                    </div>

                    {/* Stock & Quantity Control */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-medium">Available: </span>
                        <span className="font-bold text-slate-700">
                          {listing.quantity} {listing.unit || 'kg'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Min: 1 {listing.unit || 'kg'}
                        </span>
                      </div>

                      {/* Stepper & Manual Quantity Input */}
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.id, Math.max(1, item.quantity - 1));
                          }}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Decrease quantity by 1 kg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={availableNum}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val > 0) {
                              updateQuantity(item.id, val);
                            }
                          }}
                          className="w-14 text-center text-xs font-black text-slate-900 bg-white rounded border border-slate-200 py-0.5"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.id, Math.min(availableNum, item.quantity + 1));
                          }}
                          disabled={item.quantity >= availableNum}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Increase quantity by 1 kg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Total for this item */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-slate-100 font-semibold text-slate-600">
                      <span>Item Subtotal ({item.quantity} × {listing.price}):</span>
                      <span className="text-sm font-black text-emerald-950">
                        {formatINR(item.totalINR)}
                      </span>
                    </div>

                    {/* Quantity validation alert */}
                    {item.quantity > availableNum && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Only {listing.quantity} {listing.unit || 'kg'} is currently available.</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 space-y-3.5">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Procurement Subtotal:</span>
                  <span className="font-extrabold text-base text-slate-950">
                    {formatINR(subtotalINR)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Logistics & Escrow:</span>
                  <span>Calculated at Checkout</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>ChainCraft™ ESG assurance & verified B2B covenant included</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Continue Sourcing
                </button>

                <button
                  onClick={() => startCheckout()}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear entire cart
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
