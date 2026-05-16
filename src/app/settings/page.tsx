"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';
import {
  Download, Upload, ShieldCheck, Clock, Database, FileJson,
  AlertTriangle, Ruler, Target, Bell, BellOff, ChevronRight,
} from 'lucide-react';
import { getAnonymousDeviceId } from '@/services/userService';
import { generateSyncCode, resolveSyncCode } from '@/services/syncService';


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
    getUserSettings, updateUserSettings, currentUserId, getRecords,
  } = useHealthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [inputSyncCode, setInputSyncCode] = useState('');
  const [isGeneratingSync, setIsGeneratingSync] = useState(false);
  const [isResolvingSync, setIsResolvingSync] = useState(false);


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

  const handleGenerateSyncCode = async () => {
    try {
      setIsGeneratingSync(true);

      // 1. 현재 기기에 쌓여있는 로컬 건강 기록을 Firestore 클라우드로 100% 강제 백업
      const localRecords = getRecords();
      if (localRecords.length > 0) {
        const { bulkUpsertBodyRecords } = await import('@/services/healthRecordService');
        const { getFirestoreUserId } = await import('@/services/userService');
        await bulkUpsertBodyRecords(getFirestoreUserId(currentUserId), localRecords);
      }

      // 2. 8자리 임시 핀코드 발급
      const deviceId = getAnonymousDeviceId();
      const code = await generateSyncCode(deviceId);
      setSyncCode(code);
      showToast('데이터 클라우드 백업 및 동기화 코드 발급 완료! 📱', 'success');
    } catch (err: any) {
      showToast(err.message || '코드 생성 또는 백업 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsGeneratingSync(false);
    }
  };

  const handleResolveSyncCode = async () => {
    if (!inputSyncCode.trim()) {
      showToast('동기화 코드를 입력해주세요.', 'error');
      return;
    }
    try {
      setIsResolvingSync(true);
      const newDeviceId = await resolveSyncCode(inputSyncCode);
      if (newDeviceId) {
        localStorage.setItem('anonymousUserId', newDeviceId);
        showToast('기기 연동 성공! 동기화된 데이터를 불러옵니다... 🔄', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showToast('유효하지 않은 동기화 코드입니다. 다시 확인해주세요.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '연동 도중 오류가 발생했습니다.', 'error');
    } finally {
      setIsResolvingSync(false);
    }
  };


  const inputClass = "w-24 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-right";

  return (
    <div className="max-w-3xl mx-auto pt-[100px] px-5 sm:px-10 pb-20 md:pb-10 space-y-6 animate-fade-up">
      <header className="mb-4 sm:mb-10">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-0.5 sm:mb-1">설정</p>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">개인 설정</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 sm:mt-1.5">신체 정보, 알림, 데이터 관리를 설정하세요.</p>
      </header>

      {/* 신체 정보 */}
      <section className="!mt-0 bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-1">
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

      {/* 기기 데이터 동기화 (Firestore Sync Code) */}
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--accent)]">기기 데이터 동기화</h2>
        </div>
        
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-[var(--text-primary)]">모바일-PC 실시간 데이터 연동</p>
          <p className="text-[11px] text-[var(--text-muted)]">파이어베이스를 통해 모바일에서 작성한 데이터를 PC 브라우저에서도 실시간으로 연동합니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
          {/* 데이터를 내보낼 기기 (데이터 있음) */}
          <div className="bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-[var(--text-primary)] mb-1">📤 데이터를 내보낼 기기 (기존 스마트폰)</p>
              <p className="text-[11px] text-[var(--text-muted)]">이 기기의 모든 데이터를 클라우드에 백업하고, 8자리 고유 코드를 생성합니다.</p>
            </div>
            {syncCode ? (
              <div className="bg-white border-2 border-[var(--accent)] px-4 py-3 rounded-xl text-center animate-pulse shadow-sm">
                <p className="text-[10px] font-bold text-[var(--accent)] mb-0.5">보안 동기화 코드</p>
                <p className="text-xl font-black text-[var(--text-primary)] tracking-widest">
                  {syncCode.slice(0, 4)} {syncCode.slice(4)}
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateSyncCode}
                disabled={isGeneratingSync}
                className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-[var(--shadow-card)] shadow-[var(--accent-soft)]"
              >
                {isGeneratingSync ? '백업 및 코드 발급 중...' : '전체 백업 및 코드 발급'}
              </button>
            )}
          </div>

          {/* 데이터를 가져올 기기 (데이터 받을 곳) */}
          <div className="bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] flex flex-col justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-[var(--text-primary)] mb-1">📥 데이터를 가져올 기기 (PC 브라우저)</p>
              <p className="text-[11px] text-[var(--text-muted)]">코드를 발급한 기존 기기의 8자리 보안코드를 입력해 데이터를 그대로 연동해옵니다.</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="8자리 코드 입력"
                maxLength={12}
                value={inputSyncCode}
                onChange={(e) => setInputSyncCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-xl outline-none font-bold text-sm text-[var(--text-primary)] text-center focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent shadow-inner"
              />
              <button
                onClick={handleResolveSyncCode}
                disabled={isResolvingSync}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-cyan-100 flex items-center justify-center"
              >
                {isResolvingSync ? '기기 연동 중...' : '기기 데이터 연동하기'}
              </button>
            </div>
          </div>
        </div>
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
