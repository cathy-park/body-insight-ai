"use client";

import React from 'react';
import {
  Scale,
  Activity,
  Heart,
  PieChart,
  Zap,
  Droplets,
  Ruler,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface SummaryCardsProps {
  filteredRecords: any[];
  onCardClick?: (metric: string) => void;
  selectedMetrics?: string[];
}

const METRICS = [
  { key: 'weight',                    label: '체중',     unit: 'kg',  icon: Scale,     color: '#0891b2', bg: 'bg-cyan-50',    text: 'text-cyan-600' },
  { key: 'skeletal_muscle',           label: '근육량',   unit: 'kg',  icon: Activity,  color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'body_fat_mass',             label: '지방량',   unit: 'kg',  icon: Heart,     color: '#d97706', bg: 'bg-amber-50',   text: 'text-amber-600' },
  { key: 'body_fat',                  label: '지방률',   unit: '%',   icon: PieChart,  color: '#dc2626', bg: 'bg-rose-50',    text: 'text-rose-600' },
  { key: 'visceral_fat_level',        label: '내장지방', unit: 'LV',  icon: Zap,       color: '#7c3aed', bg: 'bg-violet-50',  text: 'text-violet-600' },
  { key: 'abdominal_fat_ratio',       label: '복부비율', unit: '',    icon: Droplets,  color: '#db2777', bg: 'bg-pink-50',    text: 'text-pink-600' },
  { key: 'waist_circumference_belly', label: '복부둘레', unit: 'cm',  icon: Ruler,     color: '#0891b2', bg: 'bg-cyan-50',    text: 'text-cyan-600' },
  { key: 'waist_circumference_beauty',label: '미용허리', unit: 'cm',  icon: Ruler,     color: '#0d9488', bg: 'bg-teal-50',    text: 'text-teal-600' },
] as const;

const isGoodTrend = (key: string, isUp: boolean) => {
  if (key === 'skeletal_muscle') return isUp;
  return !isUp;
};

export function SummaryCards({ filteredRecords, onCardClick, selectedMetrics = [] }: SummaryCardsProps) {
  const latest   = filteredRecords[filteredRecords.length - 1];
  const previous = filteredRecords[filteredRecords.length - 2];

  const calculateTrend = (key: string) => {
    if (!latest || !previous || !latest[key] || !previous[key]) return null;
    const diff = latest[key] - previous[key];
    return { value: Math.abs(diff).toFixed(1), isUp: diff > 0 };
  };

  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-5 sm:-mx-10 px-5 sm:px-10 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-8"
      role="list"
      aria-label="건강 지표 요약"
    >
      {METRICS.map((m) => {
        const trend      = calculateTrend(m.key);
        const isSelected = selectedMetrics.includes(m.key);
        const value      = latest?.[m.key];
        const Icon       = m.icon;

        return (
          <button
            key={m.key}
            role="listitem"
            onClick={() => onCardClick?.(m.key)}
            aria-pressed={isSelected}
            aria-label={`${m.label} ${value ?? '--'}${m.unit} — 차트에서 ${isSelected ? '제거' : '추가'}`}
            className={`shrink-0 w-[136px] md:w-auto p-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden group active:scale-[0.96] cursor-pointer ${
              isSelected
                ? 'border-[var(--accent)] bg-white shadow-[var(--shadow-elevated)]'
                : 'border-[var(--border)] bg-white shadow-[var(--shadow-card)] hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow-elevated)]'
            }`}
          >
            {isSelected && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${m.color}12 0%, transparent 60%)` }}
                aria-hidden="true"
              />
            )}

            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
              isSelected ? m.bg : 'bg-[var(--surface-2)]'
            }`}>
              <Icon
                className={`w-4 h-4 transition-colors ${isSelected ? m.text : 'text-[var(--text-muted)]'}`}
                aria-hidden="true"
              />
            </div>

            <p className="text-[11px] font-bold mb-1 text-[var(--text-muted)] truncate">{m.label}</p>

            <div className="flex items-baseline gap-0.5 overflow-hidden">
              <span className={`text-[17px] font-black tracking-tight transition-colors ${
                isSelected ? m.text : 'text-[var(--text-primary)]'
              }`}>
                {value !== undefined && value !== null && value !== 0
                  ? value
                  : latest ? '0.0' : '--'}
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">{m.unit}</span>
            </div>

            {trend && (
              <div className={`mt-1.5 flex items-center gap-0.5 text-[10px] font-black ${
                isGoodTrend(m.key, trend.isUp) ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              }`}>
                {trend.isUp
                  ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  : <TrendingDown className="w-3 h-3" aria-hidden="true" />
                }
                {trend.value}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
