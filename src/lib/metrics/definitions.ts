// ============================================================
// Metric Definitions — Maps CSV columns to dashboard metrics
// ============================================================

import type { MetricDefinition, MetricGroup } from '@/types';

export const METRIC_GROUPS: { key: MetricGroup; label: string; icon: string }[] = [
  { key: 'sales_overview', label: 'Sales Overview', icon: 'TrendingUp' },
  { key: 'customer_funnel', label: 'Customer Funnel', icon: 'Filter' },
  { key: 'marketing', label: 'Marketing', icon: 'Megaphone' },
];

// All 16 required metrics + 1 computed (AOV)
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // ── Sales Overview ──
  {
    key: 'sales',
    label: 'Sales',
    group: 'sales_overview',
    groupLabel: 'Sales Overview',
    unit: 'currency',
    csvOverview: 'Sales',
    csvMetric: 'Sales (Rs)',
    aggregation: 'sum',
    format: 'currency',
    higherIsBetter: true,
  },
  {
    key: 'delivered_orders',
    label: 'Delivered Orders',
    group: 'sales_overview',
    groupLabel: 'Sales Overview',
    unit: 'count',
    csvOverview: 'Sales',
    csvMetric: 'Delivered orders',
    aggregation: 'sum',
    format: 'number',
    higherIsBetter: true,
  },
  {
    key: 'average_order_value',
    label: 'Average Order Value',
    group: 'sales_overview',
    groupLabel: 'Sales Overview',
    unit: 'currency',
    csvOverview: '__computed__',
    csvMetric: '__computed__',
    aggregation: 'computed',
    format: 'currency',
    higherIsBetter: true,
  },

  // ── Customer Funnel ──
  {
    key: 'impressions',
    label: 'Impressions',
    group: 'customer_funnel',
    groupLabel: 'Customer Funnel',
    unit: 'count',
    csvOverview: 'Customer funnel',
    csvMetric: 'Impressions',
    aggregation: 'sum',
    format: 'number',
    higherIsBetter: true,
  },
  {
    key: 'menu_to_order',
    label: 'Menu to Order',
    group: 'customer_funnel',
    groupLabel: 'Customer Funnel',
    unit: 'percentage',
    csvOverview: 'Customer funnel',
    csvMetric: 'Impressions to menu (%)',
    aggregation: 'weighted_average',
    format: 'percent',
    higherIsBetter: true,
  },
  {
    key: 'menu_to_cart',
    label: 'Menu to Cart',
    group: 'customer_funnel',
    groupLabel: 'Customer Funnel',
    unit: 'percentage',
    csvOverview: 'Customer funnel',
    csvMetric: 'Menu to cart (%)',
    aggregation: 'weighted_average',
    format: 'percent',
    higherIsBetter: true,
  },
  {
    key: 'cart_to_order',
    label: 'Cart to Order',
    group: 'customer_funnel',
    groupLabel: 'Customer Funnel',
    unit: 'percentage',
    csvOverview: 'Customer funnel',
    csvMetric: 'Cart to orders (%)',
    aggregation: 'weighted_average',
    format: 'percent',
    higherIsBetter: true,
  },

  // ── Marketing: Ads ──
  {
    key: 'sales_from_ads',
    label: 'Sales from Ads',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'currency',
    csvOverview: 'Ads',
    csvMetric: 'Sales from ads (Rs)',
    aggregation: 'sum',
    format: 'currency',
    higherIsBetter: true,
  },
  {
    key: 'ad_ctr',
    label: 'Ad Click-Through Rate',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'percentage',
    csvOverview: 'Ads',
    csvMetric: 'Ads CTR (%)',
    aggregation: 'weighted_average',
    format: 'percent',
    higherIsBetter: true,
  },
  {
    key: 'ads_orders',
    label: 'Ads Orders',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'count',
    csvOverview: 'Ads',
    csvMetric: 'Ads orders',
    aggregation: 'sum',
    format: 'number',
    higherIsBetter: true,
  },
  {
    key: 'ads_impressions',
    label: 'Ads Impressions',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'count',
    csvOverview: 'Ads',
    csvMetric: 'Ads impressions',
    aggregation: 'sum',
    format: 'number',
    higherIsBetter: true,
  },
  {
    key: 'ads_spend',
    label: 'Ads Spend',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'currency',
    csvOverview: 'Ads',
    csvMetric: 'Ads spend (Rs)',
    aggregation: 'sum',
    format: 'currency',
    higherIsBetter: false,
  },
  {
    key: 'ads_roi',
    label: 'Ads Return on Investment',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'ratio',
    csvOverview: 'Ads',
    csvMetric: 'Ads ROI',
    aggregation: 'weighted_average',
    format: 'decimal',
    higherIsBetter: true,
  },
  {
    key: 'gross_sales_from_offers',
    label: 'Gross Sales from Offers',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'currency',
    csvOverview: 'Offers',
    csvMetric: 'Gross sales from offers (Rs)',
    aggregation: 'sum',
    format: 'currency',
    higherIsBetter: true,
  },
  {
    key: 'orders_with_offers',
    label: 'Orders with Offers',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'count',
    csvOverview: 'Offers',
    csvMetric: 'Orders with offers',
    aggregation: 'sum',
    format: 'number',
    higherIsBetter: true,
  },
  {
    key: 'discount_given',
    label: 'Discount Given',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'currency',
    csvOverview: 'Offers',
    csvMetric: 'Discount given (Rs)',
    aggregation: 'sum',
    format: 'currency',
    higherIsBetter: false,
  },
  {
    key: 'effective_discount',
    label: 'Effective Discount',
    group: 'marketing',
    groupLabel: 'Marketing',
    unit: 'percentage',
    csvOverview: 'Offers',
    csvMetric: 'Effective discount (%)',
    aggregation: 'weighted_average',
    format: 'percent',
    higherIsBetter: false,
  },
];

// Lookup map for fast CSV→metric resolution
export const CSV_METRIC_MAP = new Map<string, MetricDefinition>();
METRIC_DEFINITIONS.forEach((def) => {
  if (def.csvOverview !== '__computed__') {
    const key = `${def.csvOverview}|||${def.csvMetric}`;
    CSV_METRIC_MAP.set(key, def);
  }
});

export function getMetricDefinition(key: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find((d) => d.key === key);
}

export function getMetricsByGroup(group: MetricGroup): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter((d) => d.key !== 'average_order_value' && d.group === group);
}

export function getAllDisplayMetrics(): MetricDefinition[] {
  return METRIC_DEFINITIONS;
}

// The 4 primary KPI metrics shown at the top of the overview
export const PRIMARY_KPIS: string[] = [
  'sales',
  'delivered_orders',
  'average_order_value',
  'impressions',
];
