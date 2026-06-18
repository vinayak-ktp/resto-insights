'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import Header from '@/components/layout/Header';
import { Download, FileText, FileSpreadsheet, File, Calendar, Store } from 'lucide-react';
import { getAllRestaurants, getMetricRecords } from '@/lib/db/queries';
import { METRIC_DEFINITIONS, METRIC_GROUPS, getMetricDefinition, getMetricsByGroup } from '@/lib/metrics/definitions';
import { computeSummary } from '@/lib/metrics/aggregation';
import { exportToCsv, exportToExcel, exportToPdf } from '@/lib/export/exportUtils';
import { formatMetricValue } from '@/lib/utils/format';
import type { MetricRecord, Restaurant, MetricGroup } from '@/types';

export default function ReportsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRecords, setAllRecords] = useState<MetricRecord[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MetricGroup | 'all'>('all');
  const [selectedRest, setSelectedRest] = useState('all');
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    async function load() {
      const [rests, records] = await Promise.all([
        getAllRestaurants(),
        getMetricRecords({}),
      ]);
      setRestaurants(rests);
      setAllRecords(records);

      if (records.length > 0) {
        const dates = records.map((r) => r.date).sort();
        setDateStart(dates[0]);
        setDateEnd(dates[dates.length - 1]);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const filteredRecords = useMemo(() => {
    let records = allRecords;
    if (dateStart) records = records.filter((r) => r.date >= dateStart);
    if (dateEnd) records = records.filter((r) => r.date <= dateEnd);
    if (selectedRest !== 'all') records = records.filter((r) => r.restaurantId === selectedRest);
    if (selectedGroup !== 'all') records = records.filter((r) => r.metricGroup === selectedGroup);
    return records;
  }, [allRecords, dateStart, dateEnd, selectedRest, selectedGroup]);

  // Summary table
  const summaryData = useMemo(() => {
    const relevantMetrics = selectedGroup === 'all'
      ? METRIC_DEFINITIONS
      : getMetricsByGroup(selectedGroup as MetricGroup);

    const restList = selectedRest === 'all' ? restaurants : restaurants.filter((r) => r.id === selectedRest);

    return restList.map((rest) => {
      const restRecords = filteredRecords.filter((r) => r.restaurantId === rest.id);
      const metrics: Record<string, number> = {};
      for (const def of relevantMetrics) {
        metrics[def.key] = computeSummary(restRecords, def.key);
      }
      return { restaurant: rest, metrics };
    }).sort((a, b) => (b.metrics.sales || 0) - (a.metrics.sales || 0));
  }, [filteredRecords, restaurants, selectedRest, selectedGroup]);

  const displayMetrics = useMemo(() => {
    if (selectedGroup === 'all') return METRIC_DEFINITIONS.filter(d => ['sales', 'delivered_orders', 'average_order_value', 'impressions'].includes(d.key));
    return getMetricsByGroup(selectedGroup as MetricGroup);
  }, [selectedGroup]);

  const restMap = useMemo(() => new Map(restaurants.map((r) => [r.id, r])), [restaurants]);

  const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
    setExporting(type);
    const filename = `zomato_report_${dateStart}_${dateEnd}`;
    try {
      if (type === 'csv') {
        exportToCsv(filteredRecords, restMap, filename);
      } else if (type === 'excel') {
        await exportToExcel(filteredRecords, restMap, filename);
      } else {
        await exportToPdf(filteredRecords, restMap, filename);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setTimeout(() => setExporting(''), 1500);
  };

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
      <Header title="Reports" subtitle="Export and download analytics reports" onMenuClick={() => {}} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="date" className="form-input" style={{ width: 150 }} value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <input type="date" className="form-input" style={{ width: 150 }} value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={selectedRest} onChange={(e) => setSelectedRest(e.target.value)}>
          <option value="all">All Restaurants</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.subzone}</option>)}
        </select>
        <select className="form-select" style={{ width: 180 }} value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as MetricGroup | 'all')}>
          <option value="all">All Metric Groups</option>
          {METRIC_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          className="glass-card p-6 text-left group cursor-pointer transition-all hover:scale-[1.01]"
          onClick={() => handleExport('csv')}
          disabled={exporting === 'csv'}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <FileText size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export CSV</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Comma-separated values</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {exporting === 'csv' ? '✓ Downloaded!' : `${filteredRecords.length.toLocaleString()} records`}
          </p>
        </button>

        <button
          className="glass-card p-6 text-left group cursor-pointer transition-all hover:scale-[1.01]"
          onClick={() => handleExport('excel')}
          disabled={exporting === 'excel'}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <FileSpreadsheet size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export Excel</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Styled .xlsx workbook</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {exporting === 'excel' ? '✓ Downloaded!' : `${filteredRecords.length.toLocaleString()} records`}
          </p>
        </button>

        <button
          className="glass-card p-6 text-left group cursor-pointer transition-all hover:scale-[1.01]"
          onClick={() => handleExport('pdf')}
          disabled={exporting === 'pdf'}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <File size={20} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export PDF</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Formatted report</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {exporting === 'pdf' ? '✓ Downloaded!' : `${filteredRecords.length.toLocaleString()} records`}
          </p>
        </button>
      </div>

      {/* Preview Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Report Preview
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {summaryData.length} restaurants • {filteredRecords.length.toLocaleString()} records
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: 500 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Restaurant</th>
                <th>City</th>
                {displayMetrics.map((def) => (
                  <th key={def.key} style={{ minWidth: 110, textAlign: 'right' }}>{def.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row) => (
                <tr key={row.restaurant.id}>
                  <td>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {row.restaurant.name}
                    </span>
                  </td>
                  <td className="text-xs">{row.restaurant.city}</td>
                  {displayMetrics.map((def) => (
                    <td key={def.key} style={{ textAlign: 'right' }}>
                      <span className="text-sm">{formatMetricValue(row.metrics[def.key] || 0, def.format)}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
