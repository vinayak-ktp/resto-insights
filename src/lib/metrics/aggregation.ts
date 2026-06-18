// ============================================================
// Aggregation Engine — Daily → Weekly → Monthly rollups
// ============================================================

import type { MetricRecord, Granularity } from '@/types';
import { getMetricDefinition } from '@/lib/metrics/definitions';
import { getWeekKey, getMonthKey } from '@/lib/utils/dates';

interface AggregationGroup {
  key: string; // week key or month key
  records: MetricRecord[];
}

export function aggregateRecords(
  records: MetricRecord[],
  targetGranularity: Granularity
): MetricRecord[] {
  if (targetGranularity === 'daily') {
    return records.filter((r) => r.granularity === 'daily');
  }

  // Get daily records first
  const dailyRecords = records.filter((r) => r.granularity === 'daily');

  if (dailyRecords.length === 0) {
    // If only monthly data available, return it for monthly view
    if (targetGranularity === 'monthly') {
      return records.filter((r) => r.granularity === 'monthly');
    }
    return [];
  }

  // Group by restaurant + metric + period
  const groups = new Map<string, AggregationGroup>();

  for (const record of dailyRecords) {
    const periodKey =
      targetGranularity === 'weekly'
        ? getWeekKey(new Date(record.date))
        : getMonthKey(new Date(record.date));

    const groupKey = `${record.restaurantId}|${record.metricKey}|${periodKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { key: periodKey, records: [] });
    }
    groups.get(groupKey)!.records.push(record);
  }

  // Aggregate each group
  const aggregated: MetricRecord[] = [];

  for (const [groupKey, group] of groups) {
    const [restaurantId, metricKey] = groupKey.split('|');
    const metricDef = getMetricDefinition(metricKey);
    const sampleRecord = group.records[0];

    let aggregatedValue: number;

    if (metricKey === 'average_order_value') {
      // Special: recompute from sales/orders
      aggregatedValue = 0; // Will be computed later
    } else if (metricDef?.aggregation === 'sum') {
      aggregatedValue = group.records.reduce((sum, r) => sum + r.value, 0);
    } else if (metricDef?.aggregation === 'weighted_average' || metricDef?.aggregation === 'average') {
      const nonZero = group.records.filter((r) => r.value !== 0);
      aggregatedValue =
        nonZero.length > 0
          ? nonZero.reduce((sum, r) => sum + r.value, 0) / nonZero.length
          : 0;
    } else {
      aggregatedValue = group.records.reduce((sum, r) => sum + r.value, 0);
    }

    aggregated.push({
      restaurantId,
      date: group.key,
      granularity: targetGranularity,
      metricGroup: sampleRecord.metricGroup,
      metricKey,
      value: aggregatedValue,
    });
  }

  // Recompute AOV from aggregated sales and orders
  const salesMap = new Map<string, number>();
  const ordersMap = new Map<string, number>();

  for (const record of aggregated) {
    const key = `${record.restaurantId}|${record.date}`;
    if (record.metricKey === 'sales') salesMap.set(key, record.value);
    if (record.metricKey === 'delivered_orders') ordersMap.set(key, record.value);
  }

  for (const record of aggregated) {
    if (record.metricKey === 'average_order_value') {
      const key = `${record.restaurantId}|${record.date}`;
      const sales = salesMap.get(key) || 0;
      const orders = ordersMap.get(key) || 0;
      record.value = orders > 0 ? sales / orders : 0;
    }
  }

  return aggregated;
}

// Compute summary for a set of records (single metric across restaurants/dates)
export function computeSummary(records: MetricRecord[], metricKey: string): number {
  const filtered = records.filter((r) => r.metricKey === metricKey);
  if (filtered.length === 0) return 0;

  const metricDef = getMetricDefinition(metricKey);

  if (metricKey === 'average_order_value') {
    const sales = records.filter((r) => r.metricKey === 'sales').reduce((s, r) => s + r.value, 0);
    const orders = records.filter((r) => r.metricKey === 'delivered_orders').reduce((s, r) => s + r.value, 0);
    return orders > 0 ? sales / orders : 0;
  }

  if (metricDef?.aggregation === 'sum') {
    return filtered.reduce((sum, r) => sum + r.value, 0);
  }

  if (metricDef?.aggregation === 'weighted_average' || metricDef?.aggregation === 'average') {
    const nonZero = filtered.filter((r) => r.value !== 0);
    return nonZero.length > 0
      ? nonZero.reduce((sum, r) => sum + r.value, 0) / nonZero.length
      : 0;
  }

  return filtered.reduce((sum, r) => sum + r.value, 0);
}

// Group records by date for trend charts
export function groupByDate(
  records: MetricRecord[],
  metricKey: string
): { date: string; value: number }[] {
  const dateMap = new Map<string, number[]>();

  for (const record of records) {
    if (record.metricKey !== metricKey) continue;
    if (!dateMap.has(record.date)) {
      dateMap.set(record.date, []);
    }
    dateMap.get(record.date)!.push(record.value);
  }

  const result: { date: string; value: number }[] = [];
  const metricDef = getMetricDefinition(metricKey);

  for (const [date, values] of dateMap) {
    let aggregated: number;
    if (metricDef?.aggregation === 'sum') {
      aggregated = values.reduce((s, v) => s + v, 0);
    } else {
      const nonZero = values.filter((v) => v !== 0);
      aggregated = nonZero.length > 0 ? nonZero.reduce((s, v) => s + v, 0) / nonZero.length : 0;
    }
    result.push({ date, value: aggregated });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// Group records by restaurant for comparison
export function groupByRestaurant(
  records: MetricRecord[],
  metricKey: string
): { restaurantId: string; value: number }[] {
  const restMap = new Map<string, number[]>();

  for (const record of records) {
    if (record.metricKey !== metricKey) continue;
    if (!restMap.has(record.restaurantId)) {
      restMap.set(record.restaurantId, []);
    }
    restMap.get(record.restaurantId)!.push(record.value);
  }

  const result: { restaurantId: string; value: number }[] = [];
  const metricDef = getMetricDefinition(metricKey);

  for (const [restaurantId, values] of restMap) {
    let aggregated: number;
    if (metricDef?.aggregation === 'sum') {
      aggregated = values.reduce((s, v) => s + v, 0);
    } else {
      const nonZero = values.filter((v) => v !== 0);
      aggregated = nonZero.length > 0 ? nonZero.reduce((s, v) => s + v, 0) / nonZero.length : 0;
    }
    result.push({ restaurantId, value: aggregated });
  }

  return result.sort((a, b) => b.value - a.value);
}
