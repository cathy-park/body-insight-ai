"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Scale,
  Activity,
  Heart,
  Droplets,
  Ruler,
  Zap,
  PieChart,
  Droplet,
  Wine,
  Smile,
  Flame,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { RecordModal } from '@/components/RecordModal';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const userRecords    = useHealthStore((state) => state.userRecords);
  const currentUserId  = useHealthStore((state) => state.currentUserId);
  const records        = useMemo(() => userRecords[currentUserId] || [], [userRecords, currentUserId]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const streak = useMemo(() => {
    const dateSet = new Set(records.map(r => r.date));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dateSet.has(format(d, 'yyyy-MM-dd'))) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [records]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end   = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const inputClass = "w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all cursor-text";

  return (
    <>
      <div className="max-w-5xl mx-auto pt-[100px] px-5 sm:px-10 pb-20 md:pb-10 animate-fade-up">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-1">
            날짜별 기록
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">건강 캘린더</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-sm text-[var(--text-muted)]">날짜를 클릭해 기록을 추가하거나 수정하세요</p>
            {streak > 0 && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black ${
                streak >= 7
                  ? 'bg-orange-50 border border-orange-200 text-orange-600'
                  : 'bg-[var(--accent-muted)] border border-[var(--accent-soft)] text-[var(--accent)]'
              }`}>
                <Flame className="w-3 h-3" aria-hidden="true" />
                {streak}일 연속 기록 중
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-[var(--border)] px-4 py-2.5 rounded-2xl shadow-[var(--shadow-card)] self-start sm:self-auto">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-[var(--surface-2)] rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          </button>
          <time
            dateTime={format(currentMonth, 'yyyy-MM')}
            className="text-[14px] font-black min-w-[110px] text-center text-[var(--text-primary)]"
          >
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </time>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-[var(--surface-2)] rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Calendar grid */}
      <section
        aria-label={`${format(currentMonth, 'yyyy년 MM월', { locale: ko })} 달력`}
        className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden"
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-[var(--surface-2)] border-b border-[var(--border)]" role="row">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div
              key={day}
              role="columnheader"
              className={`py-3 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] ${
                i === 0 ? 'text-rose-400' : i === 6 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            const record         = records.find(r => r.date === format(date, 'yyyy-MM-dd'));
            const isToday        = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <button
                key={i}
                onClick={() => handleDateClick(date)}
                aria-label={`${format(date, 'M월 d일', { locale: ko })}${record ? ' — 기록 있음' : ''}`}
                className={`h-[72px] sm:h-[100px] border-b border-r border-[var(--border-subtle)] p-2 sm:p-3 transition-colors text-left relative cursor-pointer ${
                  !isCurrentMonth
                    ? 'opacity-25 bg-[var(--surface-2)]'
                    : isToday
                    ? 'bg-[var(--accent-muted)]'
                    : 'hover:bg-[var(--surface-2)] active:bg-[var(--accent-muted)]'
                }`}
              >
                <span className={`text-[11px] sm:text-[13px] font-black ${
                  isToday
                    ? 'text-[var(--accent)] bg-[var(--accent)] text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : i % 7 === 0
                    ? 'text-rose-400'
                    : i % 7 === 6
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}>
                  {format(date, 'd')}
                </span>

                {record && (
                  <div className="mt-1 space-y-0.5">
                    {record.period_flag && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-400 rounded-full" aria-hidden="true" />
                    )}
                    {record.weight > 0 && (
                      <span className="block text-[9px] sm:text-[10px] font-black text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded-full w-fit leading-none">
                        {record.weight}
                        <span className="hidden sm:inline">kg</span>
                      </span>
                    )}
                    <div className="flex gap-0.5 items-center">
                      {record.alcohol_flag && <Wine className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" aria-hidden="true" />}
                      {record.bowel_condition === 'good' && <Smile className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" aria-hidden="true" />}
                      {record.mounjaro_flag && <span className="text-[7px] font-black text-violet-500 bg-violet-50 px-1 rounded-full hidden sm:block">MJ</span>}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      </div>
      
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />
    </>
  );
}
