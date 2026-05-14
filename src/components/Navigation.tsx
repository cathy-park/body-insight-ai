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
  PlusCircle,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';

interface ToastState { message: string; type: 'success' | 'error'; }

export function Navigation() {
  const pathname = usePathname();
  const { users, currentUserId, setCurrentUser, addUser, updateUserName, deleteUser, clearCurrentUserData, exportData, importData } = useHealthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const [newName, setNewName] = useState(currentUser.name);

  useEffect(() => {
    setNewName(currentUser.name);
    setIsEditingName(false);
  }, [currentUserId, currentUser.name]);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const navItems = [
    { name: '대시보드', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: '건강 캘린더', href: '/calendar', icon: <CalendarIcon className="w-4 h-4" /> },
    { name: '건강 자료실', href: '/warehouse', icon: <Archive className="w-4 h-4" /> },
  ];

  const settingsItem = { name: '백업/설정', href: '/settings', icon: <Settings className="w-4 h-4" /> };

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

  return (
    <>
      {/* Desktop Top Navigation */}
      <nav
        aria-label="주 내비게이션"
        className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-[var(--border)] z-50 h-[72px]"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">

          {/* Logo + Desktop Nav links */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:rounded-xl" aria-label="Body Insight AI 홈">
              <div className="w-7 h-7 relative overflow-hidden rounded-xl shadow-sm shadow-blue-100 shrink-0">
                <img
                  src="/icon.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[16px] sm:text-[18px] font-black text-[var(--text-primary)] tracking-tighter leading-none truncate">
                Body <span className="text-[var(--accent)]">Insight</span> AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1" role="list">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="listitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label="사용자 메뉴 열기"
              className="flex items-center gap-2 pl-2 pr-3 sm:pr-4 py-1.5 bg-[var(--surface-2)] hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-[var(--border)]"
            >
              <div
                className="w-7 h-7 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full flex items-center justify-center font-black text-[12px]"
                aria-hidden="true"
              >
                {currentUser.name.substring(0, 1)}
              </div>
              <span className="hidden sm:inline text-[13px] font-bold text-[var(--text-secondary)]">{currentUser.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {/* ... profile dropdown content remains the same ... */}
            {isProfileOpen && (
              <div
                role="dialog"
                aria-label="사용자 관리"
                className="absolute right-0 mt-2 w-72 bg-[var(--surface-1)] rounded-3xl shadow-[var(--shadow-elevated)] border border-[var(--border)] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* User management */}
                <div className="px-5 py-3 border-b border-[var(--border-subtle)] mb-1">
                  <p className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] mb-3">사용자 관리</p>
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
                              className="p-1.5 bg-[var(--accent)] text-white rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors"
                              aria-label="이름 저장"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setCurrentUser(u.id); setIsProfileOpen(false); }}
                              className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${
                                u.id === currentUserId
                                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                                  : 'hover:bg-[var(--surface-2)] text-[var(--text-secondary)]'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                u.id === currentUserId
                                  ? 'bg-[var(--accent)] text-white'
                                  : 'bg-gray-200 text-[var(--text-secondary)]'
                              }`} aria-hidden="true">
                                {u.name.substring(0, 1)}
                              </div>
                              <span className="text-[13px] font-bold">{u.name}</span>
                            </button>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {u.id === currentUserId && (
                                <button
                                  onClick={() => setIsEditingName(true)}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
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
                                className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
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
                    className="w-full flex items-center gap-2 mt-3 px-3 py-2 text-[12px] font-bold text-[var(--accent)] hover:bg-[var(--accent-muted)] rounded-xl transition-colors"
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    새 사용자 추가
                  </button>
                </div>

                {/* Backup */}
                <div className="px-4 py-2 border-b border-[var(--border-subtle)] space-y-0.5">
                  <p className="px-2 text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.15em] mb-2">데이터 백업</p>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                  >
                    <Download className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                    내 데이터 백업하기
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    백업 파일 불러오기
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept="*/*" className="hidden" aria-hidden="true" />
                  <Link
                    href="/guide"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                  >
                    <HelpCircle className="w-4 h-4 text-purple-600" aria-hidden="true" />
                    사용 가이드
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[13px] font-bold"
                  >
                    <Settings className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                    백업 상세 설정
                  </Link>
                </div>

                {/* Danger zone */}
                <div className="px-4 pt-2">
                  <button
                    onClick={() => {
                      if (confirm('현재 사용자의 모든 데이터를 영구적으로 삭제하시겠습니까?')) {
                        clearCurrentUserData();
                        setIsProfileOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-[13px] font-bold"
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

      {/* Mobile Bottom Tab Bar */}
      <nav 
        aria-label="모바일 하단 메뉴"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[var(--border)] z-50 pb-safe"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all active:scale-95 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[var(--accent-muted)]' : ''}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
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
