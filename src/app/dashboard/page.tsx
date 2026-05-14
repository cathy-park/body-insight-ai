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
  AreaChart,
  Area,
} from 'recharts';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
  Activity,
  ClipboardList,
  ArrowRight,
  Scale,
  CalendarDays,
} from 'lucide-react';
import { SummaryCards } from '@/components/SummaryCards';
import { RecordModal } from '@/components/RecordModal';

type MetricKey = 'weight' | 'skeletal_muscle' | 'body_fat_mass' | 'body_fat' | 'visceral_fat_level' | 'abdominal_fat_ratio' | 'waist_circumference_belly' | 'waist_circumference_beauty';

const METRIC_LABELS: Record<MetricKey, { label: string; color: string; unit: string }> = {
  weight:                    { label: '체중',     color: '#0891b2', unit: 'kg' },
  skeletal_muscle:           { label: '근육량',   color: '#059669', unit: 'kg' },
  body_fat_mass:             { label: '지방량',   color: '#d97706', unit: 'kg' },
  body_fat:                  { label: '지방률',   color: '#dc2626', unit: '%'  },
  visceral_fat_level:        { label: '내장지방', color: '#7c3aed', unit: 'LV' },
  abdominal_fat_ratio:       { label: '복부비율', color: '#db2777', unit: ''   },
  waist_circumference_belly: { label: '복부둘레', color: '#0891b2', unit: 'cm' },
  waist_circumference_beauty:{ label: '미용허리', color: '#0d9488', unit: 'cm' },
};

const FILTER_LABELS = { '30d': '30일', '3m': '3개월', '6m': '6개월', '1y': '1년', 'all': '전체' } as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-[var(--shadow-elevated)] px-4 py-3 min-w-[140px]">
      <p className="text-[11px] font-bold text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[12px] font-bold text-[var(--text-secondary)]">{METRIC_LABELS[entry.dataKey as MetricKey]?.label}</span>
          </div>
          <span className="text-[13px] font-black text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const userRecords  = useHealthStore((state) => state.userRecords);
  const currentUserId = useHealthStore((state) => state.currentUserId);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const records = useMemo(() => {
    const raw = userRecords[currentUserId] || [];
    return [...raw]
      .filter(r => r.weight && r.weight > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [userRecords, currentUserId]);

  const [filter, setFilter]               = useState<keyof typeof FILTER_LABELS>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['weight']);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (filter === 'all') return records;
    const lastDate = new Date(records[records.length - 1].date);
    const daysMap  = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
    const cutoff   = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - daysMap[filter]);
    return records.filter(r => new Date(r.date) >= cutoff);
  }, [records, filter]);

  const chartData = useMemo(() => filteredRecords
    .filter(r => selectedMetrics.some(m => r[m] > 0))
    .map(r => ({
      date: r.date,
      weight:                    r.weight || null,
      skeletal_muscle:           r.skeletal_muscle || null,
      body_fat_mass:             r.body_fat_mass || null,
      body_fat:                  r.body_fat || null,
      visceral_fat_level:        r.visceral_fat_level || null,
      abdominal_fat_ratio:       r.abdominal_fat_ratio || null,
      waist_circumference_belly: r.waist_circumference_belly || null,
      waist_circumference_beauty:r.waist_circumference_beauty || null,
    })), [filteredRecords, selectedMetrics]);

  const toggleMetric = (metric: string) => {
    const key = metric as MetricKey;
    if (selectedMetrics.includes(key)) {
      if (selectedMetrics.length > 1) setSelectedMetrics(prev => prev.filter(m => m !== key));
    } else {
      setSelectedMetrics(prev => [...prev, key]);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto pt-[84px] px-5 sm:px-10 pb-28 space-y-4">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  /* ── 온보딩: 기록이 하나도 없을 때 ── */
  if (records.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-[84px] px-5 sm:px-10 pb-28 md:pb-12 flex flex-col items-center justify-center min-h-[80dvh] animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-200 mb-6">
          <Activity className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] text-center tracking-tight mb-2">
          건강 기록을 시작해보세요
        </h1>
        <p className="text-[var(--text-muted)] text-center text-sm leading-relaxed mb-10 max-w-sm">
          체중·체성분 등 신체 측정값을 기록하면 변화 추이와 분석 데이터를 한눈에 확인할 수 있습니다.
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-4 p-5 bg-gradient-to-br from-[var(--accent)] to-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-200 hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer text-left"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-[15px]">직접 입력</p>
              <p className="text-white/70 text-[12px] mt-0.5">수동으로 측정값 입력</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto shrink-0 opacity-70" aria-hidden="true" />
          </button>

          <a
            href="/warehouse"
            className="flex items-center gap-4 p-5 bg-white border-2 border-[var(--border)] rounded-2xl shadow-[var(--shadow-card)] hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow-elevated)] transition-all active:scale-[0.98] cursor-pointer text-left"
          >
            <div className="w-10 h-10 bg-[var(--accent-muted)] rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-[15px] text-[var(--text-primary)]">자료실 이용</p>
              <p className="text-[var(--text-muted)] text-[12px] mt-0.5">서류·메모 관리 및 AI 전송</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          </a>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] text-center">
          인바디 측정 후 수치를 그대로 입력하거나, 삼성 헬스에서 자동 연동할 수 있습니다.
        </p>

        <RecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-[84px] md:pt-[84px] px-5 sm:px-10 pb-28 md:pb-12 space-y-6 animate-fade-up">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-1">
            나의 건강 대시보드
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            건강 기록 분석
          </h1>
          {/* Summary stat chips */}
          {(() => {
            const latest = records[records.length - 1];
            const prev   = records.length >= 2 ? records[records.length - 2] : null;
            const delta  = latest && prev && latest.weight && prev.weight
              ? +(latest.weight - prev.weight).toFixed(1)
              : null;
            return (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {latest?.weight ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-soft)] text-[12px] font-black text-[var(--accent)]">
                    <Scale className="w-3 h-3" aria-hidden="true" />
                    {latest.weight} kg
                  </span>
                ) : null}
                {delta !== null ? (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] font-black ${
                    delta < 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : delta > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                    {delta < 0
                      ? <TrendingDown className="w-3 h-3" aria-hidden="true" />
                      : delta > 0
                        ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        : <Minus className="w-3 h-3" aria-hidden="true" />}
                    {delta > 0 ? '+' : ''}{delta} kg
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[12px] font-bold text-[var(--text-muted)]">
                  <CalendarDays className="w-3 h-3" aria-hidden="true" />
                  {records.length}일 기록
                </span>
              </div>
            );
          })()}
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white px-5 py-3 rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-cyan-200 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          오늘 기록하기
        </button>
      </header>

      {/* Filter bar */}
      <div
        className="flex bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-x-auto scrollbar-hide w-fit"
        role="group"
        aria-label="기간 필터"
      >
        {(Object.keys(FILTER_LABELS) as (keyof typeof FILTER_LABELS)[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              filter === f
                ? 'bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white shadow-sm shadow-cyan-200'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
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
        className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="p-6 pb-0 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              멀티 트래킹 분석
            </p>
            <h2 className="text-lg font-black text-[var(--text-primary)]">지표별 변화 추이</h2>
          </div>

          {selectedMetrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="선택된 지표">
              {selectedMetrics.map(m => (
                <div
                  key={m}
                  className="px-3 py-1 rounded-full border border-[var(--border)] flex items-center gap-1.5 bg-[var(--surface-2)]"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: METRIC_LABELS[m].color }}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {METRIC_LABELS[m].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[360px] w-full px-2 py-4">
          {filteredRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  {selectedMetrics.map(m => (
                    <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={METRIC_LABELS[m].color} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={METRIC_LABELS[m].color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={8}
                  interval={Math.ceil(filteredRecords.length / 8)}
                />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<CustomTooltip />} />
                {selectedMetrics.map(m => (
                  <Area
                    key={m}
                    type="monotone"
                    dataKey={m}
                    stroke={METRIC_LABELS[m].color}
                    strokeWidth={2.5}
                    fill={`url(#grad-${m})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: METRIC_LABELS[m].color }}
                    animationDuration={600}
                    name={METRIC_LABELS[m].label}
                    connectNulls={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 border-2 border-dashed border-[var(--border)] rounded-2xl mx-4 p-8">
              <History className="w-10 h-10 opacity-20" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-[var(--text-secondary)]">아직 기록된 건강 데이터가 없습니다.</p>
                <p className="text-xs text-[var(--text-muted)]">인바디, 삼성 헬스 데이터 등을 첫 기록해 보세요!</p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                첫 데이터 입력하러 가기
              </button>
            </div>
          )}
        </div>
      </section>

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </div>
  );
}
