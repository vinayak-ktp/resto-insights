'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatMetricValue } from '@/lib/utils/format';

const CHART_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

interface ComparisonBarChartProps {
  data: { name: string; value: number; label?: string }[];
  format?: string;
  height?: number;
  layout?: 'vertical' | 'horizontal';
}

export default function ComparisonBarChart({
  data,
  format: fmt = 'number',
  height = 320,
  layout = 'vertical',
}: ComparisonBarChartProps) {
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

  const truncateName = (name: string, maxLen = 18) => {
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen) + '…';
  };

  if (layout === 'horizontal') {
    return (
      <div className="animate-fade-in" style={{ opacity: 0, animationDelay: '0.2s' }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 30, left: 120, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatMetricValue(v, fmt)}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: '#475569', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={110}
              tickFormatter={truncateName}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
              formatter={(value) => [formatMetricValue(Number(value), fmt), '']}
              labelStyle={{ color: '#64748b', fontSize: 12 }}
              itemStyle={{ color: '#0f172a' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ opacity: 0, animationDelay: '0.2s' }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={60}
            tickFormatter={truncateName}
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
            }}
            formatter={(value) => [formatMetricValue(Number(value), fmt), '']}
            labelStyle={{ color: '#64748b', fontSize: 12 }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
