import { HealthRecord } from '@/types';

export type WeeklyMetricDef = {
  key: 'weight' | 'skeletal_muscle' | 'body_fat' | 'body_fat_mass' | 'visceral_fat_level';
  label: string;
  unit: string;
  isPositiveGood: boolean; // true → 증가가 좋음(골격근량), false → 감소가 좋음(체중·지방류)
  precision: number;
};

export const WEEKLY_METRIC_DEFS: WeeklyMetricDef[] = [
  { key: 'weight',             label: '평균 체중',    unit: 'kg', isPositiveGood: false, precision: 1 },
  { key: 'skeletal_muscle',    label: '평균 골격근량', unit: 'kg', isPositiveGood: true,  precision: 1 },
  { key: 'body_fat',           label: '평균 체지방률', unit: '%',  isPositiveGood: false, precision: 1 },
  { key: 'body_fat_mass',      label: '평균 체지방량', unit: 'kg', isPositiveGood: false, precision: 1 },
  { key: 'visceral_fat_level', label: '평균 내장지방', unit: 'Lv', isPositiveGood: false, precision: 1 },
];

export type MetricResult = {
  key: string;
  label: string;
  unit: string;
  avg: number | null;
  delta: number | null; // null → 비교 불가(전주 데이터 없음)
  isPositiveGood: boolean;
};

export type WeeklyCompositionReport = {
  metrics: MetricResult[];
  days: number;
};

function metricAvg(
  recs: HealthRecord[],
  key: WeeklyMetricDef['key'],
  precision: number,
): number | null {
  const valid = recs.filter(r => typeof r[key] === 'number' && (r[key] as number) > 0);
  if (!valid.length) return null;
  const sum = valid.reduce((s, r) => s + (r[key] as number), 0);
  return parseFloat((sum / valid.length).toFixed(precision));
}

export function computeWeeklyCompositionReport(
  selRecs: HealthRecord[],
  prevRecs: HealthRecord[],
): WeeklyCompositionReport {
  const metrics: MetricResult[] = WEEKLY_METRIC_DEFS.map(def => {
    const avg     = metricAvg(selRecs,  def.key, def.precision);
    const prevAvg = metricAvg(prevRecs, def.key, def.precision);
    const delta   =
      avg !== null && prevAvg !== null
        ? parseFloat((avg - prevAvg).toFixed(def.precision))
        : null;
    return {
      key:            def.key,
      label:          def.label,
      unit:           def.unit,
      avg,
      delta,
      isPositiveGood: def.isPositiveGood,
    };
  });
  return { metrics, days: selRecs.length };
}

/**
 * 전주 대비 변화량에 따른 Tailwind 텍스트 컬러 클래스를 반환합니다.
 * delta === null  → 비교 불가 (뮤트)
 * delta === 0     → 변화 없음 (뮤트)
 * 좋은 방향       → emerald-600
 * 나쁜 방향       → rose-500
 */
export function getDeltaColorClass(
  delta: number | null,
  isPositiveGood: boolean,
): string {
  if (delta === null || delta === 0) return 'text-[var(--text-muted)]';
  const isGood = (delta > 0 && isPositiveGood) || (delta < 0 && !isPositiveGood);
  return isGood ? 'text-emerald-600' : 'text-rose-500';
}

/** 전주 대비 텍스트 포맷 */
export function formatDelta(
  delta: number | null,
  unit: string,
): string {
  if (delta === null) return '비교 불가';
  if (delta === 0)    return '변화 없음';
  return `전주 대비 ${delta > 0 ? '+' : ''}${delta}${unit}`;
}
