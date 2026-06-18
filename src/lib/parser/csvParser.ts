// ============================================================
// CSV Parser — Parses Zomato business report CSVs
// ============================================================

import Papa from 'papaparse';
import type { ParseResult, MetricRecord, Restaurant, CsvRow, Granularity } from '@/types';
import { CSV_METRIC_MAP } from '@/lib/metrics/definitions';
import { parseCsvDate, toISODate, isDateColumn } from '@/lib/utils/dates';
import { parseNumericValue } from '@/lib/utils/format';

export function parseZomatoCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseResult = processRows(results.data as CsvRow[], file.name);
        resolve(parseResult);
      },
      error: (error: Error) => {
        resolve({
          success: false,
          restaurants: [],
          records: [],
          dateRange: { start: '', end: '' },
          detectedGranularity: 'daily',
          errors: [`Failed to parse CSV: ${error.message}`],
          warnings: [],
          totalRows: 0,
          processedRows: 0,
          skippedRows: 0,
        });
      },
    });
  });
}

function processRows(rows: CsvRow[], fileName: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const restaurants = new Map<string, Restaurant>();
  const records: MetricRecord[] = [];

  if (rows.length === 0) {
    return {
      success: false,
      restaurants: [],
      records: [],
      dateRange: { start: '', end: '' },
      detectedGranularity: 'daily',
      errors: ['CSV file is empty'],
      warnings: [],
      totalRows: 0,
      processedRows: 0,
      skippedRows: 0,
    };
  }

  // Validate required columns
  const firstRow = rows[0];
  const requiredColumns = ['Restaurant ID', 'Restaurant name', 'Subzone', 'City', 'Overview', 'Metric'];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
  if (missingColumns.length > 0) {
    return {
      success: false,
      restaurants: [],
      records: [],
      dateRange: { start: '', end: '' },
      detectedGranularity: 'daily',
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      warnings: [],
      totalRows: rows.length,
      processedRows: 0,
      skippedRows: rows.length,
    };
  }

  // Detect date columns
  const allColumns = Object.keys(firstRow);
  const dateColumns: { column: string; isoDate: string; isMonthly: boolean }[] = [];

  for (const col of allColumns) {
    if (requiredColumns.includes(col)) continue;
    const parsed = parseCsvDate(col);
    if (parsed) {
      dateColumns.push({
        column: col,
        isoDate: toISODate(parsed.date),
        isMonthly: parsed.isMonthly,
      });
    }
  }

  if (dateColumns.length === 0) {
    return {
      success: false,
      restaurants: [],
      records: [],
      dateRange: { start: '', end: '' },
      detectedGranularity: 'daily',
      errors: ['No valid date columns found in CSV'],
      warnings: [],
      totalRows: rows.length,
      processedRows: 0,
      skippedRows: rows.length,
    };
  }

  const isMonthlyData = dateColumns[0].isMonthly;
  const granularity: Granularity = isMonthlyData ? 'monthly' : 'daily';

  // Sort dates
  dateColumns.sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  let processedRows = 0;
  let skippedRows = 0;

  // We need to collect sales and delivered orders for AOV calculation
  const salesByRestDate = new Map<string, number>();       // "restId|date" -> sales value
  const ordersbyRestDate = new Map<string, number>();      // "restId|date" -> orders value

  for (const row of rows) {
    const restId = String(row['Restaurant ID'] || '').trim();
    const restName = String(row['Restaurant name'] || '').trim();
    const subzone = String(row['Subzone'] || '').trim();
    const city = String(row['City'] || '').trim();
    const overview = String(row['Overview'] || '').trim();
    const metric = String(row['Metric'] || '').trim();

    if (!restId || !restName) {
      skippedRows++;
      continue;
    }

    // Register restaurant
    if (!restaurants.has(restId)) {
      restaurants.set(restId, {
        id: restId,
        name: restName,
        subzone,
        city,
        displayName: `${restName} — ${subzone}, ${city}`,
      });
    }

    // Check if this metric is one we care about
    const lookupKey = `${overview}|||${metric}`;
    const metricDef = CSV_METRIC_MAP.get(lookupKey);

    if (!metricDef) {
      // Not a required metric, skip
      skippedRows++;
      continue;
    }

    // Process each date column
    for (const dc of dateColumns) {
      const rawValue = row[dc.column];
      const value = parseNumericValue(rawValue);

      records.push({
        restaurantId: restId,
        date: dc.isoDate,
        granularity,
        metricGroup: metricDef.group,
        metricKey: metricDef.key,
        value,
      });

      // Track sales and orders for AOV computation
      if (metricDef.key === 'sales') {
        salesByRestDate.set(`${restId}|${dc.isoDate}`, value);
      } else if (metricDef.key === 'delivered_orders') {
        ordersbyRestDate.set(`${restId}|${dc.isoDate}`, value);
      }
    }

    processedRows++;
  }

  // Compute Average Order Value
  for (const [key, sales] of salesByRestDate) {
    const orders = ordersbyRestDate.get(key) || 0;
    const aov = orders > 0 ? sales / orders : 0;
    const [restId, date] = key.split('|');

    records.push({
      restaurantId: restId,
      date,
      granularity,
      metricGroup: 'sales_overview',
      metricKey: 'average_order_value',
      value: aov,
    });
  }

  const dateRange = {
    start: dateColumns[0].isoDate,
    end: dateColumns[dateColumns.length - 1].isoDate,
  };

  if (restaurants.size === 0) {
    errors.push('No restaurants found in the CSV');
  }

  if (records.length === 0) {
    errors.push('No matching metrics found in the CSV');
  }

  return {
    success: errors.length === 0,
    restaurants: Array.from(restaurants.values()),
    records,
    dateRange,
    detectedGranularity: granularity,
    errors,
    warnings,
    totalRows: rows.length,
    processedRows,
    skippedRows,
  };
}
