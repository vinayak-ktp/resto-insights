// ============================================================
// Zomato Restaurant Analytics Dashboard — Type Definitions
// ============================================================

// --- Restaurant ---
export interface Restaurant {
  id: string;
  name: string;
  subzone: string;
  city: string;
  displayName: string; // "Name — Subzone, City"
}

// --- Metric Definitions ---
export type MetricGroup = 'sales_overview' | 'customer_funnel' | 'marketing';

export type MetricUnit = 'currency' | 'count' | 'percentage' | 'ratio';

export type AggregationType = 'sum' | 'average' | 'weighted_average' | 'last' | 'computed';

export interface MetricDefinition {
  key: string;
  label: string;
  group: MetricGroup;
  groupLabel: string;
  unit: MetricUnit;
  csvOverview: string;      // CSV "Overview" column value
  csvMetric: string;        // CSV "Metric" column value
  aggregation: AggregationType;
  format: string;           // 'currency' | 'number' | 'percent' | 'decimal'
  higherIsBetter: boolean;
}

// --- Data Records ---
export type Granularity = 'daily' | 'weekly' | 'monthly';

export interface MetricRecord {
  id?: number;
  restaurantId: string;
  date: string;            // ISO YYYY-MM-DD
  granularity: Granularity;
  metricGroup: MetricGroup;
  metricKey: string;
  value: number;
}

// --- Upload Tracking ---
export interface UploadRecord {
  id?: number;
  fileName: string;
  uploadedAt: string;      // ISO datetime
  dateRangeStart: string;
  dateRangeEnd: string;
  restaurantCount: number;
  recordCount: number;
  status: 'success' | 'partial' | 'error';
  errors: string[];
  warnings: string[];
}

// --- Filter State ---
export interface FilterState {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  restaurants: string[];    // restaurant IDs
  metricGroup: MetricGroup | 'all';
  metricKeys: string[];
  granularity: Granularity;
}

// --- Comparison ---
export type ComparisonMode = 'restaurant' | 'dateRange';

export interface ComparisonConfig {
  mode: ComparisonMode;
  // Restaurant comparison
  restaurantIds: string[];
  metricKey: string;
  dateRange: { start: string; end: string };
  // Date range comparison
  periodA: { start: string; end: string };
  periodB: { start: string; end: string };
}

export interface ComparisonResult {
  label: string;
  valueA: number;
  valueB: number;
  delta: number;
  deltaPercent: number;
}

// --- Chart Data ---
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number; // dynamic keys for restaurant/metric names
}

// --- KPI Summary ---
export interface KpiSummary {
  metricKey: string;
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  unit: MetricUnit;
  format: string;
}

// --- CSV Parsing ---
export interface ParseResult {
  success: boolean;
  restaurants: Restaurant[];
  records: MetricRecord[];
  dateRange: { start: string; end: string };
  detectedGranularity: Granularity;
  errors: string[];
  warnings: string[];
  totalRows: number;
  processedRows: number;
  skippedRows: number;
}

export interface CsvRow {
  'Restaurant ID': string;
  'Restaurant name': string;
  'Subzone': string;
  'City': string;
  'Overview': string;
  'Metric': string;
  [dateColumn: string]: string | number;
}
