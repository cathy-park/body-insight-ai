"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';
import {
  Download, Upload, ShieldCheck, Clock, Database, FileJson,
  AlertTriangle, Ruler, Target, Bell, BellOff, ChevronRight,
} from 'lucide-react';

interface ToastState { message: string; type: 'success' | 'error'; }

function formatDate(iso: string | null): string {
  if (!iso) return '없음';
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    users, userRecords, exportData, importData, lastBackupAt,
    getUserSettings, updateUserSettings,
  } = useHealthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const settings = getUserSettings();
  const totalRecords = Object.values(userRecords).reduce((s, r) => s + r.length, 0);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v > 0) updateUserSettings({ height: v });
  };

  const handleTargetWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === '' ? null : parseFloat(e.target.value);
    updateUserSettings({ targetWeight: v && !isNaN(v) ? v : null });
  };

  const handleReminderToggle = async () => {
    if (settings.reminderEnabled) {
      updateUserSettings({ reminderEnabled: false });
      return;
    }

    // 모바일 앱 WebView 환경 탐지
    const isMobileApp = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;
    if (isMobileApp) {
      showToast('모바일 앱 기기 알림 기능은 추후 정식 업데이트될 예정입니다! 🔔', 'success');
      return;
    }

    if (!('Notification' in window)) {
      showToast('이 브라우저는 알림을 지원하지 않습니다.', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateUserSettings({ reminderEnabled: true });
      showToast('알림이 활성화되었습니다.', 'success');
    } else {
      showToast('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.', 'error');
    }
  };

  const handleExport = () => { exportData(); showToast('백업 파일이 다운로드되었습니다.', 'success'); };

  const processFile = useCallback((file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ok = importData(e.target?.result as string);
        setIsImporting(false);
        if (ok) showToast('데이터 복원이 완료되었습니다!', 'success');
        else showToast('올바르지 않은 백업 파일입니다.', 'error');
      } catch { setIsImporting(false); showToast('파일을 읽는 중 오류가 발생했습니다.', 'error'); }
    };
    reader.readAsText(file);
  }, [importData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const inputClass = "w-24 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-right";

  return (
    <div className="max-w-3xl mx-auto pt-[84px] px-5 sm:px-10 pb-28 md:pb-10 space-y-6 animate-fade-up">
      <header>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-1">설정</p>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">개인 설정</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">신체 정보, 알림, 데이터 관리를 설정하세요.</p>
      </header>

      {/* 신체 정보 */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-1">
        <p className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] flex items-center gap-2 mb-3">
          <Ruler className="w-4 h-4" aria-hidden="true" />
          신체 정보
        </p>
        <div className="divide-y divide-[var(--border-subtle)]">
          <SettingRow label="키" sub="BMI 자동 계산에 사용됩니다">
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="100" max="220" step="0.1"
                value={settings.height || ''}
                onChange={handleHeightChange}
                className={inputClass}
                aria-label="키 입력 (cm)"
                inputMode="decimal"
              />
              <span className="text-[13px] font-bold text-[var(--text-muted)]">cm</span>
            </div>
          </SettingRow>
          <SettingRow label="목표 체중" sub="대시보드에서 목표 달성 진행률을 확인합니다">
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="30" max="200" step="0.1"
                value={settings.targetWeight ?? ''}
                onChange={handleTargetWeightChange}
                placeholder="—"
                className={inputClass}
                aria-label="목표 체중 입력 (kg)"
                inputMode="decimal"
              />
              <span className="text-[13px] font-bold text-[var(--text-muted)]">kg</span>
            </div>
          </SettingRow>
        </div>
      </section>

      {/* 알림 설정 */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-1">
        <p className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4" aria-hidden="true" />
          일일 기록 알림
        </p>
        <div className="divide-y divide-[var(--border-subtle)]">
          <SettingRow label="기록 알림" sub="오늘 기록이 없을 때 알림을 보내드립니다">
            <button
              type="button"
              role="switch"
              aria-checked={settings.reminderEnabled}
              onClick={handleReminderToggle}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.reminderEnabled ? 'bg-[var(--accent)]' : 'bg-slate-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.reminderEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </SettingRow>
          {settings.reminderEnabled && (
            <SettingRow label="알림 시간" sub="해당 시간 이후 앱을 열면 알림을 표시합니다">
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => updateUserSettings({ reminderTime: e.target.value })}
                className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
                aria-label="알림 시간"
              />
            </SettingRow>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] pt-2 flex items-start gap-1.5">
          <BellOff className="w-3 h-3 shrink-0 mt-0.5" aria-hidden="true" />
          알림은 앱이 열려있을 때 브라우저 알림으로 전송됩니다.
        </p>
      </section>

      {/* 데이터 현황 */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-4">
        <p className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] flex items-center gap-2">
          <Database className="w-4 h-4" aria-hidden="true" />
          저장된 데이터
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--accent-muted)] rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[var(--accent)]">{users.length}</p>
            <p className="text-[11px] font-bold text-[var(--accent)] mt-1 opacity-70">사용자</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{totalRecords}</p>
            <p className="text-[11px] font-bold text-emerald-500 mt-1">건강 기록</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <time className="text-[11px] font-black text-amber-600 leading-tight block" dateTime={lastBackupAt || undefined}>
              {formatDate(lastBackupAt)}
            </time>
            <p className="text-[11px] font-bold text-amber-500 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              마지막 백업
            </p>
          </div>
        </div>
      </section>

      {/* 백업 */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[var(--text-primary)]">백업하기</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">모든 건강 기록, 메모, 개인 설정을 JSON 파일로 내보냅니다.</p>
            <button
              onClick={handleExport}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl font-bold text-sm hover:bg-[var(--accent-hover)] active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              JSON 파일로 백업
            </button>
          </div>
        </div>
      </section>

      {/* 복원 */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[var(--text-primary)]">복원하기</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">이전에 내보낸 백업 파일을 불러와 데이터를 복원합니다.</p>
            <div
              role="button" tabIndex={0} aria-label="백업 파일 선택"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-[var(--border)] hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <FileJson className={`w-9 h-9 mb-3 transition-colors ${isDragging ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`} aria-hidden="true" />
              {isImporting
                ? <p className="text-sm font-bold text-emerald-600">복원 중...</p>
                : <><p className="text-sm font-bold text-[var(--text-secondary)] text-center">백업 파일을 드래그하거나 클릭해서 선택</p><p className="text-xs text-[var(--text-muted)] mt-1">.json 파일만 지원</p></>
              }
            </div>
            <input type="file" ref={fileInputRef} accept="*/*" onChange={handleFileChange} className="hidden" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100" role="alert">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-bold text-amber-800">복원 시 주의사항</p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">백업 파일을 불러오면 현재 저장된 데이터가 백업 파일의 내용으로 교체됩니다.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[var(--text-muted)] justify-center pt-2">
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        <span className="text-xs font-bold">모든 데이터는 이 기기에만 저장됩니다.</span>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
