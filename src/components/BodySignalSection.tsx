"use client";

import React from 'react';
import { HealthRecord } from '@/types';
import { computeBodySignals, type BodySignal, type SignalStatus } from '@/lib/bodySignals';

interface Props {
  records: HealthRecord[];
}

// ── 상태별 스타일 토큰 ─────────────────────────────────────────────
// 4단계: good(그린) / normal(블루-그레이) / warning(오렌지) / critical(레드-코랄)
const STATUS_STYLES: Record<SignalStatus, {
  card:      string;
  border:    string;
  badge:     string;
  badgeText: string;
  dot:       string;
  label:     string;
}> = {
  good: {
    card:      'bg-gradient-to-br from-emerald-50 to-teal-50',
    border:    'border-emerald-200',
    badge:     'bg-emerald-100',
    badgeText: 'text-emerald-700',
    dot:       'bg-emerald-400',
    label:     '좋음',
  },
  normal: {
    card:      'bg-gradient-to-br from-sky-50 to-slate-50',
    border:    'border-sky-200',
    badge:     'bg-sky-100',
    badgeText: 'text-sky-700',
    dot:       'bg-sky-400',
    label:     '보통',
  },
  warning: {
    card:      'bg-gradient-to-br from-amber-50 to-orange-50',
    border:    'border-orange-200',
    badge:     'bg-orange-100',
    badgeText: 'text-orange-700',
    dot:       'bg-orange-400',
    label:     '주의',
  },
  critical: {
    card:      'bg-gradient-to-br from-rose-50 to-red-50',
    border:    'border-rose-200',
    badge:     'bg-rose-100',
    badgeText: 'text-rose-700',
    dot:       'bg-rose-500',
    label:     '집중관리',
  },
};

function SignalCard({ signal }: { signal: BodySignal }) {
  const style = STATUS_STYLES[signal.status];
  const isCritical = signal.status === 'critical';
  const isWarning  = signal.status === 'warning';

  return (
    <article
      className={[
        'flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-200',
        'sm:hover:shadow-md sm:active:scale-[0.98]',
        style.card,
        style.border,
        isCritical ? 'border-[1.5px]' : 'border',
      ].join(' ')}
      aria-label={signal.title}
    >
      {/* 상단: 타이틀 + 뱃지 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {/* 상태 인디케이터 점 */}
          <span
            className={`mt-[3px] w-2 h-2 rounded-full shrink-0 ${style.dot} ${isCritical || isWarning ? 'motion-safe:animate-pulse' : ''}`}
            aria-hidden="true"
          />
          <p className="text-[14px] font-black text-[var(--text-primary)] leading-snug">{signal.title}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${style.badge} ${style.badgeText}`}
        >
          {style.label}
        </span>
      </div>

      {/* 설명 */}
      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed pl-4">{signal.desc}</p>
    </article>
  );
}

export function BodySignalSection({ records }: Props) {
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const prev   = records.length > 1 ? records[records.length - 2] : null;

  // 기록 없음
  if (!latest) {
    return (
      <section aria-label="오늘의 바디 신호" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <span className="text-3xl" aria-hidden="true">🌱</span>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
            아직 분석할 기록이 없어요.<br />오늘 기록을 추가하면 바디 신호를 확인할 수 있어요.
          </p>
        </div>
      </section>
    );
  }

  // 체성분 데이터 없음
  const hasBodyComposition =
    latest.skeletal_muscle > 0 ||
    latest.body_fat > 0 ||
    latest.body_fat_mass > 0 ||
    latest.abdominal_fat_ratio > 0 ||
    latest.visceral_fat_level > 0;

  if (!hasBodyComposition) {
    return (
      <section aria-label="오늘의 바디 신호" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <span className="text-3xl" aria-hidden="true">📋</span>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
            체성분 데이터가 없어요.<br />인바디 측정값을 기록하면 바디 신호를 확인할 수 있어요.
          </p>
        </div>
      </section>
    );
  }

  const signals = computeBodySignals(latest, prev);

  // 최우선 상태 집계 (헤더 서브라벨용)
  const topStatus = signals[0]?.status ?? 'good';
  const hasUrgent = topStatus === 'critical' || topStatus === 'warning';

  return (
    <section aria-label="오늘의 바디 신호" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
      <SectionHeader hasUrgent={hasUrgent} />

      {/* 모바일: 가로 스크롤(다음 카드 ~20% 노출) / sm+: 2열 그리드 */}
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide scroll-smooth snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible">
        {signals.map((signal) => (
          <div key={signal.id} className="shrink-0 w-[82vw] sm:w-auto snap-start">
            <SignalCard signal={signal} />
          </div>
        ))}
      </div>
    </section>
  );
}

const LEGEND_ITEMS = [
  { dot: 'bg-emerald-400', label: '좋음' },
  { dot: 'bg-sky-400',     label: '보통' },
  { dot: 'bg-orange-400',  label: '주의' },
  { dot: 'bg-rose-500',    label: '집중관리' },
] as const;

function SectionHeader({ dateLabel, hasUrgent }: { dateLabel?: string; hasUrgent?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* 제목 행 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-0.5">
            <span aria-hidden="true">🧬</span>바디 신호 분석
          </p>
          <h2 className="text-base font-black text-[var(--text-primary)]">오늘의 바디 신호</h2>
        </div>

        {/* 우측: PC 범례 + 배지 (공통 배지는 항상 표시) */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]"
            aria-label="상태 범례"
          >
            {LEGEND_ITEMS.map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">{label}</span>
              </span>
            ))}
          </div>
          <span
            className={[
              'text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 self-start',
              hasUrgent
                ? 'text-[var(--accent)] bg-[var(--accent-muted)] border-[var(--accent-soft)]'
                : 'text-[var(--text-muted)] bg-[var(--surface-2)] border-[var(--border-subtle)]',
            ].join(' ')}
          >
            최근 기록 기준
          </span>
        </div>
      </div>

      {/* 모바일 범례 — 풀폭 미니 안내 바 */}
      <div
        className="sm:hidden flex items-center gap-4 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] overflow-x-auto scrollbar-hide"
        aria-label="상태 범례"
      >
        {LEGEND_ITEMS.map(({ dot, label }) => (
          <span key={label} className="flex items-center gap-1 whitespace-nowrap shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
