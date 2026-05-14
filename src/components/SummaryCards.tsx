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
} from 'lucide-react';

interface SummaryCardsProps {
  filteredRecords: any[];
  onCardClick?: (metric: string) => void;
  selectedMetrics?: string[];
}

export function SummaryCards({ filteredRecords, onCardClick, selectedMetrics = [] }: SummaryCardsProps) {
  const latest = filteredRecords[filteredRecords.length - 1];
  const previous = filteredRecords[filteredRecords.length - 2];

  const calculateTrend = (key: string) => {
    if (!latest || !previous || !latest[key] || !previous[key]) return null;
    const diff = latest[key] - previous[key];
    return {
      value: Math.abs(diff).toFixed(1),
      isUp: diff > 0,
      color: diff > 0 ? 'text-rose-500' : 'text-[var(--accent)]'
    };
  };

  const metrics = [
    { key: 'weight', label: '체중', unit: 'kg', icon: <Scale className="w-4 h-4" aria-hidden="true" /> },
    { key: 'skeletal_muscle', label: '근육량', unit: 'kg', icon: <Activity className="w-4 h-4" aria-hidden="true" /> },
    { key: 'body_fat_mass', label: '지방량', unit: 'kg', icon: <Heart className="w-4 h-4" aria-hidden="true" /> },
    { key: 'body_fat', label: '지방률', unit: '%', icon: <PieChart className="w-4 h-4" aria-hidden="true" /> },
    { key: 'visceral_fat_level', label: '내장지방', unit: 'LV', icon: <Zap className="w-4 h-4" aria-hidden="true" /> },
    { key: 'abdominal_fat_ratio', label: '복부비율', unit: '', icon: <Droplets className="w-4 h-4" aria-hidden="true" /> },
    { key: 'waist_circumference_belly', label: '복부둘레', unit: 'cm', icon: <Ruler className="w-4 h-4" aria-hidden="true" /> },
    { key: 'waist_circumference_beauty', label: '미용허리', unit: 'cm', icon: <Ruler className="w-4 h-4" aria-hidden="true" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" role="list" aria-label="건강 지표 요약">
      {metrics.map((m) => {
        const trend = calculateTrend(m.key);
        const isSelected = selectedMetrics.includes(m.key);

        return (
          <button
            key={m.key}
            role="listitem"
            onClick={() => onCardClick?.(m.key)}
            aria-pressed={isSelected}
            aria-label={`${m.label} ${latest ? latest[m.key] ?? '0' : '--'}${m.unit} — 차트에서 ${isSelected ? '제거' : '추가'}`}
            className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group active:scale-[0.97] bg-[var(--surface-1)] ${
              isSelected
                ? 'border-[var(--accent)] shadow-[var(--shadow-elevated)]'
                : 'border-[var(--border)] shadow-[var(--shadow-card)] hover:border-gray-200'
            }`}
          >
            {isSelected && (
              <div
                className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)]/5 rounded-full -mr-8 -mt-8"
                aria-hidden="true"
              />
            )}

            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
              isSelected
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)] group-hover:bg-[var(--accent-muted)] group-hover:text-[var(--accent)]'
            }`}>
              {m.icon}
            </div>

            <p className="text-xs font-bold mb-1 truncate text-[var(--text-muted)]">{m.label}</p>
            <div className="flex items-baseline gap-0.5 overflow-hidden">
              <span className={`text-base font-black tracking-tight transition-colors ${
                isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
              }`}>
                {latest ? (latest[m.key] !== undefined ? latest[m.key] : '0.0') : '--'}
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">{m.unit}</span>
            </div>

            {trend && (
              <div className={`mt-1.5 flex items-center gap-0.5 text-[10px] font-black ${trend.color}`}>
                {trend.isUp ? '↑' : '↓'} {trend.value}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
