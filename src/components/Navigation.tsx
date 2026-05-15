"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Archive,
  ChevronDown,
  Trash2,
  UserPlus,
  Edit2,
  Check,
  Download,
  Upload,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';

interface ToastState { message: string; type: 'success' | 'error'; }

export function Navigation() {
  const pathname = usePathname();
  const { users, currentUserId, setCurrentUser, addUser, updateUserName, deleteUser, clearCurrentUserData, exportData, importData, getUserSettings, getRecords } = useHealthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const [newName, setNewName] = useState(currentUser.name);

  useEffect(() => {
    setNewName(currentUser.name);
    setIsEditingName(false);
  }, [currentUserId, currentUser.name]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileOpen]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const settings = getUserSettings();
    if (!settings.reminderEnabled) return;

    const [h, m] = settings.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderAt = new Date(now);
    reminderAt.setHours(h, m, 0, 0);
    if (now < reminderAt) return;

    const today = now.toISOString().split('T')[0];
    const hasTodayRecord = getRecords().some((r: any) => r.date === today);
    if (hasTodayRecord) return;

    const lastNotified = localStorage.getItem('reminder-last-date');
    if (lastNotified === today) return;

    new Notification('Body Insight AI', {
      body: '오늘 건강 기록을 아직 입력하지 않으셨어요 💪',
      icon: '/icon.png',
    });
    localStorage.setItem('reminder-last-date', today);
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const navItems = [
    { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    { name: '건강 캘린더', href: '/calendar', icon: CalendarIcon },
    { name: '건강 자료실', href: '/warehouse', icon: Archive },
    { name: '설정', href: '/settings', icon: Settings },
  ];

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateUserName(currentUserId, newName.trim());
      setIsEditingName(false);
    }
  };

  const handleExport = () => {
    exportData();
    showToast('백업 파일이 다운로드되었습니다.', 'success');
  };

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ok = importData(text);
        if (ok) showToast('데이터 복원이 완료되었습니다!', 'success');
        else showToast('올바르지 않은 백업 파일입니다.', 'error');
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [importData]);

  const userInitial = currentUser.name.substring(0, 1).toUpperCase();

  return (
    <>
      {/* Top Navigation — solid fixed bar */}
      <nav
        aria-label="주 내비게이션"
        className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white/90 backdrop-blur-md border-b border-black/[0.03] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

            {/* Logo + Desktop Nav */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 focus-visible:rounded-xl shrink-0"
                aria-label="Body Insight AI 홈"
              >
                <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm ring-1 ring-[var(--border)] shrink-0">
                  <img src="/icon.png" alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[15px] sm:text-[17px] font-black text-[var(--text-primary)] tracking-tighter leading-none">
                  Body <span className="gradient-text">Insight</span> AI
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-0.5" role="list">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="listitem"
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label="사용자 메뉴 열기"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--accent-muted)] rounded-full transition-colors border border-[var(--border)] cursor-pointer"
              >
                <div
                  className="w-6 h-6 bg-gradient-to-br from-[var(--accent)] to-cyan-400 text-white rounded-full flex items-center justify-center font-black text-[11px] shadow-sm"
                  aria-hidden="true"
                >
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-[13px] font-bold text-[var(--text-secondary)]">
                  {currentUser.name}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isProfileOpen && (
                <div
                  role="dialog"
                  aria-label="사용자 관리"
                  className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[var(--shadow-elevated)] border border-[var(--border)] py-2 z-50"
                >
                  {/* User management */}
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.18em] mb-2.5">사용자 관리</p>
                    <div className="space-y-0.5">
                      {users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between group">
                          {isEditingName && u.id === currentUserId ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                autoFocus
                                className="flex-1 bg-[var(--surface-2)] px-3 py-1.5 rounded-xl text-[13px] font-bold outline-none focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)]"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                                aria-label="사용자 이름 수정"
                              />
                              <button
                                onClick={handleUpdateName}
                                className="p-1.5 bg-[var(--accent)] text-white rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                                aria-label="이름 저장"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => { setCurrentUser(u.id); setIsProfileOpen(false); }}
                                className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                                  u.id === currentUserId
                                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                                    : 'hover:bg-[var(--surface-2)] text-[var(--text-secondary)]'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                                  u.id === currentUserId
                                    ? 'bg-gradient-to-br from-[var(--accent)] to-cyan-400 text-white shadow-sm'
                                    : 'bg-slate-200 text-[var(--text-muted)]'
                                }`} aria-hidden="true">
                                  {u.name.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="text-[13px] font-bold">{u.name}</span>
                              </button>
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {u.id === currentUserId && (
                                  <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                                    aria-label={`${u.name} 이름 수정`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (users.length <= 1) { showToast('최소 1명의 사용자가 필요합니다.', 'error'); return; }
                                    if (confirm(`'${u.name}' 사용자와 모든 데이터를 삭제하시겠습니까?`)) {
                                      deleteUser(u.id);
                                      showToast('사용자가 삭제되었습니다.', 'success');
                                    }
                                  }}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                                  aria-label={`${u.name} 사용자 삭제`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt('새 사용자 이름을 입력하세요:');
                        if (name) addUser(name);
                      }}
                      className="w-full flex items-center gap-2 mt-2.5 px-3 py-2 text-[12px] font-bold text-[var(--accent)] hover:bg-[var(--accent-muted)] rounded-xl transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" aria-hidden="true" />
                      새 사용자 추가
                    </button>
                  </div>

                  {/* Backup */}
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)] space-y-0.5">
                    <p className="px-2 text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.18em] mb-2">데이터 백업</p>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                      내 데이터 백업하기
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
                      백업 파일 불러오기
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept="*/*" className="hidden" aria-hidden="true" />
                    <Link
                      href="/guide"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                    >
                      <HelpCircle className="w-4 h-4 text-violet-500" aria-hidden="true" />
                      사용 가이드
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                    >
                      <Settings className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                      백업 상세 설정
                    </Link>
                  </div>

                  {/* Danger zone */}
                  <div className="px-3 pt-2">
                    <button
                      onClick={() => {
                        if (confirm('현재 사용자의 모든 데이터를 영구적으로 삭제하시겠습니까?')) {
                          clearCurrentUserData();
                          setIsProfileOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-[13px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      현재 기록 전체 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar — solid fixed bar */}
      <nav
        aria-label="모바일 하단 메뉴"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-white border-t border-[var(--border)] shadow-[0_-1px_4px_0_rgb(0_0_0/0.04)] will-change-transform"
        style={{ transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
          <div className="flex items-center justify-around h-full px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-90 rounded-xl ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                    isActive ? 'bg-[var(--accent-muted)]' : ''
                  }`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--accent)] rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-bold">{item.name}</span>
                </Link>
              );
            })}
          </div>
      </nav>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
