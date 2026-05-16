import { HealthRecord } from '@/types';

// ── 임계값 상수 ────────────────────────────────────────────────────
export const BODY_SIGNAL_THRESHOLDS = {
  skeletal_muscle: { good: 21, ok: 19 },       // kg: >=21 좋음, >=19 보통, <19 주의
  body_fat:        { okMin: 18, ok: 28, warn: 32 }, // %: 18-28 좋음, 28-32 보통, >32 주의
  body_fat_mass:   { good: 14, ok: 17 },        // kg: <=14 좋음, <=17 보통, >17 주의
  abdominal_fat_ratio: { good: 0.85, ok: 0.90 }, // <=0.85 좋음, <=0.90 보통, >0.90 주의
  visceral_fat_level:  { good: 7, ok: 10 },     // <=7 좋음, <=10 보통, >=11 주의
} as const;

// ── 개별 지표 UX 문구 ──────────────────────────────────────────────
export const INDIVIDUAL_COPY = {
  skeletal_muscle: {
    good:    { title: '근육량 좋아요 💪',        desc: '골격근량이 안정적인 수준이에요. 현재 루틴을 이어가도 좋아요.' },
    normal:  { title: '근육량 유지 중이에요',     desc: '골격근량이 적정 범위에 있어요. 꾸준한 관리가 도움이 돼요.' },
    warning: { title: '근육량을 챙겨볼 때예요 🌿', desc: '골격근량이 조금 낮은 편이에요. 단백질 섭취와 근력운동을 함께 챙겨보세요.' },
  },
  body_fat: {
    good:    { title: '체지방률 안정적이에요 ✨', desc: '체지방률이 건강한 범위에 있어요.' },
    normal:  { title: '체지방률 관리가 필요해요', desc: '체지방률이 조금 높은 편이에요. 식사와 활동량을 함께 살펴보세요.' },
    warning: { title: '체지방률을 우선 체크해요 🔍', desc: '체지방률이 높은 편이에요. 근육량 변화도 함께 확인해보세요.' },
  },
  body_fat_mass: {
    good:    { title: '체지방량 좋아요 ✨',      desc: '체지방량이 적정 수준이에요.' },
    normal:  { title: '체지방량 관리 중이에요',  desc: '체지방량이 조금 높은 편이에요. 꾸준한 관리를 이어가보세요.' },
    warning: { title: '체지방량을 줄여볼 때예요 🔥', desc: '체지방량이 높은 편이에요. 식사 패턴과 활동량을 함께 살펴보세요.' },
  },
  abdominal_fat_ratio: {
    good:    { title: '복부지방률 안정적이에요 ✨', desc: '복부지방 비율이 안정적인 수준이에요.' },
    normal:  { title: '복부지방률 관리가 필요해요', desc: '복부지방 비율이 조금 높은 편이에요. 유산소 활동이 도움이 될 수 있어요.' },
    warning: { title: '복부지방률을 체크해요 🔍',  desc: '복부지방 비율이 높은 편이에요. 내장지방 수치도 함께 확인해보세요.' },
  },
  visceral_fat_level: {
    good:    { title: '내장지방 안정권이에요 🌿', desc: '내장지방 레벨이 안정적이에요. 좋은 흐름이에요.' },
    normal:  { title: '내장지방 관리가 필요해요', desc: '내장지방 레벨이 조금 높은 편이에요. 식사 습관을 점검해보세요.' },
    warning: { title: '내장지방을 우선 체크해요 🔍', desc: '내장지방 레벨이 높은 편이에요. 생활 습관 개선을 시작해보세요.' },
  },
} as const;

// ── 조합 신호 UX 문구 ──────────────────────────────────────────────
export const COMBO_COPY = {
  composition_imbalance: {
    title: '체성분 균형 관리 ⚖️',
    desc: '체중은 안정적이지만 근육량 대비 체지방 비중이 높은 편이에요. 감량보다 근육 유지와 체지방 관리를 함께 봐주세요.',
    status: 'warning' as const,
  },
  muscle_fat_trend: {
    title: '근육·지방 흐름 주의 🔍',
    desc: '최근 기록에서 근육량은 줄고 체지방률은 오른 흐름이 보여요. 식사량을 과하게 줄이기보다 근력운동과 단백질을 챙겨보세요.',
    status: 'warning' as const,
  },
  muscle_recovery: {
    title: '근육 회복 흐름 💪',
    desc: '체중은 늘었지만 근육량이 함께 증가한 흐름이에요. 단순 체중보다 체성분 변화를 함께 보면 좋아요.',
    status: 'good' as const,
  },
  fast_loss: {
    title: '감량 속도 점검 🧭',
    desc: '체중과 근육량이 함께 줄어든 흐름이에요. 감량 속도보다 근육을 지키는 방향으로 관리해보세요.',
    status: 'normal' as const,
  },
  fat_distribution: {
    title: '지방 분포 관리 🔥',
    desc: '체지방률과 복부지방비율이 함께 높은 편이에요. 체중보다 지방 분포 변화를 우선 확인해보세요.',
    status: 'warning' as const,
  },
  visceral_stable_fat_high: {
    title: '내장지방은 안정 🌿',
    desc: '내장지방은 안정권이지만 체지방률은 관리가 필요한 편이에요. 전체 지방량과 근육량 흐름을 함께 확인해보세요.',
    status: 'normal' as const,
  },
  all_good: {
    title: '좋은 균형 흐름 ✨',
    desc: '최근 기록 기준으로 주요 체성분 지표가 안정적인 흐름이에요. 현재 루틴을 무리 없이 이어가도 좋아요.',
    status: 'good' as const,
  },
} as const;

// ── 타입 ──────────────────────────────────────────────────────────
export type SignalStatus = 'good' | 'normal' | 'warning';

export interface BodySignal {
  id: string;
  title: string;
  desc: string;
  status: SignalStatus;
}

// ── 개별 지표 상태 판단 ────────────────────────────────────────────
function getSkeletalMuscleStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.skeletal_muscle;
  if (v >= t.good) return 'good';
  if (v >= t.ok)   return 'normal';
  return 'warning';
}

function getBodyFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.body_fat;
  if (v >= t.okMin && v <= t.ok) return 'good';
  if (v <= t.warn) return 'normal';
  return 'warning';
}

function getBodyFatMassStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.body_fat_mass;
  if (v <= t.good) return 'good';
  if (v <= t.ok)   return 'normal';
  return 'warning';
}

function getAbdominalFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.abdominal_fat_ratio;
  if (v <= t.good) return 'good';
  if (v <= t.ok)   return 'normal';
  return 'warning';
}

function getVisceralFatStatus(v: number): SignalStatus {
  const t = BODY_SIGNAL_THRESHOLDS.visceral_fat_level;
  if (v <= t.good) return 'good';
  if (v <= t.ok)   return 'normal';
  return 'warning';
}

// ── 메인 신호 생성 함수 ────────────────────────────────────────────
export function computeBodySignals(
  latest: HealthRecord,
  prev: HealthRecord | null,
): BodySignal[] {
  const signals: BodySignal[] = [];

  // 데이터 존재 여부 확인
  const hasMuscle  = latest.skeletal_muscle > 0;
  const hasFatRate = latest.body_fat > 0;
  const hasFatMass = latest.body_fat_mass > 0;
  const hasAbdom   = latest.abdominal_fat_ratio > 0;
  const hasVisceral = latest.visceral_fat_level > 0;

  // 개별 상태 계산
  const muscleStatus   = hasMuscle   ? getSkeletalMuscleStatus(latest.skeletal_muscle) : null;
  const fatRateStatus  = hasFatRate  ? getBodyFatStatus(latest.body_fat) : null;
  const fatMassStatus  = hasFatMass  ? getBodyFatMassStatus(latest.body_fat_mass) : null;
  const abdomStatus    = hasAbdom    ? getAbdominalFatStatus(latest.abdominal_fat_ratio) : null;
  const visceralStatus = hasVisceral ? getVisceralFatStatus(latest.visceral_fat_level) : null;

  // 트렌드 (이전 기록 존재 시)
  const muscleDelta  = prev && hasMuscle   && prev.skeletal_muscle > 0   ? latest.skeletal_muscle - prev.skeletal_muscle : null;
  const fatRateDelta = prev && hasFatRate  && prev.body_fat > 0          ? latest.body_fat - prev.body_fat : null;
  const weightDelta  = prev && latest.weight > 0 && prev.weight > 0      ? latest.weight - prev.weight : null;

  // ── 조합 신호 판단 (최대 2개) ────────────────────────────────────
  const combos: BodySignal[] = [];

  // 1. 근육·지방 역방향 흐름 (트렌드 기반)
  if (
    muscleDelta !== null && fatRateDelta !== null &&
    muscleDelta < -0.2 && fatRateDelta > 0.5
  ) {
    combos.push({ id: 'muscle_fat_trend', ...COMBO_COPY.muscle_fat_trend });
  }

  // 2. 근육 회복 흐름
  if (
    weightDelta !== null && muscleDelta !== null && fatRateDelta !== null &&
    weightDelta > 0.3 && muscleDelta > 0.2 && fatRateDelta <= 0.3
  ) {
    combos.push({ id: 'muscle_recovery', ...COMBO_COPY.muscle_recovery });
  }

  // 3. 체중+근육 동시 감소
  if (
    weightDelta !== null && muscleDelta !== null &&
    weightDelta < -0.3 && muscleDelta < -0.2
  ) {
    combos.push({ id: 'fast_loss', ...COMBO_COPY.fast_loss });
  }

  // 4. 지방률+복부지방 동시 높음
  if (fatRateStatus === 'warning' && abdomStatus === 'warning') {
    combos.push({ id: 'fat_distribution', ...COMBO_COPY.fat_distribution });
  } else if (fatRateStatus === 'warning' && abdomStatus === 'normal') {
    combos.push({ id: 'fat_distribution', ...COMBO_COPY.fat_distribution });
  }

  // 5. 체성분 불균형 (체중 정상 + 지방률 높음 + 근육 낮음)
  const weightNormal = latest.weight > 0 && latest.bmi > 0 ? latest.bmi < 25 : null;
  if (
    weightNormal &&
    (fatRateStatus === 'warning' || fatRateStatus === 'normal') &&
    muscleStatus === 'warning'
  ) {
    if (!combos.some(c => c.id === 'muscle_fat_trend')) {
      combos.push({ id: 'composition_imbalance', ...COMBO_COPY.composition_imbalance });
    }
  }

  // 6. 내장지방 안정 + 체지방률 높음
  if (
    visceralStatus === 'good' &&
    (fatRateStatus === 'warning' || fatRateStatus === 'normal')
  ) {
    if (combos.length < 2 && !combos.some(c => c.id === 'fat_distribution')) {
      combos.push({ id: 'visceral_stable_fat_high', ...COMBO_COPY.visceral_stable_fat_high });
    }
  }

  // 조합 신호 최대 2개 제한
  signals.push(...combos.slice(0, 2));

  // ── 개별 신호로 보완 (전체 3~5개 유지) ──────────────────────────
  const comboIds = new Set(signals.map(s => s.id));

  const individualCandidates: BodySignal[] = [];

  if (hasMuscle && muscleStatus) {
    individualCandidates.push({
      id: `skeletal_muscle_${muscleStatus}`,
      title: INDIVIDUAL_COPY.skeletal_muscle[muscleStatus].title,
      desc:  INDIVIDUAL_COPY.skeletal_muscle[muscleStatus].desc,
      status: muscleStatus,
    });
  }
  if (hasFatRate && fatRateStatus) {
    individualCandidates.push({
      id: `body_fat_${fatRateStatus}`,
      title: INDIVIDUAL_COPY.body_fat[fatRateStatus].title,
      desc:  INDIVIDUAL_COPY.body_fat[fatRateStatus].desc,
      status: fatRateStatus,
    });
  }
  if (hasVisceral && visceralStatus) {
    individualCandidates.push({
      id: `visceral_fat_${visceralStatus}`,
      title: INDIVIDUAL_COPY.visceral_fat_level[visceralStatus].title,
      desc:  INDIVIDUAL_COPY.visceral_fat_level[visceralStatus].desc,
      status: visceralStatus,
    });
  }
  if (hasFatMass && fatMassStatus) {
    individualCandidates.push({
      id: `body_fat_mass_${fatMassStatus}`,
      title: INDIVIDUAL_COPY.body_fat_mass[fatMassStatus].title,
      desc:  INDIVIDUAL_COPY.body_fat_mass[fatMassStatus].desc,
      status: fatMassStatus,
    });
  }
  if (hasAbdom && abdomStatus) {
    individualCandidates.push({
      id: `abdominal_fat_${abdomStatus}`,
      title: INDIVIDUAL_COPY.abdominal_fat_ratio[abdomStatus].title,
      desc:  INDIVIDUAL_COPY.abdominal_fat_ratio[abdomStatus].desc,
      status: abdomStatus,
    });
  }

  // 주의·보통 우선 정렬 후 채우기
  const ranked = [
    ...individualCandidates.filter(s => s.status === 'warning'),
    ...individualCandidates.filter(s => s.status === 'normal'),
    ...individualCandidates.filter(s => s.status === 'good'),
  ];

  for (const candidate of ranked) {
    if (signals.length >= 5) break;
    // 조합 신호와 중복 맥락 방지 (같은 지표를 두 번 보여주지 않음)
    const alreadyCovered = comboIds.has('muscle_fat_trend') && candidate.id.startsWith('skeletal_muscle');
    if (!alreadyCovered) {
      signals.push(candidate);
    }
  }

  // 지표가 모두 없거나 모두 좋음이고 조합 신호도 없는 경우
  const hasAnyData = hasMuscle || hasFatRate || hasFatMass || hasAbdom || hasVisceral;
  const allGood = hasAnyData && signals.every(s => s.status === 'good');

  if (signals.length === 0 || allGood) {
    // 전체 양호 신호를 맨 앞에 추가
    const isAllGoodAlready = signals.some(s => s.id === 'all_good');
    if (!isAllGoodAlready) {
      signals.unshift({ id: 'all_good', ...COMBO_COPY.all_good });
    }
  }

  return signals.slice(0, 5);
}
