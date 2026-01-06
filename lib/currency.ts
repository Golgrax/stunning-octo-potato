/**
 * Currency formatting utilities for Lumina Café
 * Default currency: Philippine Peso (PHP)
 */

export const formatCurrency = (amount: number): string => {
  return `₱${amount.toFixed(2)}`;
};

export const CURRENCY_SYMBOL = '₱';
export const CURRENCY_CODE = 'PHP';
