"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';
import {
  Download,
  Upload,
  ShieldCheck,
  Clock,
  Database,
  FileJson,
  AlertTriangle,
} from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function formatDate(iso: string | null): string {
  if (!iso) return '없음';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SettingsPage() {
  const { users, userRecords, exportData, importData, lastBackupAt } = useHealthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const totalRecords = Object.values(userRecords).reduce((s, r) => s + r.length, 0);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const handleExport = () => {
    exportData();
    showToast('백업 파일이 다운로드되었습니다.', 'success');
  };

  const processFile = useCallback((file: File) => {
    // Some mobile devices might not report the correct extension, 
    // we check for .json but allow any if it's from a manual pick
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const ok = importData(text);
        setIsImporting(false);
        if (ok) showToast('데이터 복원이 완료되었습니다!', 'success');
        else showToast('올바르지 않은 백업 파일입니다.', 'error');
      } catch {
        setIsImporting(false);
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
  }, [importData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="max-w-5xl mx-auto pt-[92px] md:pt-[112px] px-5 sm:px-10 pb-24 space-y-6">
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">데이터 백업 & 복원</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">모든 건강 기록을 JSON 파일로 백업하거나 복원합니다.</p>
      </header>

      {/* Status card */}
      <section
        aria-labelledby="status-heading"
        className="bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6 space-y-4"
      >
        <p className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] flex items-center gap-2">
          <Database className="w-4 h-4" aria-hidden="true" />
          <span id="status-heading">현재 저장된 데이터</span>
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
            <time
              className="text-[12px] font-black text-amber-600 leading-tight block"
              dateTime={lastBackupAt || undefined}
            >
              {formatDate(lastBackupAt)}
            </time>
            <p className="text-[11px] font-bold text-amber-500 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              마지막 백업
            </p>
          </div>
        </div>
      </section>

      {/* Export */}
      <section
        aria-labelledby="export-heading"
        className="bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-[var(--accent-muted)] rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
            <Download className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <h2 id="export-heading" className="text-base font-bold text-[var(--text-primary)]">백업하기</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              모든 사용자의 건강 기록, 메모, 첨부 파일 정보를 JSON 파일로 내보냅니다. 파일을 안전한 곳에 보관하세요.
            </p>
            <button
              onClick={handleExport}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl font-bold text-sm hover:bg-[var(--accent-hover)] active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              JSON 파일로 백업
            </button>
          </div>
        </div>
      </section>

      {/* Import */}
      <section
        aria-labelledby="import-heading"
        className="bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
            <Upload className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 id="import-heading" className="text-base font-bold text-[var(--text-primary)]">복원하기</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              이전에 내보낸 백업 파일을 불러와 데이터를 복원합니다.
            </p>

            <div
              role="button"
              tabIndex={0}
              aria-label="백업 파일 선택 — 클릭하거나 파일을 드래그하세요"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-[var(--border)] hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <FileJson
                className={`w-9 h-9 mb-3 transition-colors ${isDragging ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}
                aria-hidden="true"
              />
              {isImporting ? (
                <p className="text-sm font-bold text-emerald-600">복원 중...</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-[var(--text-secondary)] text-center">백업 파일을 드래그하거나 클릭해서 선택</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">.json 파일만 지원</p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="*/*"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100" role="alert">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-bold text-amber-800">복원 시 주의사항</p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            백업 파일을 불러오면 현재 저장된 데이터가 백업 파일의 내용으로 교체됩니다. 복원 전 현재 데이터를 먼저 백업해두세요.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[var(--text-muted)] justify-center pt-2">
        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
        <span className="text-xs font-bold">모든 데이터는 이 기기에만 저장됩니다.</span>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
