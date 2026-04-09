/**
 * Formats a number as Nigerian Naira.
 * Always uses ₦ symbol, comma thousands separator, no decimal places.
 * e.g. 2000 → "₦2,000"
 */
export const fmtNgn = (n: number | string | null | undefined): string => {
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : Number(n ?? 0);
  if (isNaN(num)) return '₦0';
  return '₦' + Math.round(num).toLocaleString('en-NG');
};

/**
 * Formats a plain number with comma thousands separator.
 * e.g. 2000 → "2,000"
 */
export const fmtNumber = (n: number): string => Math.round(n).toLocaleString('en-NG');
