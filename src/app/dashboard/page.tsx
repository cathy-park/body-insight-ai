"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  History,
  TrendingUp,
} from 'lucide-react';
import { AIAnalysis } from '@/components/AIAnalysis';
import { SummaryCards } from '@/components/SummaryCards';
import { UploadCSV } from '@/components/UploadCSV';

type MetricKey = 'weight' | 'skeletal_muscle' | 'body_fat_mass' | 'body_fat' | 'visceral_fat_level' | 'abdominal_fat_ratio' | 'waist_circumference_belly' | 'waist_circumference_beauty';

const METRIC_LABELS: Record<MetricKey, { label: string, color: string, unit: string }> = {
  weight: { label: '체중', color: '#2563eb', unit: 'kg' },
  skeletal_muscle: { label: '근육량', color: '#10b981', unit: 'kg' },
  body_fat_mass: { label: '지방량', color: '#f59e0b', unit: 'kg' },
  body_fat: { label: '지방률', color: '#ef4444', unit: '%' },
  visceral_fat_level: { label: '내장지방', color: '#8b5cf6', unit: 'LV' },
  abdominal_fat_ratio: { label: '복부비율', color: '#ec4899', unit: '' },
  waist_circumference_belly: { label: '복부둘레', color: '#06b6d4', unit: 'cm' },
  waist_circumference_beauty: { label: '미용허리', color: '#14b8a6', unit: 'cm' },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const userRecords = useHealthStore((state) => state.userRecords);
  const currentUserId = useHealthStore((state) => state.currentUserId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const records = useMemo(() => {
    const raw = userRecords[currentUserId] || [];
    // 체중이 0보다 큰 유효 레코드만 걸러서 대시보드 데이터로 사용합니다. (모바일 0점 데이터 방어)
    return [...raw]
      .filter(r => r.weight && r.weight > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [userRecords, currentUserId]);

  const [filter, setFilter] = useState<'30d' | '3m' | '6m' | '1y' | 'all'>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['weight']);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (filter === 'all') return records;
    const lastRecordDate = new Date(records[records.length - 1].date);
    const daysMap = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
    const cutoffDate = new Date(lastRecordDate);
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[filter]);
    return records.filter(r => new Date(r.date) >= cutoffDate);
  }, [records, filter]);

  const chartData = useMemo(() => filteredRecords
    .filter(r => selectedMetrics.some(m => r[m] > 0))
    .map(r => ({
      date: r.date,
      weight: r.weight || null,
      skeletal_muscle: r.skeletal_muscle || null,
      body_fat_mass: r.body_fat_mass || null,
      body_fat: r.body_fat || null,
      visceral_fat_level: r.visceral_fat_level || null,
      abdominal_fat_ratio: r.abdominal_fat_ratio || null,
      waist_circumference_belly: r.waist_circumference_belly || null,
      waist_circumference_beauty: r.waist_circumference_beauty || null,
    })), [filteredRecords, selectedMetrics]);

  const toggleMetric = (metric: string) => {
    const key = metric as MetricKey;
    if (selectedMetrics.includes(key)) {
      if (selectedMetrics.length > 1) setSelectedMetrics(selectedMetrics.filter(m => m !== key));
    } else {
      setSelectedMetrics([...selectedMetrics, key]);
    }
  };

  const filterLabels: Record<typeof filter, string> = {
    '30d': '30일', '3m': '3개월', '6m': '6개월', '1y': '1년', 'all': '전체'
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto pt-[92px] md:pt-[112px] px-5 sm:px-10 pb-24 text-center text-[var(--text-muted)] font-bold">
        건강 데이터를 로딩 중입니다...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-[92px] md:pt-[112px] px-5 sm:px-10 pb-24 space-y-8">
      
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">나의 건강 대시보드</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">현재 당신의 건강 상태를 한눈에 확인하세요.</p>
      </header>

      {/* Filter bar + Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="flex bg-[var(--surface-1)] p-1 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-x-auto scrollbar-hide"
          role="group"
          aria-label="기간 필터"
        >
          {(['30d', '3m', '6m', '1y', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-4 py-2 rounded-2xl text-[13px] font-bold transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-[var(--text-primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        <UploadCSV />
      </div>

      {/* Summary cards */}
      <SummaryCards
        filteredRecords={filteredRecords}
        onCardClick={toggleMetric}
        selectedMetrics={selectedMetrics}
      />

      {/* Chart card */}
      <section
        aria-label="지표별 변화 추이 차트"
        className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              멀티 트래킹 분석
            </p>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">지표별 변화 추이</h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="선택된 지표">
            {selectedMetrics.map(m => (
              <div
                key={m}
                className="bg-[var(--surface-2)] px-3 py-1.5 rounded-full border border-[var(--border)] flex items-center gap-1.5"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: METRIC_LABELS[m].color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-[var(--text-secondary)]">{METRIC_LABELS[m].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[420px] w-full">
          {filteredRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                  interval={Math.ceil(filteredRecords.length / 10)}
                />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-elevated)',
                    padding: '12px 16px',
                    backgroundColor: 'var(--surface-1)',
                  }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}
                  formatter={(value: any) => [`${value}`, '']}
                />
                {selectedMetrics.map(m => (
                  <Line
                    key={m}
                    type="monotone"
                    dataKey={m}
                    stroke={METRIC_LABELS[m].color}
                    strokeWidth={2}
                    dot={{ r: 2, fill: METRIC_LABELS[m].color, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: METRIC_LABELS[m].color }}
                    animationDuration={800}
                    name={METRIC_LABELS[m].label}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 border-2 border-dashed border-[var(--border)] rounded-2xl">
              <History className="w-10 h-10 opacity-30" aria-hidden="true" />
              <p className="text-sm">기록된 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
