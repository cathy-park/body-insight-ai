"use client";

import React from 'react';
import { HealthRecord } from '@/types';
import { computeBodySignals, type BodySignal, type SignalStatus } from '@/lib/bodySignals';

interface Props {
  records: HealthRecord[];
}

// ── 상태별 스타일 토큰 ─────────────────────────────────────────────
const STATUS_STYLES: Record<SignalStatus, {
  card: string;
  badge: string;
  badgeText: string;
  label: string;
}> = {
  good: {
    card:      'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100',
    badge:     'bg-emerald-100',
    badgeText: 'text-emerald-700',
    label:     '좋음',
  },
  normal: {
    card:      'bg-gradient-to-br from-sky-50 to-slate-50 border-sky-100',
    badge:     'bg-sky-100',
    badgeText: 'text-sky-700',
    label:     '보통',
  },
  warning: {
    card:      'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-100',
    badge:     'bg-orange-100',
    badgeText: 'text-orange-700',
    label:     '관리 필요',
  },
};

function SignalCard({ signal }: { signal: BodySignal }) {
  const style = STATUS_STYLES[signal.status];
  return (
    <article
      className={`flex flex-col gap-2 p-4 rounded-2xl border ${style.card} transition-all duration-200 hover:shadow-md active:scale-[0.98]`}
      aria-label={signal.title}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-black text-[var(--text-primary)] leading-snug">{signal.title}</p>
        <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${style.badge} ${style.badgeText}`}>
          {style.label}
        </span>
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{signal.desc}</p>
    </article>
  );
}

export function BodySignalSection({ records }: Props) {
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const prev   = records.length > 1 ? records[records.length - 2] : null;

  // 빈 상태
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

  // 체성분 데이터가 전혀 없으면 섹션 숨김
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
  const dateLabel = latest.date;

  return (
    <section aria-label="오늘의 바디 신호" className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
      <SectionHeader dateLabel={dateLabel} />

      {/* 모바일: 가로 스크롤 / 태블릿+: 2열 그리드 */}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {signals.map((signal) => (
          <div key={signal.id} className="shrink-0 w-[240px] sm:w-auto">
            <SignalCard signal={signal} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ dateLabel }: { dateLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] flex items-center gap-1.5 mb-0.5">
          <span aria-hidden="true">🧬</span>바디 신호 분석
        </p>
        <h2 className="text-base font-black text-[var(--text-primary)]">오늘의 바디 신호</h2>
      </div>
      {dateLabel && (
        <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] shrink-0">
          최근 기록 기준
        </span>
      )}
    </div>
  );
}
