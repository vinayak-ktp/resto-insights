'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMetricValue, formatChangePercent } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number;
  previousValue?: number;
  format: string;
  icon?: React.ReactNode;
  delay?: number;
}

export default function KpiCard({ label, value, previousValue, format: fmt, icon, delay = 0 }: KpiCardProps) {
  const change = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined;

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className="kpi-card animate-fade-in"
      style={{ animationDelay: `${delay * 0.08}s`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        {icon && (
          <div className="p-2 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {formatMetricValue(value, fmt)}
      </p>

      {change !== undefined && (
        <div className={cn(
          'metric-badge',
          isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'
        )}>
          {isPositive && <TrendingUp size={12} />}
          {isNegative && <TrendingDown size={12} />}
          {!isPositive && !isNegative && <Minus size={12} />}
          <span>{formatChangePercent(change)}</span>
        </div>
      )}
    </div>
  );
}
