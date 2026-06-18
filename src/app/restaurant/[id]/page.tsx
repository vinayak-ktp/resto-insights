'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import Header from '@/components/layout/Header';
import KpiCard from '@/components/cards/KpiCard';
import TrendLineChart from '@/components/charts/TrendLineChart';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getRestaurantById } from '@/lib/db/queries';
import { db } from '@/lib/db/database';
import { METRIC_DEFINITIONS, METRIC_GROUPS, getMetricDefinition, getMetricsByGroup } from '@/lib/metrics/definitions';
import { aggregateRecords, computeSummary } from '@/lib/metrics/aggregation';
import { formatMetricValue } from '@/lib/utils/format';
import type { MetricRecord, Restaurant, Granularity, MetricGroup } from '@/types';

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allRecords, setAllRecords] = useState<MetricRecord[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [activeGroup, setActiveGroup] = useState<MetricGroup>('sales_overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('sales');

  useEffect(() => {
    async function load() {
      const rest = await getRestaurantById(id);
      setRestaurant(rest || null);

      const records = await db.metricRecords
        .where('restaurantId')
        .equals(id)
        .toArray();
      setAllRecords(records);

      const grans = new Set(records.map((r) => r.granularity));
      if (!grans.has('daily') && grans.has('monthly')) {
        setGranularity('monthly');
      }
    }
    load();
  }, [id]);

  const displayRecords = useMemo(() => {
    if (granularity === 'daily') {
      const daily = allRecords.filter((r) => r.granularity === 'daily');
      return daily.length > 0 ? daily : allRecords;
    }
    const agg = aggregateRecords(allRecords, granularity);
    return agg.length > 0 ? agg : allRecords;
  }, [allRecords, granularity]);

  // All metrics KPI values
  const metricValues = useMemo(() => {
    return METRIC_DEFINITIONS.map((def) => ({
      ...def,
      value: computeSummary(displayRecords, def.key),
    }));
  }, [displayRecords]);

  // Trend data for selected metric
  const trendData = useMemo(() => {
    const dateMap = new Map<string, number>();
    for (const r of displayRecords) {
      if (r.metricKey === selectedMetric) {
        dateMap.set(r.date, (dateMap.get(r.date) || 0) + r.value);
      }
    }
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [displayRecords, selectedMetric]);

  if (!restaurant) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading restaurant...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const selectedMetricDef = getMetricDefinition(selectedMetric);

  return (
    <DashboardShell>
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {restaurant.subzone}, {restaurant.city}
            </p>
          </div>
        </div>
      </div>

      {/* Granularity Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
          {(['daily', 'weekly', 'monthly'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className="px-4 py-2 text-xs font-semibold capitalize transition-all"
              style={{
                background: granularity === g ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: granularity === g ? 'white' : 'var(--text-secondary)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Group Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {METRIC_GROUPS.map((group) => (
          <button
            key={group.key}
            onClick={() => {
              setActiveGroup(group.key);
              const firstMetric = getMetricsByGroup(group.key)[0];
              if (firstMetric) setSelectedMetric(firstMetric.key);
            }}
            className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeGroup === group.key ? 'tab-active' : ''
            }`}
            style={{ color: activeGroup === group.key ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* KPI Cards for active group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricValues
          .filter((m) => m.group === activeGroup)
          .map((metric, i) => (
            <div
              key={metric.key}
              className="cursor-pointer"
              onClick={() => setSelectedMetric(metric.key)}
            >
              <KpiCard
                label={metric.label}
                value={metric.value}
                format={metric.format}
                delay={i}
              />
              {selectedMetric === metric.key && (
                <div className="h-0.5 mt-1 rounded-full" style={{ background: 'var(--accent-primary)' }} />
              )}
            </div>
          ))}
      </div>

      {/* Trend Chart */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedMetricDef?.label} Trend
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {granularity.charAt(0).toUpperCase() + granularity.slice(1)} data for {restaurant.name}
            </p>
          </div>
        </div>
        <TrendLineChart
          data={trendData.map((d) => ({ date: d.date, value: d.value }))}
          lines={[{ key: 'value', label: selectedMetricDef?.label || '' }]}
          format={selectedMetricDef?.format}
          height={360}
        />
      </div>

      {/* All Metrics Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            All Metrics Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Metric</th>
                <th style={{ textAlign: 'right' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {metricValues.map((metric) => (
                <tr
                  key={metric.key}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedMetric(metric.key);
                    setActiveGroup(metric.group);
                  }}
                  style={{
                    background: selectedMetric === metric.key ? 'rgba(6, 182, 212, 0.05)' : undefined,
                  }}
                >
                  <td>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      {metric.groupLabel}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {metric.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      {formatMetricValue(metric.value, metric.format)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
