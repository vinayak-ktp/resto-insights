'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import Header from '@/components/layout/Header';
import TrendLineChart from '@/components/charts/TrendLineChart';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import { GitCompareArrows, Calendar, ArrowRightLeft } from 'lucide-react';
import { getAllRestaurants, getMetricRecords } from '@/lib/db/queries';
import { METRIC_DEFINITIONS, getMetricDefinition } from '@/lib/metrics/definitions';
import { compareDateRanges, getRestaurantComparisonTrend } from '@/lib/metrics/comparison';
import { computeSummary } from '@/lib/metrics/aggregation';
import { formatMetricValue, formatChangePercent } from '@/lib/utils/format';
import type { MetricRecord, Restaurant, ComparisonMode } from '@/types';

export default function ComparePage() {
  const [mode, setMode] = useState<ComparisonMode>('restaurant');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRecords, setAllRecords] = useState<MetricRecord[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('sales');
  const [restA, setRestA] = useState('');
  const [restB, setRestB] = useState('');
  const [periodAStart, setPeriodAStart] = useState('');
  const [periodAEnd, setPeriodAEnd] = useState('');
  const [periodBStart, setPeriodBStart] = useState('');
  const [periodBEnd, setPeriodBEnd] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [rests, records] = await Promise.all([
        getAllRestaurants(),
        getMetricRecords({}),
      ]);
      setRestaurants(rests);
      setAllRecords(records);

      if (rests.length >= 2) {
        setRestA(rests[0].id);
        setRestB(rests[1].id);
      }

      if (records.length > 0) {
        const dates = records.map((r) => r.date).sort();
        setPeriodAStart(dates[0]);
        setPeriodAEnd(dates[Math.floor(dates.length / 2)]);
        setPeriodBStart(dates[Math.floor(dates.length / 2)]);
        setPeriodBEnd(dates[dates.length - 1]);
      }

      setLoaded(true);
    }
    load();
  }, []);

  const selectedMetricDef = getMetricDefinition(selectedMetric);

  // Restaurant Comparison
  const restaurantComparisonChart = useMemo((): {
    trendData: { date: string; [key: string]: string | number }[];
    barData: { name: string; value: number }[];
    lines?: { key: string; label: string; color: string }[];
  } => {
    if (mode !== 'restaurant' || !restA || !restB) return { trendData: [], barData: [] };

    const restMap = new Map(restaurants.map((r) => [r.id, r]));
    const dates = allRecords.map((r) => r.date).sort();
    const dateRange = { start: dates[0] || '', end: dates[dates.length - 1] || '' };

    const trends = getRestaurantComparisonTrend(allRecords, selectedMetric, [restA, restB], dateRange);

    // Build chart data
    const allDates = new Set<string>();
    trends.forEach((t) => t.forEach((p) => allDates.add(p.date)));

    const sortedDates = Array.from(allDates).sort();
    const trendData: { date: string; [key: string]: string | number }[] = sortedDates.map((date) => {
      const point: { date: string; [key: string]: string | number } = { date };
      for (const [restId, trend] of trends) {
        const d = trend.find((t) => t.date === date);
        const restName = restMap.get(restId)?.name || restId;
        point[restName] = d?.value || 0;
      }
      return point;
    });

    const restAName = restMap.get(restA)?.name || restA;
    const restBName = restMap.get(restB)?.name || restB;

    const valA = computeSummary(allRecords.filter((r) => r.restaurantId === restA), selectedMetric);
    const valB = computeSummary(allRecords.filter((r) => r.restaurantId === restB), selectedMetric);

    const barData = [
      { name: restAName, value: valA },
      { name: restBName, value: valB },
    ];

    return {
      trendData,
      barData,
      lines: [
        { key: restAName, label: restAName, color: '#06b6d4' },
        { key: restBName, label: restBName, color: '#8b5cf6' },
      ],
    };
  }, [mode, restA, restB, selectedMetric, allRecords, restaurants]);

  // Date Range Comparison
  const dateRangeComparison = useMemo(() => {
    if (mode !== 'dateRange' || !periodAStart || !periodAEnd || !periodBStart || !periodBEnd) return [];

    const restIds = restaurants.map((r) => r.id);
    return METRIC_DEFINITIONS.filter(d => d.key !== 'average_order_value').map((def) => {
      const result = compareDateRanges(
        allRecords,
        def.key,
        restIds,
        { start: periodAStart, end: periodAEnd },
        { start: periodBStart, end: periodBEnd }
      );
      return { ...result, format: def.format, key: def.key };
    });
  }, [mode, allRecords, restaurants, periodAStart, periodAEnd, periodBStart, periodBEnd]);

  if (!loaded) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Header title="Compare" subtitle="Restaurant vs Restaurant • Date Range vs Date Range" onMenuClick={() => {}} />

      {/* Mode Toggle */}
      <div className="flex gap-3 mb-6">
        <button
          className={mode === 'restaurant' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setMode('restaurant')}
        >
          <GitCompareArrows size={16} />
          Restaurant Comparison
        </button>
        <button
          className={mode === 'dateRange' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setMode('dateRange')}
        >
          <Calendar size={16} />
          Date Range Comparison
        </button>
      </div>

      {/* Restaurant Comparison */}
      {mode === 'restaurant' && (
        <div className="animate-fade-in" style={{ opacity: 0 }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select className="form-select" style={{ width: 250 }} value={restA} onChange={(e) => setRestA(e.target.value)}>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.subzone}</option>)}
            </select>
            <ArrowRightLeft size={18} style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 250 }} value={restB} onChange={(e) => setRestB(e.target.value)}>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.subzone}</option>)}
            </select>
            <select className="form-select" style={{ width: 200 }} value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
              {METRIC_DEFINITIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-5">
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {selectedMetricDef?.label} Trend Comparison
              </h3>
              <TrendLineChart
                data={restaurantComparisonChart.trendData}
                lines={restaurantComparisonChart.lines || []}
                format={selectedMetricDef?.format}
              />
            </div>
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Total {selectedMetricDef?.label}
              </h3>
              <ComparisonBarChart
                data={restaurantComparisonChart.barData}
                format={selectedMetricDef?.format}
              />
            </div>
          </div>
        </div>
      )}

      {/* Date Range Comparison */}
      {mode === 'dateRange' && (
        <div className="animate-fade-in" style={{ opacity: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>Period A</p>
              <div className="flex items-center gap-2">
                <input type="date" className="form-input" value={periodAStart} onChange={(e) => setPeriodAStart(e.target.value)} />
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <input type="date" className="form-input" value={periodAEnd} onChange={(e) => setPeriodAEnd(e.target.value)} />
              </div>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: '#8b5cf6' }}>Period B</p>
              <div className="flex items-center gap-2">
                <input type="date" className="form-input" value={periodBStart} onChange={(e) => setPeriodBStart(e.target.value)} />
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <input type="date" className="form-input" value={periodBEnd} onChange={(e) => setPeriodBEnd(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Comparison Results Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Period Comparison — All Metrics
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: 'right' }}>Period A</th>
                    <th style={{ textAlign: 'right' }}>Period B</th>
                    <th style={{ textAlign: 'right' }}>Change</th>
                    <th style={{ textAlign: 'right' }}>% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRangeComparison.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {row.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>
                          {formatMetricValue(row.valueA, row.format)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="text-sm" style={{ color: '#8b5cf6' }}>
                          {formatMetricValue(row.valueB, row.format)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="text-sm" style={{ color: row.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {row.delta >= 0 ? '+' : ''}{formatMetricValue(row.delta, row.format)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`metric-badge ${row.deltaPercent >= 0 ? 'positive' : 'negative'}`}>
                          {formatChangePercent(row.deltaPercent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
