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
  Flame, ChevronDown, ChevronLeft, ChevronRight, Pencil,
} from 'lucide-react';
import { SummaryCards } from '@/components/SummaryCards';
import { RecordModal } from '@/components/RecordModal';
import { BodySignalSection } from '@/components/BodySignalSection';
import {
  computeWeeklyCompositionReport,
  getDeltaColorClass,
  getDeltaDirection,
  formatDeltaShort,
  generateWeeklySummaryComment,
  WEEKLY_STATUS_STYLES,
  type WeeklyCompositionReport,
} from '@/lib/weeklyReport';

type MetricKey = 'weight' | 'skeletal_muscle' | 'body_fat_mass' | 'body_fat' | 'visceral_fat_level' | 'abdominal_fat_ratio' | 'waist_circumference_belly' | 'waist_circumference_beauty';

const METRIC_LABELS: Record<MetricKey, { label: string; color: string; unit: string }> = {
  weight: { label: '체중', color: '#0891b2', unit: 'kg' },
  skeletal_muscle: { label: '근육량', color: '#059669', unit: 'kg' },
  body_fat_mass: { label: '지방량', color: '#d97706', unit: 'kg' },
  body_fat: { label: '지방률', color: '#dc2626', unit: '%' },
  visceral_fat_level: { label: '내장지방', color: '#7c3aed', unit: 'LV' },
  abdominal_fat_ratio: { label: '복부비율', color: '#db2777', unit: '' },
  waist_circumference_belly: { label: '복부둘레', color: '#0891b2', unit: 'cm' },
  waist_circumference_beauty: { label: '미용허리', color: '#0d9488', unit: 'cm' },
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

function calcTrend(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 3) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const { x, y } = points[i];
    sumX += x; sumY += y;
    sumXY += x * y; sumX2 += x * x;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// 날짜 오름차순 정렬된 weight 기록 배열의 선형회귀 기울기(일평균 변화량)를 반환.
function dailySlope(window: { date: string; weight: number }[]): number | null {
  const firstMs = new Date(window[0].date).getTime();
  const points = window.map(r => ({
    x: Math.round((new Date(r.date).getTime() - firstMs) / 86400000),
    y: r.weight,
  }));
  return calcTrend(points)?.slope ?? null;
}

// 4주 후 체중 예측 (안정화 버전)
// ① slope30(70%) + cappedSlope7(30%) 가중 평균
// ② slope7는 단기 급변 흡수를 위해 ±0.07kg/일 clamp
// ③ finalDailyChange는 ±0.06kg/일 clamp
// ④ 예측값은 최신 체중 ±2.0kg 이내 clamp
// ⑤ 최근 7일 변동폭 ≥ 1.5kg 이면 highVolatility: true
// 최근 30일 기록 7개 미만 → { insufficient: true }
// weight 기록 없음 → null
function calcRecentPrediction(
  allRecords: { date: string; weight?: number | null }[],
): { value: number; highVolatility: boolean } | { insufficient: true } | null {
  const sorted = [...allRecords]
    .filter(r => r.weight && r.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date)) as { date: string; weight: number }[];

  if (!sorted.length) return null;

  const latestDate = new Date(sorted[sorted.length - 1].date);
  const latestWeight = sorted[sorted.length - 1].weight;

  const cutoff30 = new Date(latestDate);
  cutoff30.setDate(cutoff30.getDate() - 30);
  const window30 = sorted.filter(r => new Date(r.date) >= cutoff30);

  if (window30.length < 7) return { insufficient: true };

  const slope30 = dailySlope(window30);
  if (slope30 === null) return { insufficient: true };

  const cutoff7 = new Date(latestDate);
  cutoff7.setDate(cutoff7.getDate() - 7);
  const window7 = sorted.filter(r => new Date(r.date) >= cutoff7);

  // 변동성 감지: 최근 7일 최대-최소 ≥ 1.5kg
  const highVolatility = window7.length >= 2
    ? Math.max(...window7.map(r => r.weight)) - Math.min(...window7.map(r => r.weight)) >= 1.5
    : false;

  // 7일 기록 3개 이상이면 가중 평균 적용, 미만이면 30일 기준만 사용
  let finalDailyChange: number;
  if (window7.length >= 3) {
    const slope7 = dailySlope(window7);
    // ② 7일 slope를 ±0.07kg/일로 제한해 단기 급변이 4주 예측을 과도하게 왜곡하지 않도록 처리
    const cappedSlope7 = slope7 !== null ? clamp(slope7, -0.07, 0.07) : null;
    finalDailyChange = cappedSlope7 !== null
      ? slope30 * 0.7 + cappedSlope7 * 0.3
      : slope30;
  } else {
    finalDailyChange = slope30;
  }

  // ③ 합산된 일평균 변화량도 ±0.06kg/일 이내로 제한
  finalDailyChange = clamp(finalDailyChange, -0.06, 0.06);

  // ④ 예측값을 현재 체중 ±2.0kg 이내로 제한
  const rawPredicted = latestWeight + finalDailyChange * 28;
  const predicted = parseFloat(clamp(rawPredicted, latestWeight - 2.0, latestWeight + 2.0).toFixed(1));

  return { value: predicted, highVolatility };
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
  const userRecords = useHealthStore((state) => state.userRecords);
  const currentUserId = useHealthStore((state) => state.currentUserId);
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
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (filter === 'all') return records;
    const lastDate = new Date(records[records.length - 1].date);
    const daysMap = { '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
    const cutoff = new Date(lastDate);
    cutoff.setDate(cutoff.getDate() - daysMap[filter]);
    return records.filter(r => new Date(r.date) >= cutoff);
  }, [records, filter]);

  // ── 주차 옵션 생성 (기록이 있는 주차만, 최신→과거 순) ──────────────
  const weekOptions = useMemo(() => {
    if (!records.length) return [];
    const now = new Date();
    const thisMonday = startOfWeek(now);
    const firstMon = startOfWeek(new Date(records[0].date));
    const pad = (n: number) => String(n).padStart(2, '0');

    const opts: { offset: number; label: string }[] = [];
    let offset = 0;
    let curMonday = new Date(thisMonday);

    while (curMonday >= firstMon) {
      const curSunday = new Date(curMonday);
      curSunday.setDate(curSunday.getDate() + 6);
      curSunday.setHours(23, 59, 59, 999);
      const effectiveEnd = offset === 0 ? now : curSunday;

      const hasRecs = records.some(r => {
        const d = new Date(r.date);
        return d >= curMonday && d <= effectiveEnd;
      });

      if (hasRecs) {
        let label: string;
        if (offset === 0) label = '이번 주';
        else if (offset === 1) label = '지난 주';
        else if (offset === 2) label = '2주 전';
        else {
          const s = `${curMonday.getFullYear()}.${pad(curMonday.getMonth() + 1)}.${pad(curMonday.getDate())}`;
          const eD = curSunday > now ? now : curSunday;
          const e = `${pad(eD.getMonth() + 1)}.${pad(eD.getDate())}`;
          label = `${s} ~ ${e}`;
        }
        opts.push({ offset, label });
      }

      curMonday = new Date(curMonday);
      curMonday.setDate(curMonday.getDate() - 7);
      offset++;
    }
    return opts;
  }, [records]);

  // ── 주간 체성분 리포트 (선택한 주차 기준) ───────────────────────
  const weeklyReport = useMemo<WeeklyCompositionReport | null>(() => {
    if (!records.length) return null;
    const now = new Date();
    const thisMonday = startOfWeek(now);

    const selMonday = new Date(thisMonday);
    selMonday.setDate(selMonday.getDate() - selectedWeekOffset * 7);
    const selSunday = new Date(selMonday);
    selSunday.setDate(selSunday.getDate() + 6);
    selSunday.setHours(23, 59, 59, 999);

    const prevMonday = new Date(selMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const prevSunday = new Date(selMonday);
    prevSunday.setDate(prevSunday.getDate() - 1);
    prevSunday.setHours(23, 59, 59, 999);

    const effectiveEnd = selectedWeekOffset === 0 ? now : selSunday;
    const inRange = (date: string, from: Date, to: Date) => {
      const d = new Date(date); return d >= from && d <= to;
    };

    const selRecs = records.filter(r => inRange(r.date, selMonday, effectiveEnd));
    const prevRecs = records.filter(r => inRange(r.date, prevMonday, prevSunday));

    return computeWeeklyCompositionReport(selRecs, prevRecs);
  }, [records, selectedWeekOffset]);

  // ── Body composition ──────────────────────────────────────────────
  const compositionData = useMemo(() => {
    if (!records.length) return null;
    const latest = [...records].reverse().find(r => r.skeletal_muscle > 0 && r.body_fat_mass > 0 && r.weight > 0);
    if (!latest) return null;
    const muscle = latest.skeletal_muscle;
    const fat = latest.body_fat_mass;
    const other = Math.max(0, parseFloat((latest.weight - muscle - fat).toFixed(1)));

    // Calculate dynamic BMI from latest record or settings
    let bmi = latest.bmi;
    if (!bmi && latest.weight && settings.height) {
      const h = settings.height / 100;
      bmi = parseFloat((latest.weight / (h * h)).toFixed(1));
    }

    return {
      date: latest.date,
      weight: latest.weight,
      bmi,
      items: [
        { name: '근육량', value: muscle, color: '#059669', pct: Math.round((muscle / latest.weight) * 100) },
        { name: '체지방', value: fat, color: '#dc2626', pct: Math.round((fat / latest.weight) * 100) },
        { name: '기타', value: other, color: '#94a3b8', pct: Math.round((other / latest.weight) * 100) },
      ],
    };
  }, [records, settings]);

  // ── Chart data with trend ─────────────────────────────────────────
  const chartData = useMemo(() => {
    const base = filteredRecords
      .filter(r => selectedMetrics.some(m => (r as any)[m] > 0))
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
        trendWeight: null as number | null,
      }));

    if (!selectedMetrics.includes('weight') || base.length < 3) return base;

    const firstDate = new Date(base[0].date).getTime();
    const getDaysFromStart = (dateStr: string) => {
      return Math.round((new Date(dateStr).getTime() - firstDate) / (24 * 60 * 60 * 1000));
    };

    const trendData = base
      .filter(d => d.weight !== null)
      .map(d => ({
        x: getDaysFromStart(d.date),
        y: d.weight as number
      }));

    const reg = calcTrend(trendData);
    if (!reg) return base;

    // 과거 데이터에 대한 추세선 보정 적용
    base.forEach((d) => {
      const days = getDaysFromStart(d.date);
      d.trendWeight = parseFloat(Math.max(0, reg.slope * days + reg.intercept).toFixed(1));
    });

    // 4주 미래 예측 (정확히 7, 14, 21, 28일 뒤로 예측 연장)
    if (base.length > 0) {
      const lastRecord = base[base.length - 1];
      const lastDateStr = lastRecord.date;
      const lastDays = getDaysFromStart(lastDateStr);

      for (let j = 1; j <= 4; j++) {
        const futureDays = lastDays + (j * 7);
        base.push({
          date: addDays(lastDateStr, j * 7),
          weight: null, skeletal_muscle: null, body_fat_mass: null,
          body_fat: null, visceral_fat_level: null, abdominal_fat_ratio: null,
          waist_circumference_belly: null, waist_circumference_beauty: null,
          trendWeight: parseFloat(Math.max(0, reg.slope * futureDays + reg.intercept).toFixed(1)),
        });
      }
    }
    return base;
  }, [filteredRecords, selectedMetrics]);

  // ── Chart trend line: 필터된 데이터 기반 추세선 표시 여부 ──────────
  const hasTrendLine = useMemo(
    () => selectedMetrics.includes('weight') && chartData.some(d => d.trendWeight !== null),
    [chartData, selectedMetrics],
  );

  // ── 예측 텍스트: 최근 30일 기록 기반 4주 후 예상값 ──────────────────
  // 기간 필터와 무관하게 항상 최근 30일(전체 records) 기준으로 계산
  const recentPrediction = useMemo(() => {
    if (!selectedMetrics.includes('weight')) return null;
    return calcRecentPrediction(records);
  }, [records, selectedMetrics]);

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
      <div className="max-w-7xl mx-auto pt-[60px] px-5 sm:px-10 pb-20 md:pb-10 space-y-4">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-[60px] px-5 sm:px-10 pb-20 md:pb-10 flex flex-col items-center justify-center min-h-[80dvh] animate-fade-up">
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

  // ── 주차 네비게이션 ───────────────────────────────────────────────
  // weekOptions는 최신→과거 순(index 0 = 이번 주). prev = 더 오래된 주(index+1)
  const currentWeekIdx = weekOptions.findIndex(o => o.offset === selectedWeekOffset);
  const canGoPrev = currentWeekIdx !== -1 && currentWeekIdx < weekOptions.length - 1;
  const canGoNext = currentWeekIdx !== -1 && currentWeekIdx > 0;
  const goPrevWeek = () => { if (canGoPrev) setSelectedWeekOffset(weekOptions[currentWeekIdx + 1].offset); };
  const goNextWeek = () => { if (canGoNext) setSelectedWeekOffset(weekOptions[currentWeekIdx - 1].offset); };

  // ── 주간 한 줄 코멘트 ─────────────────────────────────────────────
  const weeklySummaryComment = weeklyReport ? generateWeeklySummaryComment(weeklyReport) : null;

  // ── Derived values for header chips ──────────────────────────────
  const latest = records[records.length - 1];
  const prev = records.length >= 2 ? records[records.length - 2] : null;
  const delta = latest && prev ? parseFloat((latest.weight - prev.weight).toFixed(1)) : null;
  const target = settings.targetWeight;
  const goalGap = target && latest ? parseFloat((latest.weight - target).toFixed(1)) : null;

  return (
    <>
      <div className="max-w-7xl mx-auto pt-[100px] px-5 sm:px-10 pb-20 md:pb-10 space-y-6 animate-fade-up">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-4 sm:mb-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-0.5 sm:mb-1">나의 건강 대시보드</p>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">건강 기록 분석</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 sm:mt-1.5">체중, 체성분, 기록 흐름을 한눈에 확인하세요.</p>

            {/* Stat chips — 모바일: 가로 스크롤, PC: 줄바꿈 */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap sm:mt-3">
              {latest?.weight ? (
                <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-soft)] text-[12px] font-black text-[var(--accent)]">
                  <Scale className="w-3 h-3" />
                  {latest.weight} kg
                </span>
              ) : null}
              {delta !== null && (
                <span className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[12px] font-black ${delta < 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : delta > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'}`}>
                  {delta < 0 ? <TrendingDown className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {delta > 0 ? '+' : ''}{delta} kg
                </span>
              )}
              {goalGap !== null && (
                <span className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-black ${goalGap <= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                  <Target className="w-3 h-3" />
                  {goalGap <= 0 ? '목표 달성! 🎉' : `목표까지 -${goalGap} kg`}
                </span>
              )}
              <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[12px] font-bold text-[var(--text-muted)]">
                <CalendarDays className="w-3 h-3" />
                {records.length}일 기록
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white px-5 py-3 rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-cyan-200 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />오늘 기록하기
          </button>
        </header>

        {/* ── Body signal section ── */}
        <BodySignalSection records={records} />

        {/* ── Filter bar ── */}
        <div className="flex !mt-0 bg-white/80 backdrop-blur-sm p-0.5 sm:p-1 rounded-2xl border border-[var(--border)] shadow-sm w-full sm:w-fit sm:overflow-x-auto sm:scrollbar-hide" role="group" aria-label="기간 필터">
          {(Object.keys(FILTER_LABELS) as (keyof typeof FILTER_LABELS)[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`flex-1 sm:flex-none min-h-[40px] sm:min-h-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer text-center flex items-center justify-center ${filter === f ? 'bg-gradient-to-r from-[var(--accent)] to-cyan-500 text-white shadow-sm shadow-cyan-200' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* ── Summary cards ── */}
        <SummaryCards filteredRecords={filteredRecords} onCardClick={toggleMetric} selectedMetrics={selectedMetrics} />

        {/* ── Main chart ── */}
        <section aria-label="지표별 변화 추이" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* 모바일: 세로 배치(라벨→제목→예측→pill), 데스크탑: 좌우 배치 */}
          <div className="p-5 sm:p-6 pb-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />멀티 트래킹 분석
              </p>
              <h2 className="text-lg font-black text-[var(--text-primary)]">지표별 변화 추이</h2>
              {selectedMetrics.includes('weight') && recentPrediction !== null && (
                <p className="text-[11px] text-[var(--text-muted)] mt-2 flex items-start gap-1">
                  <Flame className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                  {/* 텍스트를 단일 span으로 감싸 flex child 단위 줄바꿈 방지 */}
                  <span>
                    {'value' in recentPrediction
                      ? recentPrediction.highVolatility
                        ? <><span className="whitespace-nowrap font-black text-[var(--text-secondary)]">4주 후 약 {recentPrediction.value}kg</span>{' — 최근 변동이 커서 참고용으로만 봐주세요 📝'}</>
                        : <>{'최근 흐름 기준 '}<span className="whitespace-nowrap font-black text-[var(--text-secondary)]">4주 후 약 {recentPrediction.value}kg</span>{' 참고 예상'}</>
                      : '예측하려면 최근 기록이 조금 더 필요해요 📝'}
                  </span>
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

          <div className="h-[380px] w-full px-2 py-4" role="img" aria-label={`${selectedMetrics.map(m => METRIC_LABELS[m].label).join('·')} 시계열 차트`}>
            {filteredRecords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    {selectedMetrics.map(m => (
                      <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={METRIC_LABELS[m].color} stopOpacity={0.35} />
                        <stop offset="50%" stopColor={METRIC_LABELS[m].color} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={METRIC_LABELS[m].color} stopOpacity={0} />
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
                  {hasTrendLine && (
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

            {/* Weekly composition report */}
            {weeklyReport && (
              <section aria-label="주간 체성분 리포트" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">

                {/* 헤더: 제목 + 주차 < 드롭다운 > */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
                      <CalendarDays className="w-3.5 h-3.5" />주간 리포트
                    </p>
                    <h2 className="text-base font-black text-[var(--text-primary)]">주간 체성분</h2>
                  </div>
                  {weekOptions.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={goPrevWeek}
                        disabled={!canGoPrev}
                        className="p-1 rounded-full hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="이전 주"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </button>
                      <div className="relative">
                        <select
                          value={selectedWeekOffset}
                          onChange={e => setSelectedWeekOffset(Number(e.target.value))}
                          className="text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--surface-2)] border border-[var(--border)] rounded-full pl-3 pr-6 py-1.5 cursor-pointer outline-none appearance-none max-w-[110px]"
                          aria-label="조회할 주차 선택"
                        >
                          {weekOptions.map(opt => (
                            <option key={opt.offset} value={opt.offset}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      </div>
                      <button
                        onClick={goNextWeek}
                        disabled={!canGoNext}
                        className="p-1 rounded-full hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="다음 주"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 한 줄 요약 코멘트 — 상태 뱃지 + 컬러 박스 */}
                {weeklySummaryComment && weeklyReport.days > 0 && (() => {
                  const s = WEEKLY_STATUS_STYLES[weeklySummaryComment.status];
                  return (
                    <div className={`flex items-start gap-2 rounded-xl px-3 py-2 mb-3 border ${s.bg} ${s.border}`}>
                      <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap ${s.badge} ${s.badgeText}`}>
                        {s.label}
                      </span>
                      <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                        {weeklySummaryComment.message}
                      </p>
                    </div>
                  );
                })()}

                {/* 빈 상태 or 데이터 */}
                {weeklyReport.days === 0 ? (
                  <div className="flex flex-col items-center justify-center py-5 text-center gap-2 bg-[var(--surface-2)] rounded-2xl">
                    <CalendarDays className="w-6 h-6 text-[var(--text-muted)] opacity-30" />
                    <p className="text-[12px] text-[var(--text-muted)] leading-relaxed max-w-[220px]">
                      선택한 주차에는 기록이 없어요.<br />기록이 있는 주차를 선택해 주세요.
                    </p>
                  </div>
                ) : (
                  /* 5개 체성분 지표 + 기록한 날 = 6 미니 카드 (모바일 2열 / PC 3열) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {weeklyReport.metrics.map(m => (
                      <div key={m.key} className="bg-[var(--surface-2)] rounded-2xl p-3 sm:p-3.5 flex flex-col gap-1 min-w-0 sm:hover:shadow-sm sm:hover:-translate-y-0.5 sm:transition-all sm:duration-200">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">{m.label}</p>
                        <p className="text-[16px] sm:text-[17px] font-black text-[var(--text-primary)] leading-none">
                          {m.avg != null ? m.avg : '—'}
                          <span className="text-[10px] font-bold text-[var(--text-muted)] ml-0.5">{m.unit}</span>
                        </p>
                        {/* 전주 대비: 아이콘 + 짧은 변화량 + 지표별 좋은방향 컬러 */}
                        <div className={`flex items-center gap-0.5 text-[10px] font-bold leading-none ${getDeltaColorClass(m.delta, m.isPositiveGood)}`}>
                          {getDeltaDirection(m.delta) === 'up' && <TrendingUp className="w-3 h-3 shrink-0" />}
                          {getDeltaDirection(m.delta) === 'down' && <TrendingDown className="w-3 h-3 shrink-0" />}
                          {getDeltaDirection(m.delta) === 'none' && <Minus className="w-3 h-3 shrink-0" />}
                          <span>{formatDeltaShort(m.delta, m.unit)}</span>
                        </div>
                      </div>
                    ))}
                    {/* 기록한 날 — 중립 컬러 */}
                    <div className="bg-violet-50 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-1 min-w-0">
                      <p className="text-[10px] font-bold text-violet-400">기록한 날</p>
                      <p className="text-[16px] sm:text-[17px] font-black text-violet-600 leading-none">
                        {weeklyReport.days}
                        <span className="text-[10px] font-bold text-violet-400 ml-0.5">일</span>
                      </p>
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">이번 주 기록</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Body composition donut */}
            {compositionData && (
              <section aria-label="체성분 분석" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-1">
                  <Dumbbell className="w-3.5 h-3.5" />체성분 분석
                </p>

                {/* Header with responsive layout for Title and BMI */}
                <div className="flex items-center justify-between mb-5 gap-2">
                  <div>
                    <h2 className="text-base font-black text-[var(--text-primary)] leading-tight">현재 체성분 비율</h2>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">기준일: {compositionData.date}</p>
                  </div>
                  {compositionData.bmi && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">나의 체질량 지수</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="text-[17px] font-black text-[var(--text-primary)] tracking-tight">BMI {compositionData.bmi}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${compositionData.bmi < 18.5 ? 'text-cyan-600 bg-cyan-50 border-cyan-100' :
                            compositionData.bmi < 23 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                              compositionData.bmi < 25 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                'text-rose-600 bg-rose-50 border-rose-100'
                          }`}>
                          {compositionData.bmi < 18.5 ? '저체중' : compositionData.bmi < 23 ? '정상' : compositionData.bmi < 25 ? '과체중' : '비만'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
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
                    {/* Center label showing Weight and BMI status indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[17px] font-black text-[var(--text-primary)] leading-none">{compositionData.weight}<span className="text-[10px] font-bold text-[var(--text-muted)] ml-0.5">kg</span></p>
                    </div>
                  </div>

                  {/* Responsive Legend */}
                  <div className="flex-1 grid grid-cols-3 sm:flex sm:flex-col gap-2 sm:gap-2.5 w-full">
                    {compositionData.items.map(item => (
                      <div key={item.name} className="flex flex-col items-center sm:flex-row sm:justify-between p-2 sm:p-0 bg-[var(--surface-2)] sm:bg-transparent rounded-xl text-center sm:text-left border border-[var(--border-subtle)] sm:border-0">
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0 mb-0.5 sm:mb-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[12px] sm:text-[13px] font-black text-[var(--text-secondary)] whitespace-nowrap truncate">{item.name}</span>
                        </div>
                        <div className="flex flex-col items-center sm:items-end sm:mt-0 mt-0.5">
                          <span className="text-[12px] sm:text-[13px] font-black text-[var(--text-primary)] whitespace-nowrap">
                            {item.value.toFixed(1)}kg
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-muted)] whitespace-nowrap sm:ml-1.5">
                            ({item.pct}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

      </div>

      {/* Mobile FAB — sm 이상에서는 숨김, 하단 내비게이션 + safe-area 위에 배치 */}
      <button
        onClick={() => setIsRecordModalOpen(true)}
        className="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] right-5 z-40 sm:hidden w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-cyan-500 text-white rounded-full shadow-xl shadow-cyan-300/60 flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="오늘 기록하기"
      >
        <Pencil className="w-5 h-5" />
      </button>

      <RecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} />
    </>
  );
}
