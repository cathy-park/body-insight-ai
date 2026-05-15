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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const userRecords    = useHealthStore((state) => state.userRecords);
  const currentUserId  = useHealthStore((state) => state.currentUserId);
  const records        = useMemo(() => userRecords[currentUserId] || [], [userRecords, currentUserId]);
  const addRecord      = useHealthStore((state) => state.addRecord);
  const getUserSettings = useHealthStore((state) => state.getUserSettings);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: 0, muscle: 0, fat: 0, fatMass: 0, visceral: 0, abdominal: 0,
    waist_belly: 0, waist_beauty: 0, sleep: 7,
    alcohol: false, bowel: 'normal' as 'good' | 'normal' | 'bad', period: false
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const existing = records.find(r => r.date === format(date, 'yyyy-MM-dd'));
    if (existing) {
      setFormData({
        weight:      existing.weight               || 0,
        muscle:      existing.skeletal_muscle       || 0,
        fat:         existing.body_fat              || 0,
        fatMass:     existing.body_fat_mass         || 0,
        visceral:    existing.visceral_fat_level    || 0,
        abdominal:   existing.abdominal_fat_ratio   || 0,
        waist_belly: existing.waist_circumference_belly  || 0,
        waist_beauty:existing.waist_circumference_beauty || 0,
        sleep:       existing.sleep_hours           || 7,
        alcohol:     existing.alcohol_flag          || false,
        bowel:       (existing.bowel_condition as any) || 'normal',
        period:      existing.period_flag           || false,
      });
    } else {
      setFormData({ weight: 0, muscle: 0, fat: 0, fatMass: 0, visceral: 0, abdominal: 0, waist_belly: 0, waist_beauty: 0, sleep: 7, alcohol: false, bowel: 'normal', period: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    addRecord({
      date:                         format(selectedDate, 'yyyy-MM-dd'),
      weight:                       formData.weight,
      skeletal_muscle:              formData.muscle,
      body_fat:                     formData.fat,
      body_fat_mass:                formData.fatMass,
      visceral_fat_level:           formData.visceral,
      abdominal_fat_ratio:          formData.abdominal,
      waist_circumference_belly:    formData.waist_belly,
      waist_circumference_beauty:   formData.waist_beauty,
      bmi:                          (() => { const h = (getUserSettings().height ?? 165) / 100; return parseFloat((formData.weight / (h * h)).toFixed(1)); })(),
      sleep_hours:                  formData.sleep,
      alcohol_flag:                 formData.alcohol,
      bowel_condition:              formData.bowel,
      period_flag:                  formData.period,
      memo: '',
    });
    setIsModalOpen(false);
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
    <div className="max-w-5xl mx-auto pt-[60px] px-5 sm:px-10 pb-20 md:pb-10 animate-fade-up">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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

      {/* Record Modal */}
      {isModalOpen && selectedDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${format(selectedDate, 'MM월 dd일', { locale: ko })} 건강 기록`}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-[var(--surface-0)] rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg shadow-[var(--shadow-elevated)] flex flex-col max-h-[94dvh] sm:max-h-[90vh] border border-[var(--border)] overflow-hidden">

            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-white shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-0.5">날짜 기록</p>
                <h2 className="text-[17px] font-black text-[var(--text-primary)]">
                  {format(selectedDate, 'MM월 dd일 (EEE)', { locale: ko })}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'weight',      label: '체중 (kg)',     icon: Scale },
                  { key: 'muscle',      label: '근육량 (kg)',   icon: Activity },
                  { key: 'fat',         label: '지방률 (%)',    icon: PieChart },
                  { key: 'fatMass',     label: '지방량 (kg)',   icon: Heart },
                  { key: 'visceral',    label: '내장지방 (LV)', icon: Zap },
                  { key: 'abdominal',   label: '복부비율',      icon: Droplets },
                  { key: 'waist_belly', label: '복부둘레 (cm)', icon: Ruler },
                  { key: 'waist_beauty',label: '미용허리 (cm)', icon: Ruler },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <label
                      htmlFor={`cal-${key}`}
                      className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.12em] flex items-center gap-1.5 mb-1.5"
                    >
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      {label}
                    </label>
                    <input
                      id={`cal-${key}`}
                      type="number"
                      step="0.1"
                      value={(formData as any)[key] || ''}
                      onChange={e => setFormData({ ...formData, [key]: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                      placeholder="0.0"
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>

              {/* Lifestyle */}
              <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--accent)]">생활 습관</h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'alcohol', label: '음주',  icon: Wine,   active: formData.alcohol, colorOn: 'border-amber-400 bg-amber-50 text-amber-600', colorOff: '' },
                    { key: 'bowel',   label: '쾌변',  icon: Smile,  active: formData.bowel === 'good', colorOn: 'border-emerald-400 bg-emerald-50 text-emerald-600', colorOff: '' },
                    { key: 'period',  label: '생리',  icon: Droplet,active: formData.period, colorOn: 'border-rose-400 bg-rose-50 text-rose-500', colorOff: '' },
                  ].map(({ key, label, icon: Icon, active, colorOn }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'bowel') setFormData({ ...formData, bowel: formData.bowel === 'good' ? 'normal' : 'good' });
                        else setFormData({ ...formData, [key]: !(formData as any)[key] });
                      }}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        active ? colorOn : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-soft)]'
                      }`}
                      aria-pressed={active}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span className="text-[11px] font-bold">{label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="cal-sleep" className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                      수면 시간
                    </label>
                    <span className="text-[13px] font-black text-[var(--text-primary)]">{formData.sleep}h</span>
                  </div>
                  <input
                    id="cal-sleep"
                    type="range"
                    min="0" max="15" step="0.5"
                    value={formData.sleep}
                    onChange={(e) => setFormData({ ...formData, sleep: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-white border-t border-[var(--border)] shrink-0">
              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-cyan-200 cursor-pointer"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                기록 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
