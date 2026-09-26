import React, { createContext, useContext, useState, useEffect } from 'react';
import { MaterialListing, CartItem } from '../types';
import { parsePriceToNumber, parseQuantityToNumber } from '../utils/currency';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (listing: MaterialListing, desiredQuantity?: number) => { success: boolean; message: string };
  updateQuantity: (listingId: string, quantity: number) => { success: boolean; message?: string };
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  subtotalINR: number;
  totalItemsCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  checkoutItems: CartItem[];
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  startCheckout: (specificItem?: CartItem) => void;
  lastAddedItem: MaterialListing | null;
  notificationMessage: string | null;
  clearNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'worthx_b2b_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<MaterialListing | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.warn('Could not save cart to localStorage', err);
    }
  }, [cartItems]);

  const clearNotification = () => setNotificationMessage(null);

  const addToCart = (
    listing: MaterialListing,
    desiredQuantity?: number
  ): { success: boolean; message: string } => {
    const availableNum = parseQuantityToNumber(listing.quantity) || 1000;
    const unitPriceNum = parsePriceToNumber(listing.price);

    // Initial quantity to add (minimum purchase is strictly 1 kg)
    const qtyToAdd = desiredQuantity !== undefined && desiredQuantity > 0
      ? desiredQuantity
      : 1;

    // Validate minimum quantity is at least 1 kg
    if (qtyToAdd < 1) {
      const msg = 'Minimum purchase quantity is 1 kg.';
      setNotificationMessage(msg);
      return { success: false, message: msg };
    }

    // Validate against available quantity
    if (qtyToAdd > availableNum) {
      const msg = `Only ${listing.quantity} ${listing.unit || 'kg'} is currently available.`;
      setNotificationMessage(msg);
      return { success: false, message: msg };
    }

    let validationFailedMsg: string | null = null;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.listing.id === listing.id);

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + qtyToAdd;

        if (newQty > availableNum) {
          validationFailedMsg = `Only ${listing.quantity} ${listing.unit || 'kg'} is currently available.`;
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalINR: newQty * unitPriceNum,
        };
        return updated;
      }

      // New cart item
      const newItem: CartItem = {
        id: listing.id,
        listing,
        quantity: qtyToAdd,
        unitPriceNum,
        totalINR: qtyToAdd * unitPriceNum,
      };

      return [...prev, newItem];
    });

    if (validationFailedMsg) {
      setNotificationMessage(validationFailedMsg);
      return { success: false, message: validationFailedMsg };
    }

    setLastAddedItem(listing);
    const successMsg = `Added ${qtyToAdd} ${listing.unit || 'kg'} of ${listing.materialName} to cart.`;
    setNotificationMessage(successMsg);

    return { success: true, message: successMsg };
  };

  const updateQuantity = (
    listingId: string,
    newQuantity: number
  ): { success: boolean; message?: string } => {
    const targetItem = cartItems.find((i) => i.listing.id === listingId);
    if (!targetItem) return { success: false, message: 'Item not found in cart.' };

    const availableNum = parseQuantityToNumber(targetItem.listing.quantity) || 1000;

    if (newQuantity <= 0) {
      removeFromCart(listingId);
      return { success: true };
    }

    if (newQuantity < 1) {
      const msg = 'Minimum purchase quantity is 1 kg.';
      setNotificationMessage(msg);
      return { success: false, message: msg };
    }

    if (newQuantity > availableNum) {
      const msg = `Only ${targetItem.listing.quantity} ${targetItem.listing.unit || 'kg'} is currently available.`;
      setNotificationMessage(msg);
      return { success: false, message: msg };
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.listing.id === listingId) {
          return {
            ...item,
            quantity: newQuantity,
            totalINR: newQuantity * item.unitPriceNum,
          };
        }
        return item;
      })
    );

    return { success: true };
  };

  const removeFromCart = (listingId: string) => {
    setCartItems((prev) => prev.filter((i) => i.listing.id !== listingId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const startCheckout = (specificItem?: CartItem): { success: boolean; message?: string } => {
    const itemsToCheck = specificItem ? [specificItem] : cartItems;

    for (const item of itemsToCheck) {
      const availableNum = parseQuantityToNumber(item.listing.quantity) || 1000;
      if (item.quantity < 1) {
        const msg = 'Minimum purchase quantity is 1 kg.';
        setNotificationMessage(msg);
        return { success: false, message: msg };
      }
      if (item.quantity > availableNum) {
        const msg = `Only ${item.listing.quantity} ${item.listing.unit || 'kg'} is currently available.`;
        setNotificationMessage(msg);
        return { success: false, message: msg };
      }
    }

    if (specificItem) {
      setCheckoutItems([specificItem]);
    } else {
      setCheckoutItems(cartItems);
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    return { success: true };
  };

  const subtotalINR = cartItems.reduce((acc, item) => acc + item.totalINR, 0);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + (item.quantity > 0 ? 1 : 0), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotalINR,
        totalItemsCount,
        isCartOpen,
        setIsCartOpen,
        checkoutItems,
        isCheckoutOpen,
        setIsCheckoutOpen,
        startCheckout,
        lastAddedItem,
        notificationMessage,
        clearNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
