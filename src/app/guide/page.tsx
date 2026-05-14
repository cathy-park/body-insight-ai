"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Archive, 
  Database, 
  HelpCircle,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'csv' | 'ai' | 'backup'>('all');

  const guides = [
    {
      id: 'csv',
      category: 'csv',
      title: 'CSV 건강 데이터 연동 방법',
      icon: <Upload className="w-6 h-6 text-blue-500" />,
      desc: '과거 인바디 측정 이력이나 외부 헬스 데이터를 CSV 형식으로 대시보드에 일괄 연동합니다.',
      steps: [
        '대시보드 상단 우측의 [데이터 연동하기] 버튼을 누릅니다.',
        '가지고 계신 건강 데이터 CSV 파일을 다중 또는 단일 선택하여 업로드합니다.',
        '한글 컬럼(체중, 골격근량 등)을 분석기가 자동 변환하므로 인코딩 걱정 없이 적용됩니다.',
        '성공 알림과 함께 자동으로 최신 인바디 수치와 멀티 트래킹 차트가 완성됩니다.'
      ],
      tip: '날짜 컬럼(예: 날짜, 일자, date)과 체중 컬럼(예: 체중, 몸무게, weight)은 필수로 매칭되어야 정상 등록됩니다.'
    },
    {
      id: 'ai',
      category: 'ai',
      title: '외부 AI(Gemini, ChatGPT) 종합 분석 활용법',
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      desc: '건강 자료실에서 변환된 전문 데이터를 원클릭 복사하여 외부 초거대 AI(Gemini 또는 ChatGPT)를 통해 무료로 정밀 분석받으실 수 있습니다.',
      steps: [
        '[건강 자료실] 페이지로 이동합니다.',
        '등록된 인바디 요약 데이터 우측 상단의 [분석용 텍스트 복사] 버튼을 누릅니다.',
        '구글 제미나이(Gemini) 또는 챗GPT(ChatGPT) 서비스에 접속합니다.',
        '복사한 텍스트를 입력창에 붙여넣고 "내 건강 인바디 추이를 체계적으로 분석해주고, 맞춤 운동 및 식단 조언을 해줘"라고 전송하면 즉시 심층 피드백을 받아볼 수 있습니다.'
      ],
      tip: '복사된 데이터에는 날짜별 인바디 지표뿐만 아니라 변화 추이까지 텍스트로 가공되어 있어, 외부 AI가 완벽하게 인지하고 초정밀 답변을 생성해 줍니다.'
    },
    {
      id: 'backup',
      category: 'backup',
      title: '데이터 백업 및 모바일 동기화',
      icon: <Database className="w-6 h-6 text-emerald-500" />,
      desc: '기기 분실이나 기기 간 이동 시 소중한 인바디 데이터를 안전하게 이관하는 방법입니다.',
      steps: [
        '우측 상단 프로필 이미지 메뉴를 누르면 [사용자 관리] 및 [데이터 백업] 패널이 나타납니다.',
        '[내 데이터 백업하기]를 누르면 즉시 전체 데이터가 포함된 `.json` 백업 파일이 생성되어 다운로드됩니다.',
        '스마트폰 등 다른 모바일 기기로 접속하여 동일한 메뉴 내 [백업 파일 불러오기]를 누릅니다.',
        'PC에서 백업한 파일을 선택해주면 별도의 클라우드 서버 회원가입 없이 전체 데이터가 모바일에 즉시 동기화됩니다.'
      ],
      tip: 'LocalStorage 기반으로 작동하므로, 기기가 변경되거나 브라우저 캐시를 삭제하기 전에 주기적으로 백업 파일을 보관해두시는 것을 강력 권장합니다.'
    }
  ];

  const filteredGuides = activeTab === 'all' ? guides : guides.filter(g => g.category === activeTab);

  return (
    <div className="max-w-6xl mx-auto pt-[84px] px-5 sm:px-10 pb-28 md:pb-10 space-y-10 animate-fade-up">
      
      {/* Header section */}
      <header className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/10 overflow-hidden shadow-sm">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            <BookOpen className="w-3.5 h-3.5" />
            사용설명서 가이드
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Body Insight AI <span className="text-[var(--accent)]">마스터하기</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            나의 체성분 지표들을 체계적으로 축적하고, 외부 초거대 AI(Gemini, ChatGPT)를 똑똑하게 활용하여 깊이 있는 건강 피드백을 받는 방법을 안내하는 가이드입니다.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-[var(--surface-1)] p-1.5 rounded-2xl border border-[var(--border)] overflow-x-auto scrollbar-hide shrink-0 gap-1" role="tablist">
        {[
          { key: 'all', label: '전체 사용법' },
          { key: 'csv', label: 'CSV 연동' },
          { key: 'ai', label: 'AI 스마트 기능' },
          { key: 'backup', label: '데이터 백업' }
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-[var(--text-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guides Listing */}
      <section className="grid grid-cols-1 gap-8" aria-label="기능 가이드 상세">
        {filteredGuides.map((g) => (
          <div 
            key={g.id}
            className="bg-[var(--surface-1)] p-6 sm:p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6 transition-all hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-[var(--border-subtle)] shrink-0 shadow-sm">
                {g.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{g.title}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">{g.desc}</p>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-6">
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-4">단계별 가이드</h3>
              <ol className="space-y-3.5">
                {g.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px] text-[var(--text-secondary)] font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {g.tip && (
              <div className="bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed flex gap-2">
                <span className="font-bold text-[var(--accent)] shrink-0">💡 중요 팁:</span>
                <span>{g.tip}</span>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Helpful links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/dashboard"
          className="flex items-center justify-between p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-card)] hover:border-blue-500/30 transition-all group active:scale-[0.98]"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">나의 대시보드 바로가기</h3>
            <p className="text-xs text-[var(--text-muted)]">실시간 변화 추이와 인바디 측정 결과를 확인하세요.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/calendar"
          className="flex items-center justify-between p-6 rounded-3xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-card)] hover:border-purple-500/30 transition-all group active:scale-[0.98]"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">건강 캘린더 이동</h3>
            <p className="text-xs text-[var(--text-muted)]">일일 건강 목표를 세우고 꾸준히 실천하세요.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

    </div>
  );
}
