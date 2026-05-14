"use client";

export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  History, TrendingUp, TrendingDown, Minus, PlusCircle, Activity,
  ClipboardList, ArrowRight, Scale, CalendarDays, Target, Dumbbell,
  Flame,
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
    <div className="bg-white/98 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-[var(--shadow-elevated)] px-4 py-3 min-w-[150px]">
      <p className="text-[11px] font-black text-[var(--text-muted)] mb-2 border-b border-[var(--border-subtle)] pb-2">{label}</p>
      {payload.filter((e: any) => e.dataKey !== 'trendWeight').map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[12px] font-bold text-[var(--text-secondary)]">{METRIC_LABELS[entry.dataKey as MetricKey]?.label}</span>
          </div>
          <span className="text-[13px] font-black text-[var(--text-primary)]">{entry.value}{METRIC_LABELS[entry.dataKey as MetricKey]?.unit}</span>
        </div>
      ))}
      {payload.find((e: any) => e.dataKey === 'trendWeight') && (
        <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-1 bg-[#0891b2] opacity-50 rounded shrink-0" />
            <span className="text-[11px] font-bold text-[var(--text-muted)]">추세</span>
          </div>
          <span className="text-[12px] font-bold text-[var(--text-muted)]">{payload.find((e: any) => e.dataKey === 'trendWeight')?.value}kg</span>
        </div>
      )}
    </div>
  );
}

function calcTrend(ys: number[]): { slope: number; intercept: number } | null {
  const n = ys.length;
  if (n < 3) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += ys[i];
    sumXY += i * ys[i]; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const userRecords     = useHealthStore((state) => state.userRecords);
  const currentUserId   = useHealthStore((state) => state.currentUserId);
  const getUserSettings = useHealthStore((state) => state.getUserSettings);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const settings = useMemo(() => getUserSettings(), [getUserSettings, currentUserId]);

  const records = useMemo(() => {
    const raw = userRecords[currentUserId] || [];
    return [...raw].filter(r => r.weight && r.weight > 0).sort((a, b) => a.date.localeCompare(b.date));
  }, [userRecords, currentUserId]);

  const [filter, setFilter] = useState<keyof typeof FILTER_LABELS>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['weight']);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (filter === 'all') return records;
    const lastDate = new Date(records[records.length - 1].date);
    const daysMap  = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - daysMap[filter]);
    return records.filter(r => new Date(r.date) >= cutoff);
  }, [records, filter]);

  // ── Weekly report ──────────────────────────────────────────────────
  const weeklyReport = useMemo(() => {
    if (!records.length) return null;
    const now = new Date();
    const thisMonday = startOfWeek(now);
    const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);

    const inRange = (date: string, from: Date, to: Date) => {
      const d = new Date(date);
      return d >= from && d <= to;
    };

    const thisWeek = records.filter(r => inRange(r.date, thisMonday, now));
    const lastWeek = records.filter(r => inRange(r.date, lastMonday, lastSunday));

    const avgWeight = (recs: typeof records) => {
      const w = recs.filter(r => r.weight > 0);
      return w.length ? parseFloat((w.reduce((s, r) => s + r.weight, 0) / w.length).toFixed(1)) : null;
    };

    const thisAvg = avgWeight(thisWeek);
    const lastAvg = avgWeight(lastWeek);
    const delta = thisAvg !== null && lastAvg !== null ? parseFloat((thisAvg - lastAvg).toFixed(1)) : null;

    return { thisAvg, lastAvg, delta, days: thisWeek.length };
  }, [records]);

  // ── Body composition ──────────────────────────────────────────────
  const compositionData = useMemo(() => {
    if (!records.length) return null;
    const latest = [...records].reverse().find(r => r.skeletal_muscle > 0 && r.body_fat_mass > 0 && r.weight > 0);
    if (!latest) return null;
    const muscle = latest.skeletal_muscle;
    const fat    = latest.body_fat_mass;
    const other  = Math.max(0, parseFloat((latest.weight - muscle - fat).toFixed(1)));
    return {
      date: latest.date,
      weight: latest.weight,
      items: [
        { name: '근육량', value: muscle, color: '#059669', pct: Math.round((muscle / latest.weight) * 100) },
        { name: '체지방', value: fat,    color: '#dc2626', pct: Math.round((fat    / latest.weight) * 100) },
        { name: '기타',   value: other,  color: '#94a3b8', pct: Math.round((other  / latest.weight) * 100) },
      ],
    };
  }, [records]);

  // ── Chart data with trend ─────────────────────────────────────────
  const chartData = useMemo(() => {
    const base = filteredRecords
      .filter(r => selectedMetrics.some(m => (r as any)[m] > 0))
      .map(r => ({
        date: r.date,
        weight:                     r.weight || null,
        skeletal_muscle:            r.skeletal_muscle || null,
        body_fat_mass:              r.body_fat_mass || null,
        body_fat:                   r.body_fat || null,
        visceral_fat_level:         r.visceral_fat_level || null,
        abdominal_fat_ratio:        r.abdominal_fat_ratio || null,
        waist_circumference_belly:  r.waist_circumference_belly || null,
        waist_circumference_beauty: r.waist_circumference_beauty || null,
        trendWeight: null as number | null,
      }));

    if (!selectedMetrics.includes('weight') || base.length < 3) return base;

    const weightYs = base.map(d => d.weight).filter((v): v is number => v !== null);
    const reg = calcTrend(weightYs);
    if (!reg) return base;

    const baseLen = base.length;
    base.forEach((d, i) => {
      d.trendWeight = parseFloat(Math.max(0, reg.slope * i + reg.intercept).toFixed(1));
    });

    // 4 weeks future prediction
    if (base.length > 0) {
      const lastDate = base[base.length - 1].date;
      for (let j = 1; j <= 4; j++) {
        base.push({
          date: addDays(lastDate, j * 7),
          weight: null, skeletal_muscle: null, body_fat_mass: null,
          body_fat: null, visceral_fat_level: null, abdominal_fat_ratio: null,
          waist_circumference_belly: null, waist_circumference_beauty: null,
          trendWeight: parseFloat(Math.max(0, reg.slope * (baseLen + j - 1) + reg.intercept).toFixed(1)),
        });
      }
    }
    return base;
  }, [filteredRecords, selectedMetrics]);

  // ── Trend prediction value (4 weeks out) ─────────────────────────
  const trendPrediction = useMemo(() => {
    const filteredDates = new Set(filteredRecords.map(r => r.date));
    const future = chartData.filter(d => !filteredDates.has(d.date));
    if (!future.length) return null;
    return future[future.length - 1]?.trendWeight ?? null;
  }, [chartData, filteredRecords]);

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

  if (records.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-[84px] px-5 sm:px-10 pb-28 md:pb-12 flex flex-col items-center justify-center min-h-[80dvh] animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-200 mb-6">
          <Activity className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] text-center tracking-tight mb-2">건강 기록을 시작해보세요</h1>
        <p className="text-[var(--text-muted)] text-center text-sm leading-relaxed mb-10 max-w-sm">
          체중·체성분 등 신체 측정값을 기록하면 변화 추이와 분석 데이터를 한눈에 확인할 수 있습니다.
        </p>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button onClick={() => setIsRecordModalOpen(true)} className="flex items-center gap-4 p-5 bg-gradient-to-br from-[var(--accent)] to-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-200 hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer text-left">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><PlusCircle className="w-5 h-5" /></div>
            <div><p className="font-black text-[15px]">직접 입력</p><p className="text-white/70 text-[12px] mt-0.5">수동으로 측정값 입력</p></div>
            <ArrowRight className="w-4 h-4 ml-auto shrink-0 opacity-70" />
          </button>
          <a href="/warehouse" className="flex items-center gap-4 p-5 bg-white border-2 border-[var(--border)] rounded-2xl shadow-[var(--shadow-card)] hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow-elevated)] transition-all active:scale-[0.98] cursor-pointer text-left">
            <div className="w-10 h-10 bg-[var(--accent-muted)] rounded-xl flex items-center justify-center shrink-0"><ClipboardList className="w-5 h-5 text-[var(--accent)]" /></div>
            <div><p className="font-black text-[15px] text-[var(--text-primary)]">자료실 이용</p><p className="text-[var(--text-muted)] text-[12px] mt-0.5">서류·메모 관리 및 AI 전송</p></div>
            <ArrowRight className="w-4 h-4 ml-auto shrink-0 text-[var(--text-muted)]" />
          </a>
        </div>
        <RecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
      </div>
    );
  }

  // ── Derived values for header chips ──────────────────────────────
  const latest  = records[records.length - 1];
  const prev    = records.length >= 2 ? records[records.length - 2] : null;
  const delta   = latest && prev ? parseFloat((latest.weight - prev.weight).toFixed(1)) : null;
  const target  = settings.targetWeight;
  const goalGap = target && latest ? parseFloat((latest.weight - target).toFixed(1)) : null;

  return (
    <div className="max-w-7xl mx-auto pt-[84px] md:pt-[84px] px-5 sm:px-10 pb-28 md:pb-12 space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-1">나의 건강 대시보드</p>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">건강 기록 분석</h1>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {latest?.weight ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-soft)] text-[12px] font-black text-[var(--accent)]">
                <Scale className="w-3 h-3" />
                {latest.weight} kg
              </span>
            ) : null}
            {delta !== null && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] font-black ${delta < 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : delta > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'}`}>
                {delta < 0 ? <TrendingDown className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {delta > 0 ? '+' : ''}{delta} kg
              </span>
            )}
            {goalGap !== null && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-black ${goalGap <= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                <Target className="w-3 h-3" />
                {goalGap <= 0 ? '목표 달성! 🎉' : `목표까지 -${goalGap} kg`}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[12px] font-bold text-[var(--text-muted)]">
              <CalendarDays className="w-3 h-3" />
              {records.length}일 기록
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white px-5 py-3 rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-cyan-200 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />오늘 기록하기
        </button>
      </header>

      {/* ── Filter bar ── */}
      <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-x-auto scrollbar-hide w-fit" role="group" aria-label="기간 필터">
        {(Object.keys(FILTER_LABELS) as (keyof typeof FILTER_LABELS)[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${filter === f ? 'bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white shadow-sm shadow-cyan-200' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards filteredRecords={filteredRecords} onCardClick={toggleMetric} selectedMetrics={selectedMetrics} />

      {/* ── Main chart ── */}
      <section aria-label="지표별 변화 추이" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 pb-0 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />멀티 트래킹 분석
            </p>
            <h2 className="text-lg font-black text-[var(--text-primary)]">지표별 변화 추이</h2>
            {trendPrediction && selectedMetrics.includes('weight') && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                현재 추세 기준 4주 후 <span className="font-black text-[var(--text-secondary)]">&nbsp;{trendPrediction}kg</span>&nbsp;예상
              </p>
            )}
          </div>
          {selectedMetrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMetrics.map(m => (
                <div key={m} className="px-3 py-1 rounded-full border border-[var(--border)] flex items-center gap-1.5 bg-[var(--surface-2)]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: METRIC_LABELS[m].color }} />
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">{METRIC_LABELS[m].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[380px] w-full px-2 py-4">
          {filteredRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  {selectedMetrics.map(m => (
                    <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={METRIC_LABELS[m].color} stopOpacity={0.35} />
                      <stop offset="50%"  stopColor={METRIC_LABELS[m].color} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={METRIC_LABELS[m].color} stopOpacity={0}    />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e0f2fe" strokeOpacity={0.8} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  dy={8}
                  interval={Math.ceil(chartData.length / 7)}
                />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip />} />
                {/* Goal weight reference line */}
                {target && selectedMetrics.includes('weight') && (
                  <ReferenceLine
                    y={target}
                    stroke="#7c3aed"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{ value: `목표 ${target}kg`, position: 'insideTopRight', fontSize: 10, fill: '#7c3aed', fontWeight: 700 }}
                  />
                )}
                {selectedMetrics.map(m => (
                  <Area
                    key={m}
                    type="monotone"
                    dataKey={m}
                    stroke={METRIC_LABELS[m].color}
                    strokeWidth={2.5}
                    fill={`url(#grad-${m})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: METRIC_LABELS[m].color }}
                    animationDuration={700}
                    connectNulls={false}
                  />
                ))}
                {/* Trend line */}
                {selectedMetrics.includes('weight') && trendPrediction && (
                  <Line
                    type="monotone"
                    dataKey="trendWeight"
                    stroke="#0891b2"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    strokeOpacity={0.5}
                    dot={false}
                    activeDot={false}
                    animationDuration={700}
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 border-2 border-dashed border-[var(--border)] rounded-2xl mx-4 p-8">
              <History className="w-10 h-10 opacity-20" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-[var(--text-secondary)]">선택한 기간에 데이터가 없습니다.</p>
                <p className="text-xs text-[var(--text-muted)]">기간 필터를 변경하거나 새 기록을 추가해보세요.</p>
              </div>
              <button onClick={() => setIsRecordModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer">
                <PlusCircle className="w-4 h-4" />기록 추가하기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Weekly report + Composition row ── */}
      {(weeklyReport || compositionData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Weekly report */}
          {weeklyReport && (
            <section aria-label="이번 주 리포트" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
                <CalendarDays className="w-3.5 h-3.5" />이번 주 리포트
              </p>
              <h2 className="text-base font-black text-[var(--text-primary)] mb-4">주간 체중 요약</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--accent-muted)] rounded-2xl p-4 text-center">
                  <p className="text-xl font-black text-[var(--accent)]">
                    {weeklyReport.thisAvg != null ? `${weeklyReport.thisAvg}` : '—'}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--accent)] opacity-70 mt-1">이번 주 평균 (kg)</p>
                </div>
                <div className={`rounded-2xl p-4 text-center ${
                  weeklyReport.delta == null ? 'bg-[var(--surface-2)]'
                  : weeklyReport.delta < 0 ? 'bg-emerald-50'
                  : weeklyReport.delta > 0 ? 'bg-rose-50'
                  : 'bg-[var(--surface-2)]'
                }`}>
                  <p className={`text-xl font-black ${
                    weeklyReport.delta == null ? 'text-[var(--text-muted)]'
                    : weeklyReport.delta < 0 ? 'text-emerald-600'
                    : weeklyReport.delta > 0 ? 'text-rose-500'
                    : 'text-[var(--text-muted)]'
                  }`}>
                    {weeklyReport.delta != null
                      ? (weeklyReport.delta > 0 ? `+${weeklyReport.delta}` : `${weeklyReport.delta}`)
                      : '—'}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">전주 대비 (kg)</p>
                </div>
                <div className="bg-violet-50 rounded-2xl p-4 text-center">
                  <p className="text-xl font-black text-violet-600">{weeklyReport.days}</p>
                  <p className="text-[10px] font-bold text-violet-400 mt-1">기록한 날 (일)</p>
                </div>
              </div>
            </section>
          )}

          {/* Body composition donut */}
          {compositionData && (
            <section aria-label="체성분 분석" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
                <Dumbbell className="w-3.5 h-3.5" />체성분 분석
              </p>
              <h2 className="text-base font-black text-[var(--text-primary)] mb-1">현재 체성분 비율</h2>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">기준일: {compositionData.date}</p>
              <div className="flex items-center gap-6">
                {/* Donut */}
                <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compositionData.items}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={65}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {compositionData.items.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[15px] font-black text-[var(--text-primary)] leading-none">{compositionData.weight}</p>
                    <p className="text-[9px] font-bold text-[var(--text-muted)]">kg</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2.5">
                  {compositionData.items.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[13px] font-bold text-[var(--text-secondary)]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] font-black text-[var(--text-primary)]">{item.value.toFixed(1)}<span className="text-[10px] font-bold text-[var(--text-muted)] ml-0.5">kg</span></span>
                        <span className="text-[11px] font-bold text-[var(--text-muted)] ml-1.5">({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <RecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
    </div>
  );
}
