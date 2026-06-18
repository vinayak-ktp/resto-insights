'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatMetricValue } from '@/lib/utils/format';

const CHART_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

interface TrendLineChartProps {
  data: { date: string; [key: string]: string | number }[];
  lines: { key: string; label: string; color?: string }[];
  format?: string;
  height?: number;
}

export default function TrendLineChart({ data, lines, format: fmt = 'number', height = 320 }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available for chart</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="animate-fade-in" style={{ opacity: 0, animationDelay: '0.2s' }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <defs>
            {lines.map((line, i) => (
              <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={line.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatMetricValue(v, fmt)}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              padding: '12px',
            }}
            labelStyle={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}
            labelFormatter={(label) => {
              const d = new Date(String(label));
              return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            }}
            formatter={(value) => [formatMetricValue(Number(value), fmt), '']}
            itemStyle={{ color: '#0f172a', fontSize: 13 }}
          />
          {lines.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#64748b' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {lines.map((line, i) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color || CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }}
              fillOpacity={1}
              fill={`url(#gradient-${line.key})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
