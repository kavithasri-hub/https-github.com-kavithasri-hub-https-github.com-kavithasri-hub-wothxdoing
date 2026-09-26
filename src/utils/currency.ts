// Indian Currency (INR ₹) formatting and calculation utilities for WORTHX

/**
 * Format a number or numeric string to Indian Rupee representation
 * Example: 1000 -> "₹1,000", 25500 -> "₹25,500", 125000 -> "₹1,25,000"
 */
export function formatINR(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(numeric)) {
    return '₹0';
  }

  // Format using en-IN locale
  const formatted = Math.round(numeric).toLocaleString('en-IN');
  return `₹${formatted}`;
}

/**
 * Format with decimals if needed (e.g. ₹20.50)
 */
export function formatINRWithDecimals(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(numeric)) {
    return '₹0.00';
  }

  const formatted = numeric.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

/**
 * Extract a numeric price value from strings like "₹20/kg", "₹20 / kg", "$20", "20"
 */
export function parsePriceToNumber(priceString: string | undefined): number {
  if (!priceString) return 0;
  // Match first sequence of digits and optional dot
  const cleaned = priceString.replace(/,/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

/**
 * Extract numeric quantity from strings like "1,000 kg", "500", "25 kg"
 */
export function parseQuantityToNumber(quantityString: string | undefined): number {
  if (!quantityString) return 0;
  const cleaned = quantityString.replace(/,/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

/**
 * Standardize price string to INR format: e.g. "₹20/kg"
 */
export function formatPricePerUnit(price: number | string, unit: string = 'kg'): string {
  const num = typeof price === 'number' ? price : parsePriceToNumber(price);
  return `₹${num.toLocaleString('en-IN')}/${unit.toLowerCase()}`;
}
