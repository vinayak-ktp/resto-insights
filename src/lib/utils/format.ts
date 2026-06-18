// ============================================================
// Number & Currency Formatting Utilities
// ============================================================

export function formatCurrency(value: number): string {
  if (isNaN(value) || value === 0) return '₹0';
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value.toFixed(0)}`;
}

export function formatCurrencyFull(value: number): string {
  if (isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === 0) return '0';
  if (Math.abs(value) >= 10000000) {
    return `${(value / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(value) >= 100000) {
    return `${(value / 100000).toFixed(2)}L`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

export function formatDecimal(value: number): string {
  if (isNaN(value)) return '0';
  return value.toFixed(2);
}

export function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'percent':
      return formatPercent(value);
    case 'decimal':
      return formatDecimal(value);
    default:
      return value.toString();
  }
}

export function formatChangePercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function parseNumericValue(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleaned = String(value).replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
