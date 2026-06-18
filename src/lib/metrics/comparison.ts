// ============================================================
// Comparison Engine
// ============================================================

import type { MetricRecord, ComparisonResult, Restaurant } from '@/types';
import { computeSummary } from './aggregation';
import { getMetricDefinition } from './definitions';

// Compare two date ranges for the same restaurant(s) and metric
export function compareDateRanges(
  allRecords: MetricRecord[],
  metricKey: string,
  restaurantIds: string[],
  periodA: { start: string; end: string },
  periodB: { start: string; end: string }
): ComparisonResult {
  const filteredA = allRecords.filter(
    (r) =>
      restaurantIds.includes(r.restaurantId) &&
      r.date >= periodA.start &&
      r.date <= periodA.end
  );

  const filteredB = allRecords.filter(
    (r) =>
      restaurantIds.includes(r.restaurantId) &&
      r.date >= periodB.start &&
      r.date <= periodB.end
  );

  const valueA = computeSummary(filteredA, metricKey);
  const valueB = computeSummary(filteredB, metricKey);
  const delta = valueB - valueA;
  const deltaPercent = valueA !== 0 ? (delta / valueA) * 100 : valueB !== 0 ? 100 : 0;

  const metricDef = getMetricDefinition(metricKey);

  return {
    label: metricDef?.label || metricKey,
    valueA,
    valueB,
    delta,
    deltaPercent,
  };
}

// Compare restaurants for the same metric and date range
export function compareRestaurants(
  allRecords: MetricRecord[],
  metricKey: string,
  restaurantIds: string[],
  dateRange: { start: string; end: string },
  restaurantMap: Map<string, Restaurant>
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  for (const restId of restaurantIds) {
    const filtered = allRecords.filter(
      (r) =>
        r.restaurantId === restId &&
        r.date >= dateRange.start &&
        r.date <= dateRange.end
    );

    const value = computeSummary(filtered, metricKey);
    const restaurant = restaurantMap.get(restId);

    results.push({
      label: restaurant?.displayName || restId,
      valueA: value,
      valueB: 0,
      delta: 0,
      deltaPercent: 0,
    });
  }

  // Sort by value descending
  results.sort((a, b) => b.valueA - a.valueA);

  // Compute delta relative to top performer
  if (results.length > 0) {
    const topValue = results[0].valueA;
    for (const r of results) {
      r.valueB = topValue;
      r.delta = r.valueA - topValue;
      r.deltaPercent = topValue !== 0 ? (r.delta / topValue) * 100 : 0;
    }
  }

  return results;
}

// Get trend data for restaurant comparison (multiple restaurants, same metric)
export function getRestaurantComparisonTrend(
  allRecords: MetricRecord[],
  metricKey: string,
  restaurantIds: string[],
  dateRange: { start: string; end: string }
): Map<string, { date: string; value: number }[]> {
  const result = new Map<string, { date: string; value: number }[]>();

  for (const restId of restaurantIds) {
    const filtered = allRecords.filter(
      (r) =>
        r.restaurantId === restId &&
        r.metricKey === metricKey &&
        r.date >= dateRange.start &&
        r.date <= dateRange.end
    );

    const trend = filtered
      .map((r) => ({ date: r.date, value: r.value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    result.set(restId, trend);
  }

  return result;
}
