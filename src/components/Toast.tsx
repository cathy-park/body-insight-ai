"use client";

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-[84px] left-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[var(--shadow-elevated)] text-sm font-bold max-w-[calc(100vw-40px)] sm:max-w-[400px] w-max animate-toast-in ${
        type === 'success'
          ? 'bg-[var(--surface-dark)] text-white'
          : 'bg-rose-500 text-white'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
        : <XCircle className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
      }
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity min-w-[24px] min-h-[24px] flex items-center justify-center shrink-0"
        aria-label="알림 닫기"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
