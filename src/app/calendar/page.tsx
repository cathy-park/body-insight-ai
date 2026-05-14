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
  Beer,
  Smile,
  Save,
  X,
  Scale,
  Activity,
  Heart,
  Droplets,
  Ruler,
  Zap,
  PieChart,
  Droplet
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const userRecords = useHealthStore((state) => state.userRecords);
  const currentUserId = useHealthStore((state) => state.currentUserId);
  const records = useMemo(() => userRecords[currentUserId] || [], [userRecords, currentUserId]);

  const addRecord = useHealthStore((state) => state.addRecord);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: 0, muscle: 0, fat: 0, fatMass: 0, visceral: 0, abdominal: 0,
    waist_belly: 0, waist_beauty: 0, sleep: 7,
    alcohol: false, bowel: 'bad' as 'good' | 'bad', period: false
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const existing = records.find(r => r.date === format(date, 'yyyy-MM-dd'));
    if (existing) {
      setFormData({
        weight: existing.weight || 0,
        muscle: existing.skeletal_muscle || 0,
        fat: existing.body_fat || 0,
        fatMass: existing.body_fat_mass || 0,
        visceral: existing.visceral_fat_level || 0,
        abdominal: existing.abdominal_fat_ratio || 0,
        waist_belly: existing.waist_circumference_belly || 0,
        waist_beauty: existing.waist_circumference_beauty || 0,
        sleep: existing.sleep_hours || 7,
        alcohol: existing.alcohol_flag || false,
        bowel: (existing.bowel_condition as any) === 'good' ? 'good' : 'bad',
        period: existing.period_flag || false
      });
    } else {
      setFormData({
        weight: 0, muscle: 0, fat: 0, fatMass: 0, visceral: 0, abdominal: 0,
        waist_belly: 0, waist_beauty: 0, sleep: 7,
        alcohol: false, bowel: 'bad', period: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    addRecord({
      date: dateStr,
      weight: formData.weight,
      skeletal_muscle: formData.muscle,
      body_fat: formData.fat,
      body_fat_mass: formData.fatMass,
      visceral_fat_level: formData.visceral,
      abdominal_fat_ratio: formData.abdominal,
      waist_circumference_belly: formData.waist_belly,
      waist_circumference_beauty: formData.waist_beauty,
      bmi: parseFloat((formData.weight / Math.pow(1.7, 2)).toFixed(1)),
      sleep_hours: formData.sleep,
      alcohol_flag: formData.alcohol,
      bowel_condition: formData.bowel,
      period_flag: formData.period,
      memo: '',
    });
    setIsModalOpen(false);
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const inputClass = "w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none font-bold text-[15px] text-[var(--text-primary)]";

  return (
    <div className="max-w-5xl mx-auto pt-[92px] md:pt-[112px] px-5 sm:px-10 pb-24">

      {/* Page header + month nav */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">건강 캘린더</h1>
          <p className="text-[12px] sm:text-sm text-[var(--text-secondary)] mt-1">기록하고 싶은 날짜를 선택하세요.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-center gap-4 bg-[var(--surface-1)] px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-[var(--surface-2)] rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          </button>
          <time
            dateTime={format(currentMonth, 'yyyy-MM')}
            className="text-[14px] sm:text-[15px] font-bold min-w-[100px] sm:min-w-[120px] text-center text-[var(--text-primary)]"
          >
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </time>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-[var(--surface-2)] rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Calendar grid */}
      <section
        aria-label={`${format(currentMonth, 'yyyy년 MM월', { locale: ko })} 달력`}
        className="bg-[var(--surface-1)] rounded-2xl sm:rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden"
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-[var(--surface-2)] border-b border-[var(--border-subtle)]" role="row">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div
              key={day}
              role="columnheader"
              aria-label={day}
              className={`py-2 sm:py-3.5 text-center text-[10px] sm:text-[12px] font-black uppercase tracking-[0.1em] ${
                i === 0 ? 'text-rose-400' : i === 6 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            const record = records.find(r => r.date === format(date, 'yyyy-MM-dd'));
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <button
                key={i}
                onClick={() => handleDateClick(date)}
                aria-label={`${format(date, 'M월 d일')}${record ? ' — 기록 있음' : ''}`}
                aria-pressed={isToday}
                className={`h-[70px] sm:h-[108px] border-b border-r border-[var(--border-subtle)] p-1.5 sm:p-3 transition-colors text-left relative ${
                  !isCurrentMonth
                    ? 'opacity-30 bg-[var(--surface-2)]'
                    : isToday
                    ? 'bg-[var(--accent-muted)]'
                    : 'hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className={`text-[11px] sm:text-[13px] font-bold ${
                  isToday ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {format(date, 'd')}
                </span>
                {record && (
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1.5 items-start">
                    {record.period_flag && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" aria-hidden="true" />
                    )}
                    {record.weight > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-black text-[var(--accent)] bg-[var(--accent-muted)] px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-full leading-none">
                        {record.weight}
                        <span className="hidden sm:inline">kg</span>
                      </span>
                    )}
                    <div className="flex gap-0.5 sm:gap-1 mt-0.5">
                      {record.alcohol_flag && <Beer className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-500" />}
                      {record.bowel_condition === 'good' && <Smile className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-500" />}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Record Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedDate ? `${format(selectedDate, 'MM월 dd일', { locale: ko })} 건강 기록` : '건강 기록'}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-xl p-5 sm:p-8 shadow-[var(--shadow-elevated)] flex flex-col max-h-[90vh] border border-[var(--border)] overflow-hidden">

            <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {format(selectedDate!, 'MM월 dd일 기록', { locale: ko })}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-[var(--surface-2)] rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6 sm:space-y-8 scrollbar-hide">
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5">
                {[
                  { key: 'weight', label: '체중 (kg)', icon: <Scale className="w-3.5 h-3.5" /> },
                  { key: 'muscle', label: '근육량 (kg)', icon: <Activity className="w-3.5 h-3.5" /> },
                  { key: 'fat', label: '지방률 (%)', icon: <PieChart className="w-3.5 h-3.5" /> },
                  { key: 'fatMass', label: '지방량 (kg)', icon: <Heart className="w-3.5 h-3.5" /> },
                  { key: 'visceral', label: '내장지방 (LV)', icon: <Zap className="w-3.5 h-3.5" /> },
                  { key: 'abdominal', label: '복부비율', icon: <Droplets className="w-3.5 h-3.5" /> },
                  { key: 'waist_belly', label: '복부둘레 (cm)', icon: <Ruler className="w-3.5 h-3.5" /> },
                  { key: 'waist_beauty', label: '미용허리 (cm)', icon: <Ruler className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <div key={item.key}>
                    <label
                      htmlFor={`modal-${item.key}`}
                      className="text-[10px] sm:text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1.5 sm:mb-2"
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </label>
                    <input
                      id={`modal-${item.key}`}
                      type="number"
                      step="0.1"
                      value={(formData as any)[item.key] || ''}
                      onChange={e => setFormData({ ...formData, [item.key]: parseFloat(e.target.value) })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold text-[14px] sm:text-[15px]"
                      placeholder="0.0"
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>

              {/* Lifestyle toggles */}
              <div className="pt-5 sm:pt-6 border-t border-[var(--border-subtle)] space-y-4 sm:space-y-5">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">생활 습관</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, alcohol: !formData.alcohol })}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-2 ${
                      formData.alcohol
                        ? 'border-amber-400 bg-amber-50 text-amber-600'
                        : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Beer className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-[11px] font-bold">음주</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, bowel: formData.bowel === 'good' ? 'bad' : 'good' })}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-2 ${
                      formData.bowel === 'good'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                        : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-[11px] font-bold">쾌변</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, period: !formData.period })}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-2 ${
                      formData.period
                        ? 'border-rose-400 bg-rose-50 text-rose-500'
                        : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Droplet className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-[11px] font-bold">생리</span>
                  </button>
                  <div
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-[var(--border)] flex flex-col items-center justify-center"
                  >
                    <span className="text-[13px] sm:text-[15px] font-black text-[var(--accent)]">{formData.sleep}h</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)]">수면</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={formData.sleep}
                  onChange={(e) => setFormData({ ...formData, sleep: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </div>

            <div className="pt-5 sm:pt-6 shrink-0">
              <button
                onClick={handleSave}
                className="w-full bg-[var(--accent)] text-white py-3.5 sm:py-4 rounded-xl font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                기록 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
