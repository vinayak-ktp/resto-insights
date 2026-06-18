'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import Header from '@/components/layout/Header';
import CsvUploader from '@/components/upload/CsvUploader';
import { getUploadHistory, getTotalRecordCount } from '@/lib/db/queries';
import { clearAllData } from '@/lib/db/database';
import type { UploadRecord } from '@/types';
import { FileSpreadsheet, Trash2, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const [history, count] = await Promise.all([
        getUploadHistory(),
        getTotalRecordCount(),
      ]);
      setUploads(history);
      setTotalRecords(count);
    }
    load();
  }, [refreshKey]);

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      await clearAllData();
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <DashboardShell>
      <Header
        title="Upload Data"
        subtitle="Import Zomato business report CSVs"
        onMenuClick={() => {}}
        actions={
          totalRecords > 0 ? (
            <button onClick={handleClearData} className="btn-secondary text-sm" style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} />
              Clear All Data
            </button>
          ) : undefined
        }
      />

      {/* Stats */}
      {totalRecords > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ opacity: 0 }}>
          <div className="kpi-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <Database size={18} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Records</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {totalRecords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <FileSpreadsheet size={18} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Files Uploaded</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {uploads.length}
                </p>
              </div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--success-bg)' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</p>
                <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="mb-8">
        <CsvUploader onUploadComplete={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Upload Format Guide */}
      <div className="glass-card p-6 mb-8 animate-fade-in" style={{ opacity: 0, animationDelay: '0.1s' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          📋 Expected CSV Format
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent-primary)' }}>Required Columns</p>
            <div className="space-y-1">
              {['Restaurant ID', 'Restaurant name', 'Subzone', 'City', 'Overview', 'Metric'].map((col) => (
                <div key={col} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-primary)' }} />
                  <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {col}
                  </code>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: '#8b5cf6' }}>Supported Date Formats</p>
            <div className="space-y-2">
              <div className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Daily</p>
                <code className="text-xs" style={{ color: 'var(--text-muted)' }}>09 Jun, 2026</code>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Monthly</p>
                <code className="text-xs" style={{ color: 'var(--text-muted)' }}>Mar 2026</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      {uploads.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-in" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Upload History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Restaurants</th>
                  <th>Records</th>
                  <th>Date Range</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload, i) => (
                  <tr key={upload.id || i}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {upload.fileName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`metric-badge ${upload.status === 'success' ? 'positive' : upload.status === 'error' ? 'negative' : 'neutral'}`}
                      >
                        {upload.status === 'success' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        {upload.status}
                      </span>
                    </td>
                    <td className="text-sm">{upload.restaurantCount}</td>
                    <td className="text-sm">{upload.recordCount.toLocaleString()}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {upload.dateRangeStart} → {upload.dateRangeEnd}
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(upload.uploadedAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
