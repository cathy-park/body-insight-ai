import { HealthRecord } from '@/types';

// ── 임계값 상수 ────────────────────────────────────────────────────
export const BODY_SIGNAL_THRESHOLDS = {
  skeletal_muscle: {
    good:     21,   // >=21 → 좋음
    normal:   19,   // >=19 <21 → 보통
    warning:  18,   // >=18 <19 → 주의 / <18+감소 → 집중관리
  },
  body_fat: {
    good_max:    28,   // <=28 → 좋음
    normal_max:  30,   // <=30 → 보통
    warning_max: 32,   // <=32 → 주의, >32 → 집중관리
  },
  body_fat_mass: {
    good:    14,    // <=14 → 좋음
    normal:  15.5,  // <=15.5 → 보통
    warning: 17,    // <=17 → 주의, >17 → 집중관리
  },
  abdominal_fat_ratio: {
    good:    0.85,  // <=0.85 → 좋음
    normal:  0.87,  // <=0.87 → 보통
    warning: 0.90,  // <=0.90 → 주의, >0.90 → 집중관리
  },
  visceral_fat_level: {
    good:     7,    // <=7  → 좋음
    normal:   10,   // 8-10 → 보통
    warning:  12,   // 11-12 → 주의, >=13 → 집중관리
  },
} as const;

// ── 타입 ──────────────────────────────────────────────────────────
export type SignalStatus = 'good' | 'normal' | 'warning' | 'critical';

export interface BodySignal {
  id: string;
  title: string;
  desc: string;
  status: SignalStatus;
}

// 낮은 숫자 = 높은 우선순위
const STATUS_PRIORITY: Record<SignalStatus, number> = {
  critical: 0, warning: 1, normal: 2, good: 3,
};

// ── 개별 지표 UX 문구 ──────────────────────────────────────────────
// 각 지표별로 4단계 문구를 모두 정의 (미사용 항목은 dead code지만 타입 안전성 확보)
export const INDIVIDUAL_COPY: Record<string, Record<SignalStatus, { title: string; desc: string }>> = {
  skeletal_muscle: {
    good:     { title: '근육량 좋아요 💪',             desc: '골격근량이 안정적인 수준이에요. 현재 루틴을 이어가도 좋아요.' },
    normal:   { title: '근육량 유지 중이에요',           desc: '골격근량이 적정 범위에 있어요. 꾸준한 관리가 도움이 돼요.' },
    warning:  { title: '근육량을 챙겨볼 때예요 🌿',      desc: '골격근량이 조금 낮은 편이에요. 단백질 섭취와 근력운동을 함께 챙겨보세요.' },
    critical: { title: '근육 유지가 우선이에요',          desc: '근육량이 줄어드는 흐름이 보여요. 식사와 운동 루틴을 점검해보세요.' },
  },
  body_fat: {
    good:     { title: '체지방률 안정적이에요 ✨',        desc: '체지방률이 건강한 범위에 있어요.' },
    normal:   { title: '체지방률 확인 중이에요',          desc: '체지방률이 조금 낮은 편이에요. 균형 잡힌 식사를 유지해보세요.' },
    warning:  { title: '체지방률이 살짝 높은 편이에요',   desc: '체지방률이 조금 높아졌어요. 식사와 활동량을 함께 살펴보세요.' },
    critical: { title: '체지방률을 우선 체크해요 🔍',     desc: '체지방률이 높은 편이에요. 근육량 변화도 함께 확인해보세요.' },
  },
  body_fat_mass: {
    good:     { title: '체지방량 좋아요 ✨',             desc: '체지방량이 적정 수준이에요.' },
    normal:   { title: '체지방량 관찰 중이에요',          desc: '체지방량을 꾸준히 체크해보세요.' },
    warning:  { title: '체지방량도 함께 봐주세요',        desc: '체지방량이 조금 높은 편이에요. 꾸준한 관리를 이어가보세요.' },
    critical: { title: '체지방량 관리가 우선이에요 🔥',   desc: '체지방량이 높은 편이에요. 식사 패턴과 활동량을 함께 살펴보세요.' },
  },
  abdominal_fat_ratio: {
    good:     { title: '복부지방률 안정적이에요 ✨',      desc: '복부지방 비율이 안정적인 수준이에요.' },
    normal:   { title: '복부지방 비율 관찰 중이에요',     desc: '복부지방 비율을 꾸준히 체크해보세요.' },
    warning:  { title: '복부지방 비율을 체크해볼 때예요', desc: '복부지방 비율이 조금 높은 편이에요. 유산소 활동이 도움이 될 수 있어요.' },
    critical: { title: '복부지방 관리가 우선이에요 🔍',   desc: '복부지방 비율이 높은 편이에요. 내장지방 수치도 함께 확인해보세요.' },
  },
  visceral_fat_level: {
    good:     { title: '내장지방은 안정권이에요 🌿',     desc: '내장지방 레벨이 안정적이에요. 좋은 흐름이에요.' },
    normal:   { title: '내장지방은 관찰 중이에요',        desc: '내장지방 레벨이 조금 있는 편이에요. 식사 습관을 점검해보세요.' },
    warning:  { title: '내장지방을 체크해볼 때예요',      desc: '내장지방 레벨이 높은 편이에요. 꾸준한 생활 습관 개선이 도움이 돼요.' },
    critical: { title: '내장지방 관리가 우선이에요 🔍',   desc: '내장지방 레벨이 상당히 높은 편이에요. 식단과 활동량을 함께 점검해보세요.' },
  },
};

// ── 조합 신호 UX 문구 ──────────────────────────────────────────────
export const COMBO_COPY: Record<string, { title: string; desc: string; status: SignalStatus }> = {
  fat_distribution_critical: {
    title: '지방 관리 우선 🔥',
    desc: '체지방률과 복부지방 비율이 함께 높은 흐름이에요. 무리한 감량보다 꾸준한 활동량과 근육 유지에 집중해보세요.',
    status: 'critical',
  },
  composition_imbalance: {
    title: '체성분 균형 관리 ⚖️',
    desc: '체중은 안정적이지만 근육량 대비 체지방 비중이 높은 편이에요. 감량보다 근육 유지와 체지방 관리를 함께 봐주세요.',
    status: 'critical',
  },
  muscle_fat_trend: {
    title: '근육·지방 흐름 주의 🔍',
    desc: '최근 기록에서 근육량은 줄고 체지방률은 오른 흐름이 보여요. 식사량을 과하게 줄이기보다 근력운동과 단백질을 챙겨보세요.',
    status: 'warning',
  },
  fast_loss: {
    title: '감량 속도 점검 🧭',
    desc: '체중과 근육량이 함께 줄어든 흐름이에요. 감량 속도보다 근육을 지키는 방향으로 관리해보세요.',
    status: 'warning',
  },
  fat_distribution_warning: {
    title: '지방 분포 관리 🔥',
    desc: '체지방률과 복부지방비율이 함께 높은 편이에요. 체중보다 지방 분포 변화를 우선 확인해보세요.',
    status: 'warning',
  },
  visceral_stable_fat_high: {
    title: '체지방률 체크 필요 🔍',
    desc: '내장지방은 안정권이지만 체지방률은 관리가 필요한 편이에요. 전체 지방량과 근육량 흐름을 함께 확인해보세요.',
    status: 'warning',
  },
  muscle_recovery: {
    title: '근육 회복 흐름 💪',
    desc: '체중은 늘었지만 근육량이 함께 증가한 흐름이에요. 단순 체중보다 체성분 변화를 함께 보면 좋아요.',
    status: 'good',
  },
  all_good: {
    title: '좋은 균형 흐름 ✨',
    desc: '최근 기록 기준으로 주요 체성분 지표가 안정적인 흐름이에요. 현재 루틴을 무리 없이 이어가도 좋아요.',
    status: 'good',
  },
};

// 조합 신호가 커버하는 지표 (개별 신호 중복 방지)
const COMBO_COVERS: Record<string, string[]> = {
  composition_imbalance:     ['skeletal_muscle', 'body_fat'],
  muscle_fat_trend:          ['skeletal_muscle', 'body_fat'],
  muscle_recovery:           ['skeletal_muscle', 'body_fat'],
  fast_loss:                 ['skeletal_muscle'],
  fat_distribution_critical: ['body_fat', 'abdominal_fat_ratio'],
  fat_distribution_warning:  ['body_fat', 'abdominal_fat_ratio'],
  visceral_stable_fat_high:  ['visceral_fat_level', 'body_fat'],
};

// ── 개별 지표 상태 판단 함수 ────────────────────────────────────────
function getSkeletalMuscleStatus(v: number, delta: number | null): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.skeletal_muscle;
  if (v >= t.good)   return 'good';
  if (v >= t.normal) return 'normal';
  // v < 19
  if (v < t.warning && delta !== null && delta < -0.2) return 'critical';
  return 'warning';
}

function getBodyFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.body_fat;
  if (v <= t.good_max)    return 'good';
  if (v <= t.normal_max)  return 'normal';
  if (v <= t.warning_max) return 'warning';
  return 'critical';
}

function getBodyFatMassStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.body_fat_mass;
  if (v <= t.good)    return 'good';
  if (v <= t.normal)  return 'normal';
  if (v <= t.warning) return 'warning';
  return 'critical';
}

function getAbdominalFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.abdominal_fat_ratio;
  if (v <= t.good)    return 'good';
  if (v <= t.normal)  return 'normal';
  if (v <= t.warning) return 'warning';
  return 'critical';
}

function getVisceralFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.visceral_fat_level;
  if (v <= t.good)    return 'good';
  if (v <= t.normal)  return 'normal';
  if (v <= t.warning) return 'warning';
  return 'critical';
}

// ── 메인 신호 생성 함수 ────────────────────────────────────────────
export function computeBodySignals(
  latest: HealthRecord,
  prev: HealthRecord | null,
): BodySignal[] {
  // 데이터 존재 여부
  const hasMuscle   = latest.skeletal_muscle > 0;
  const hasFatRate  = latest.body_fat > 0;
  const hasFatMass  = latest.body_fat_mass > 0;
  const hasAbdom    = latest.abdominal_fat_ratio > 0;
  const hasVisceral = latest.visceral_fat_level > 0;

  const hasAnyData = hasMuscle || hasFatRate || hasFatMass || hasAbdom || hasVisceral;
  if (!hasAnyData) return [];

  // 이전 기록 대비 변화량
  const muscleDelta  = prev && hasMuscle  && prev.skeletal_muscle > 0 ? latest.skeletal_muscle - prev.skeletal_muscle : null;
  const fatRateDelta = prev && hasFatRate && prev.body_fat > 0        ? latest.body_fat - prev.body_fat : null;
  const weightDelta  = prev && latest.weight > 0 && prev.weight > 0   ? latest.weight - prev.weight : null;

  // 개별 지표 상태
  const muscleStatus   = hasMuscle   ? getSkeletalMuscleStatus(latest.skeletal_muscle, muscleDelta) : null;
  const fatRateStatus  = hasFatRate  ? getBodyFatStatus(latest.body_fat)  : null;
  const fatMassStatus  = hasFatMass  ? getBodyFatMassStatus(latest.body_fat_mass) : null;
  const abdomStatus    = hasAbdom    ? getAbdominalFatStatus(latest.abdominal_fat_ratio) : null;
  const visceralStatus = hasVisceral ? getVisceralFatStatus(latest.visceral_fat_level) : null;

  // ── 조합 신호 감지 ────────────────────────────────────────────────
  const detectedCombos: BodySignal[] = [];

  // [집중관리] 지방 관리 우선: body_fat >32% + abdom_ratio >0.90
  if (hasFatRate && hasAbdom && latest.body_fat > 32 && latest.abdominal_fat_ratio > 0.90) {
    detectedCombos.push({ id: 'fat_distribution_critical', ...COMBO_COPY.fat_distribution_critical });
  }

  // [집중관리] 체성분 균형 관리: 체중 정상(BMI<25) + body_fat >28% + skeletal_muscle <19kg
  const weightNormal = latest.bmi > 0 && latest.bmi < 25;
  if (weightNormal && hasFatRate && hasMuscle && latest.body_fat > 28 && latest.skeletal_muscle < 19) {
    detectedCombos.push({ id: 'composition_imbalance', ...COMBO_COPY.composition_imbalance });
  }

  // [주의] 근육·지방 흐름 주의: 근육 감소 + 지방률 증가
  if (muscleDelta !== null && fatRateDelta !== null && muscleDelta < -0.2 && fatRateDelta > 0.3) {
    detectedCombos.push({ id: 'muscle_fat_trend', ...COMBO_COPY.muscle_fat_trend });
  }

  // [주의] 감량 속도 점검: 체중 감소 + 근육 감소 (muscle_fat_trend와 중복 방지)
  if (
    weightDelta !== null && muscleDelta !== null &&
    weightDelta < -0.3 && muscleDelta < -0.2 &&
    !detectedCombos.some(c => c.id === 'muscle_fat_trend')
  ) {
    detectedCombos.push({ id: 'fast_loss', ...COMBO_COPY.fast_loss });
  }

  // [주의] 지방 분포 관리: body_fat >28% + abdom_ratio >0.85 (fat_distribution_critical과 중복 방지)
  if (
    hasFatRate && hasAbdom &&
    latest.body_fat > 28 && latest.abdominal_fat_ratio > 0.85 &&
    !detectedCombos.some(c => c.id === 'fat_distribution_critical')
  ) {
    detectedCombos.push({ id: 'fat_distribution_warning', ...COMBO_COPY.fat_distribution_warning });
  }

  // [주의] 내장지방 안정 + 체지방률 높음 (지방 분포 관련 콤보와 중복 방지)
  if (
    visceralStatus === 'good' && hasFatRate && latest.body_fat > 28 &&
    !detectedCombos.some(c => c.id === 'fat_distribution_warning' || c.id === 'fat_distribution_critical')
  ) {
    detectedCombos.push({ id: 'visceral_stable_fat_high', ...COMBO_COPY.visceral_stable_fat_high });
  }

  // [좋음] 근육 회복 흐름: 체중↑ + 근육↑ + 지방률 유지/감소 (부정 콤보 없을 때만)
  if (
    weightDelta !== null && muscleDelta !== null && fatRateDelta !== null &&
    weightDelta > 0.3 && muscleDelta > 0.2 && fatRateDelta <= 0.3 &&
    !detectedCombos.some(c => c.status === 'critical' || c.status === 'warning')
  ) {
    detectedCombos.push({ id: 'muscle_recovery', ...COMBO_COPY.muscle_recovery });
  }

  // 조합 신호 우선순위 정렬 후 최대 2개
  detectedCombos.sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
  const selectedCombos = detectedCombos.slice(0, 2);

  // ── 커버된 지표 수집 ──────────────────────────────────────────────
  const coveredMetrics = new Set<string>();
  for (const combo of selectedCombos) {
    (COMBO_COVERS[combo.id] ?? []).forEach(m => coveredMetrics.add(m));
  }

  // ── 개별 신호 후보 생성 (커버된 지표 제외) ────────────────────────
  const metricCandidates: Array<{ key: string; status: SignalStatus }> = [
    hasMuscle   && muscleStatus   && !coveredMetrics.has('skeletal_muscle')   ? { key: 'skeletal_muscle',   status: muscleStatus }   : null,
    hasFatRate  && fatRateStatus  && !coveredMetrics.has('body_fat')           ? { key: 'body_fat',          status: fatRateStatus }  : null,
    hasVisceral && visceralStatus && !coveredMetrics.has('visceral_fat_level') ? { key: 'visceral_fat_level', status: visceralStatus } : null,
    hasFatMass  && fatMassStatus  && !coveredMetrics.has('body_fat_mass')      ? { key: 'body_fat_mass',     status: fatMassStatus }  : null,
    hasAbdom    && abdomStatus    && !coveredMetrics.has('abdominal_fat_ratio') ? { key: 'abdominal_fat_ratio', status: abdomStatus } : null,
  ].filter((x): x is { key: string; status: SignalStatus } => x !== null);

  // 우선순위 정렬: critical → warning → normal → good
  metricCandidates.sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);

  const individualSignals: BodySignal[] = metricCandidates.map(({ key, status }) => ({
    id: key,
    title: INDIVIDUAL_COPY[key][status].title,
    desc:  INDIVIDUAL_COPY[key][status].desc,
    status,
  }));

  // ── 최종 조합 (최대 4개) ─────────────────────────────────────────
  const signals: BodySignal[] = [...selectedCombos];

  for (const sig of individualSignals) {
    if (signals.length >= 4) break;
    signals.push(sig);
  }

  // ── 전체 양호 처리 ────────────────────────────────────────────────
  // 모든 신호가 'good'이거나 신호가 없으면 "좋은 균형 흐름"을 맨 앞에 추가
  const allGoodCard: BodySignal = { id: 'all_good', ...COMBO_COPY.all_good };
  const hasNegativeSignal = signals.some(s => s.status === 'warning' || s.status === 'critical');

  if (!hasNegativeSignal && !signals.some(s => s.id === 'all_good')) {
    signals.unshift(allGoodCard);
  }

  return signals.slice(0, 4);
}
