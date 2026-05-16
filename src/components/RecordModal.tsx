"use client";

import React, { useState, useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { NewHealthRecord } from '@/types';
import { Save, Activity, X } from 'lucide-react';
import { format } from 'date-fns';
import { Toast } from '@/components/Toast';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // yyyy-MM-dd
}

function Toggle({ name, checked, onChange, label, sub }: {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      <label className="toggle-switch" aria-label={label}>
        <input type="checkbox" name={name} checked={checked} onChange={onChange} />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
      </label>
    </div>
  );
}

export function RecordModal({ isOpen, onClose, initialDate }: RecordModalProps) {
  const addRecord      = useHealthStore((state) => state.addRecord);
  const getRecords     = useHealthStore((state) => state.getRecords);
  const getUserSettings = useHealthStore((state) => state.getUserSettings);

  const blankForm: NewHealthRecord = {
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    weight: 0, skeletal_muscle: 0, body_fat: 0, body_fat_mass: 0,
    visceral_fat_level: 0, abdominal_fat_ratio: 0,
    waist_circumference_belly: 0, waist_circumference_beauty: 0,
    sleep_hours: 7, alcohol_flag: false, bowel_condition: 'normal',
    period_flag: false, mounjaro_flag: false, mounjaro_dose: 0, memo: '',
  };

  const [formData, setFormData] = useState<NewHealthRecord>(blankForm);
  const [sleepH, setSleepH] = useState(7);
  const [sleepM, setSleepM] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  useEffect(() => {
    if (!isOpen) return;
    
    const records = getRecords();
    const existing = initialDate ? records.find(r => r.date === initialDate) : null;
    
    if (existing) {
      setFormData({
        ...existing,
        memo: existing.memo || '',
      });
      const h = Math.floor(existing.sleep_hours);
      const m = Math.round((existing.sleep_hours - h) * 60);
      setSleepH(h);
      setSleepM(m);
    } else {
      const latest = records.length > 0
        ? [...records].sort((a, b) => b.date.localeCompare(a.date))[0]
        : null;

      setFormData({
        ...blankForm,
        weight:                     latest?.weight                     ?? 0,
        skeletal_muscle:            latest?.skeletal_muscle            ?? 0,
        body_fat:                   latest?.body_fat                   ?? 0,
        body_fat_mass:              latest?.body_fat_mass              ?? 0,
        visceral_fat_level:         latest?.visceral_fat_level         ?? 0,
        abdominal_fat_ratio:        latest?.abdominal_fat_ratio        ?? 0,
        waist_circumference_belly:  latest?.waist_circumference_belly  ?? 0,
        waist_circumference_beauty: latest?.waist_circumference_beauty ?? 0,
        sleep_hours:                latest?.sleep_hours                ?? 7,
        bowel_condition:            latest?.bowel_condition            ?? 'normal',
        period_flag:                latest?.period_flag                ?? false,
        mounjaro_flag:              latest?.mounjaro_flag              ?? false,
        mounjaro_dose:              latest?.mounjaro_dose              ?? 0,
      });
      
      const h = Math.floor(latest?.sleep_hours ?? 7);
      const m = Math.round(((latest?.sleep_hours ?? 7) - h) * 60);
      setSleepH(h);
      setSleepM(m);
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, sleep_hours: sleepH + (sleepM / 60) }));
  }, [sleepH, sleepM]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'checkbox') parsedValue = (e.target as HTMLInputElement).checked;
    else if (type === 'number') parsedValue = value === '' ? 0 : parseFloat(value);
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || formData.weight <= 0) {
      showToast('날짜와 체중은 필수 입력 항목입니다.', 'error');
      return;
    }
    const h = (getUserSettings().height ?? 165) / 100;
    addRecord({ ...formData, bmi: parseFloat((formData.weight / (h * h)).toFixed(1)) });
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm cursor-text";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-1.5";
  const sectionClass = "bg-white p-5 rounded-2xl border border-[var(--border)] space-y-4 shadow-[var(--shadow-card)]";

  return (
    <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] px-0 pt-0 pb-[68px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="건강 기록 입력"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--surface-0)] w-full max-w-5xl rounded-t-[28px] sm:rounded-[28px] border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden max-h-[94dvh] sm:max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0 bg-white">
          <div>
            <h2 className="text-[17px] font-black text-[var(--text-primary)] tracking-tight">건강 기록하기</h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">신체 측정값, 생활 습관을 기록하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4" id="modal-record-form" noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* 1. 기본 체성분 */}
              <section className={sectionClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-0.5">기본 측정값</p>
                    <h3 className="text-[14px] font-black text-[var(--text-primary)]">체성분</h3>
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-date" className={labelClass}>기록 날짜</label>
                  <input
                    id="modal-date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-weight" className={labelClass}>체중 (kg)</label>
                    <input id="modal-weight" type="number" step="0.1" name="weight" value={formData.weight || ''} onChange={handleChange} className={inputClass} required placeholder="0.0" inputMode="decimal" />
                  </div>
                  <div>
                    <label htmlFor="modal-skeletal_muscle" className={labelClass}>골격근량 (kg)</label>
                    <input id="modal-skeletal_muscle" type="number" step="0.1" name="skeletal_muscle" value={formData.skeletal_muscle || ''} onChange={handleChange} className={inputClass} placeholder="0.0" inputMode="decimal" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-body_fat" className={labelClass}>체지방률 (%)</label>
                    <input id="modal-body_fat" type="number" step="0.1" name="body_fat" value={formData.body_fat || ''} onChange={handleChange} className={inputClass} placeholder="0.0" inputMode="decimal" />
                  </div>
                  <div>
                    <label htmlFor="modal-body_fat_mass" className={labelClass}>체지방량 (kg)</label>
                    <input id="modal-body_fat_mass" type="number" step="0.1" name="body_fat_mass" value={formData.body_fat_mass || ''} onChange={handleChange} className={inputClass} placeholder="0.0" inputMode="decimal" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-visceral_fat_level" className={labelClass}>내장지방 (LV)</label>
                    <input id="modal-visceral_fat_level" type="number" name="visceral_fat_level" value={formData.visceral_fat_level || ''} onChange={handleChange} className={inputClass} placeholder="0" inputMode="numeric" />
                  </div>
                  <div>
                    <label htmlFor="modal-abdominal_fat_ratio" className={labelClass}>복부지방비율</label>
                    <input id="modal-abdominal_fat_ratio" type="number" step="0.01" name="abdominal_fat_ratio" value={formData.abdominal_fat_ratio || ''} onChange={handleChange} className={inputClass} placeholder="0.00" inputMode="decimal" />
                  </div>
                </div>
              </section>

              {/* 2. 상세 신체 치수 */}
              <section className={sectionClass}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-0.5">신체 측정</p>
                  <h3 className="text-[14px] font-black text-[var(--text-primary)]">상세 치수</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-waist_belly" className={labelClass}>복부 둘레 (cm)</label>
                    <input id="modal-waist_belly" type="number" step="0.1" name="waist_circumference_belly" value={formData.waist_circumference_belly || ''} onChange={handleChange} className={inputClass} placeholder="0.0" inputMode="decimal" />
                  </div>
                  <div>
                    <label htmlFor="modal-waist_beauty" className={labelClass}>미용 허리 (cm)</label>
                    <input id="modal-waist_beauty" type="number" step="0.1" name="waist_circumference_beauty" value={formData.waist_circumference_beauty || ''} onChange={handleChange} className={inputClass} placeholder="0.0" inputMode="decimal" />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-memo" className={labelClass}>오늘의 메모</label>
                  <textarea
                    id="modal-memo"
                    name="memo"
                    rows={5}
                    value={formData.memo}
                    onChange={handleChange}
                    className={`${inputClass} resize-none font-normal leading-relaxed`}
                    placeholder="오늘의 특이사항, 컨디션 등을 자유롭게 적어보세요."
                  />
                </div>
              </section>

              {/* 3. 생활 패턴 */}
              <section className={sectionClass}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-0.5">라이프스타일</p>
                  <h3 className="text-[14px] font-black text-[var(--text-primary)]">생활 패턴 & 치료</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>수면 시간</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={sleepH}
                          onChange={(e) => setSleepH(parseInt(e.target.value))}
                          className={`${inputClass} appearance-none pr-8`}
                        >
                          {Array.from({ length: 25 }).map((_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-muted)] pointer-events-none">H</span>
                      </div>
                      <div className="relative flex-1">
                        <select
                          value={sleepM}
                          onChange={(e) => setSleepM(parseInt(e.target.value))}
                          className={`${inputClass} appearance-none pr-8`}
                        >
                          {[0, 10, 20, 30, 40, 50].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-muted)] pointer-events-none">M</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>배변 상태</label>
                    <div className="h-[46px] flex items-center">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, bowel_condition: prev.bowel_condition === 'good' ? 'normal' : 'good' }))}
                        className={`w-full h-full rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          formData.bowel_condition === 'good'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${formData.bowel_condition === 'good' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        배변 성공
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border-subtle)] px-4">
                  <Toggle name="period_flag" checked={formData.period_flag} onChange={handleChange} label="생리 기간" />
                  <Toggle name="alcohol_flag" checked={formData.alcohol_flag} onChange={handleChange} label="음주" />
                </div>

                <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] px-4">
                  <Toggle
                    name="mounjaro_flag"
                    checked={!!formData.mounjaro_flag}
                    onChange={handleChange}
                    label="마운자로 투여"
                    sub="GLP-1 비만치료 주사"
                  />
                  {formData.mounjaro_flag && (
                    <div className="pb-3 border-t border-[var(--border-subtle)] pt-3">
                      <label htmlFor="modal-mounjaro_dose" className={labelClass}>투여 용량 (mg)</label>
                      <select
                        id="modal-mounjaro_dose"
                        name="mounjaro_dose"
                        value={formData.mounjaro_dose}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-xl font-bold text-[var(--text-primary)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
                      >
                        <option value={0}>용량 선택</option>
                        <option value={2.5}>2.5 mg</option>
                        <option value={5.0}>5.0 mg</option>
                        <option value={7.5}>7.5 mg</option>
                        <option value={10.0}>10.0 mg</option>
                        <option value={12.5}>12.5 mg</option>
                        <option value={15.0}>15.0 mg</option>
                      </select>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </form>
        </div>

        {/* Bottom action bar */}
        <div className="px-5 py-4 bg-white border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl border border-[var(--border)] transition-all cursor-pointer min-h-[44px]"
          >
            취소
          </button>
          <button
            type="submit"
            form="modal-record-form"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white text-sm font-black rounded-xl shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            기록 저장
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
