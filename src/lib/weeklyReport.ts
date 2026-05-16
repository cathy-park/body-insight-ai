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

/** 전주 대비 텍스트 포맷 (레거시) */
export function formatDelta(
  delta: number | null,
  unit: string,
): string {
  if (delta === null) return '비교 불가';
  if (delta === 0)    return '변화 없음';
  return `전주 대비 ${delta > 0 ? '+' : ''}${delta}${unit}`;
}

/** 아이콘과 함께 쓰는 짧은 변화량 문자열: "+1.2kg" / "-0.8%" / "0kg" / "—" */
export function formatDeltaShort(
  delta: number | null,
  unit: string,
): string {
  if (delta === null) return '—';
  if (delta === 0)    return `0${unit}`;
  return `${delta > 0 ? '+' : ''}${delta}${unit}`;
}

/**
 * 실제 변화 방향(아이콘 선택용).
 * 컬러는 isPositiveGood 기반 getDeltaColorClass 로 결정.
 */
export function getDeltaDirection(
  delta: number | null,
): 'up' | 'down' | 'none' {
  if (delta === null || delta === 0) return 'none';
  return delta > 0 ? 'up' : 'down';
}

// ── 주간 한 줄 코멘트 ─────────────────────────────────────────────────
// 바디인사이트AI 톤: 친근하고 부드러운 건강 기록 코치. 평가·진단 금지.
// 이 객체에서 모든 UX라이팅 문구를 관리합니다.

const WEEKLY_COMMENT_COPY = {
  lowData:      '기록한 날이 적어 이번 주 흐름은 참고용으로만 봐주세요 📝',
  noPrevData:   '전주 기록이 없어 이번 주 평균만 확인할 수 있어요.',
  muscleUpFatDown:   '근육량은 늘고 체지방률은 내려간 좋은 흐름이에요 💪',
  weightUpFatUp:     '체중과 체지방률이 함께 올라 이번 주는 지방 분포를 살펴봐주세요 🔍',
  weightDownMuscleDown: '체중은 줄었지만 근육량도 함께 줄어 감량 속도를 점검해보세요 🧭',
  fatMassAndVisceralDown: '지방 관련 지표가 함께 내려간 긍정적인 흐름이에요 ✨',
  muscleDownFatUp: '근육량은 줄고 체지방률은 오른 흐름이에요. 근육 유지도 함께 챙겨보세요 💪',
  stable:       '전주와 큰 변화 없이 안정적인 흐름이에요 🌿',
  default:      '이번 주 체성분 흐름을 살펴봤어요. 지표 변화를 함께 확인해보세요.',
} as const;

/**
 * 주간 체성분 리포트를 받아 규칙 기반으로 한 줄 코멘트를 반환합니다.
 * 우선순위: 데이터 부족 → 비교 불가 → 패턴 매칭 → 안정 → 기본
 */
export function generateWeeklySummaryComment(
  report: WeeklyCompositionReport,
): string {
  const { metrics, days } = report;

  if (days <= 2) return WEEKLY_COMMENT_COPY.lowData;

  const get = (key: string) => metrics.find(m => m.key === key)?.delta ?? null;
  const muscleDelta   = get('skeletal_muscle');
  const fatRateDelta  = get('body_fat');
  const weightDelta   = get('weight');
  const fatMassDelta  = get('body_fat_mass');
  const visceralDelta = get('visceral_fat_level');

  const hasAnyComparison = metrics.some(m => m.delta !== null);
  if (!hasAnyComparison) return WEEKLY_COMMENT_COPY.noPrevData;

  // 패턴 매칭 (우선순위 순)
  if (muscleDelta !== null && fatRateDelta !== null && muscleDelta > 0 && fatRateDelta < 0)
    return WEEKLY_COMMENT_COPY.muscleUpFatDown;

  if (muscleDelta !== null && fatRateDelta !== null && muscleDelta < 0 && fatRateDelta > 0)
    return WEEKLY_COMMENT_COPY.muscleDownFatUp;

  if (weightDelta !== null && fatRateDelta !== null && weightDelta > 0 && fatRateDelta > 0)
    return WEEKLY_COMMENT_COPY.weightUpFatUp;

  if (weightDelta !== null && muscleDelta !== null && weightDelta < 0 && muscleDelta < 0)
    return WEEKLY_COMMENT_COPY.weightDownMuscleDown;

  if (fatMassDelta !== null && visceralDelta !== null && fatMassDelta < 0 && visceralDelta < 0)
    return WEEKLY_COMMENT_COPY.fatMassAndVisceralDown;

  // 유의미한 변화 여부 판단
  const THRESHOLDS: Record<string, number> = {
    weight: 0.3, skeletal_muscle: 0.2, body_fat: 0.2,
    body_fat_mass: 0.2, visceral_fat_level: 1,
  };
  const hasSignificant = metrics
    .filter(m => m.delta !== null)
    .some(m => Math.abs(m.delta as number) >= (THRESHOLDS[m.key] ?? 0.3));

  if (!hasSignificant) return WEEKLY_COMMENT_COPY.stable;

  return WEEKLY_COMMENT_COPY.default;
}
