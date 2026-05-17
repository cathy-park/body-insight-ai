"use client";

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Trash2,
  StickyNote,
  FileText,
  Copy,
  Download,
  Edit3,
  Check,
  PlusCircle,
  X,
  ShieldCheck,
  Stethoscope,
  LayoutDashboard,
  Layers,
  MoreVertical,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { buildHealthContext } from '@/lib/health-context';

type DocCategory = '건강검진' | '보험' | '기타';
type TabType = '전체' | DocCategory;

function getCategoryStyle(category: string) {
  if (category === '보험') return { bg: 'bg-violet-50', color: 'text-violet-500', Icon: ShieldCheck };
  if (category === '기타') return { bg: 'bg-amber-50', color: 'text-amber-500', Icon: FileText };
  return { bg: 'bg-[var(--accent-muted)]', color: 'text-[var(--accent)]', Icon: Stethoscope };
}

function getBadgeStyle(category: string) {
  if (category === '보험') return 'bg-violet-50 text-violet-600';
  if (category === '기타') return 'bg-amber-50 text-amber-600';
  return 'bg-[var(--accent-muted)] text-[var(--accent)]';
}

const TABS: TabType[] = ['전체', '건강검진', '보험', '기타'];
const CAT_COPY_BUTTONS: Array<{ key: DocCategory | '전체'; label: string }> = [
  { key: '건강검진', label: '건강검진 복사' },
  { key: '보험',    label: '보험 복사'    },
  { key: '기타',    label: '기타 복사'    },
  { key: '전체',    label: '전체 복사'    },
];

export default function WarehousePage() {
  const { getNote, updateNote, getDocs, addDoc, updateDoc, deleteDoc, getRecords } = useHealthStore();
  const docs    = getDocs();
  const records = getRecords();

  const [activeTab,     setActiveTab]     = useState<TabType>('전체');
  const [copyStatus,    setCopyStatus]    = useState<string | null>(null);
  const [toastMsg,      setToastMsg]      = useState<string | null>(null);
  const [editingDoc,    setEditingDoc]    = useState<any | null>(null);
  const [isAddingManual,setIsAddingManual]= useState(false);
  const [form,          setForm]          = useState({ name: '', content: '', category: '건강검진' as DocCategory });
  const [openMenuId,    setOpenMenuId]    = useState<string | null>(null);
  const [viewingDoc,    setViewingDoc]    = useState<any | null>(null);
  const [viewerCopied,  setViewerCopied]  = useState(false);

  const filteredDocs = useMemo(() => {
    if (activeTab === '전체') return docs;
    return docs.filter(d => d.category === activeTab);
  }, [docs, activeTab]);

  const showCopyFeedback = (key: string) => {
    setCopyStatus(key);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyInBody = () => {
    if (records.length === 0) { showToast('인바디 기록이 없습니다.'); return; }
    let fullText = "[나의 건강 기록 상세 데이터]\n\n";
    records.forEach(r => {
      fullText += `### 📅 기록 날짜: ${r.date}\n`;
      fullText += `- **체성분**: 체중 ${r.weight}kg, 골격근량 ${r.skeletal_muscle}kg, 체지방률 ${r.body_fat}%, 체지방량 ${r.body_fat_mass}kg, 내장지방 ${r.visceral_fat_level}LV, 복부지방비율 ${r.abdominal_fat_ratio}\n`;
      fullText += `- **신체치수**: 복부둘레 ${r.waist_circumference_belly}cm, 미용허리 ${r.waist_circumference_beauty}cm\n`;
      fullText += `- **생활패턴**: 수면 ${r.sleep_hours}시간, 배변상태 ${r.bowel_condition === 'good' ? '성공' : '보통'}, 생리 ${r.period_flag ? 'Y' : 'N'}, 음주 ${r.alcohol_flag ? 'Y' : 'N'}\n`;
      if (r.mounjaro_flag) fullText += `- **치료**: 마운자로 투여 (${r.mounjaro_dose}mg)\n`;
      if (r.memo)          fullText += `- **메모**: ${r.memo}\n`;
      fullText += "\n---\n\n";
    });
    navigator.clipboard.writeText(fullText.trim());
    showCopyFeedback('inbody');
    showToast('인바디 기록이 복사됐어요.');
  };

  const handleCopyAll = () => {
    const context = buildHealthContext(records, docs, getNote());
    navigator.clipboard.writeText(`나의 통합 건강 데이터 분석 요청:\n\n${context}`);
    showCopyFeedback('all');
    showToast('통합 데이터가 복사됐어요.');
  };

  const handleCopyByCategory = (category: DocCategory | '전체') => {
    const targetDocs = category === '전체' ? docs : docs.filter(d => d.category === category);
    if (targetDocs.length === 0) {
      showToast(`${category === '전체' ? '등록된' : category} 자료가 없습니다.`);
      return;
    }
    const label = category === '전체' ? '전체 서류' : category;
    const text  = targetDocs.map(d => `[자료명: ${d.name}]\n${d.content || '(내용 없음)'}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(`[${label} 자료]\n\n${text}`);
    showCopyFeedback(`cat-${category}`);
    showToast(`${category === '전체' ? '전체 서류' : category} 자료가 복사됐어요.`);
  };

  const handleCopySingle = (doc: any) => {
    const text = `[자료명: ${doc.name}]\n[카테고리: ${doc.category}]\n[날짜: ${doc.date}]\n\n${doc.content || '(내용 없음)'}`;
    navigator.clipboard.writeText(text);
    showCopyFeedback(doc.id);
    showToast('문서 내용이 복사됐어요.');
  };

  const handleCopyViewerDoc = (doc: any) => {
    const text = `[자료명: ${doc.name}]\n[카테고리: ${doc.category}]\n[날짜: ${doc.date}]\n\n${doc.content || '(내용 없음)'}`;
    navigator.clipboard.writeText(text);
    setViewerCopied(true);
    showToast('문서 내용이 복사됐어요.');
    setTimeout(() => setViewerCopied(false), 2000);
  };

  const handleDownload = (doc: any) => {
    const blob = new Blob([doc.content || '내용 없음'], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${doc.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (doc: any) => {
    setEditingDoc(doc);
    setForm({ name: doc.name, content: doc.content || '', category: doc.category || '건강검진' });
  };

  const saveEdit = () => {
    if (editingDoc) {
      updateDoc(editingDoc.id, { name: form.name, content: form.content, category: form.category });
      if (activeTab !== '전체' && activeTab !== form.category) {
        setActiveTab(form.category);
      }
      setEditingDoc(null);
      showToast('자료가 저장됐어요.');
    }
  };

  const handleAddManual = () => {
    addDoc({
      id:       Math.random().toString(36).substr(2, 9),
      name:     form.name || '새로운 자료',
      content:  form.content,
      category: form.category,
      date:     new Date().toISOString().split('T')[0],
      size:     '수동 입력',
    });
    if (activeTab !== '전체' && activeTab !== form.category) {
      setActiveTab(form.category);
    }
    setIsAddingManual(false);
    setForm({ name: '', content: '', category: '건강검진' });
    showToast('자료가 등록됐어요.');
  };

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] bg-[var(--text-primary)] text-white text-[13px] font-bold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none animate-fade-up">
          {toastMsg}
        </div>
      )}

      <div className="max-w-5xl mx-auto pt-[100px] px-5 sm:px-10 pb-20 md:pb-10 space-y-6 animate-fade-up">

      <header className="mb-4 sm:mb-10">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-0.5 sm:mb-1">자료 관리</p>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">건강 자료실</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 sm:mt-1.5">건강검진 기록 및 보험 서류를 통합 관리하세요.</p>
      </header>

      {/* Copy Center */}
      <section className="!mt-0 bg-white p-5 sm:p-6 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">데이터 복사 센터</h2>
          <span className="text-[11px] text-[var(--text-muted)]">— AI에 붙여넣기용</span>
        </div>

        {/* 인바디 + 통합 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'inbody', label: '인바디 복사', Icon: LayoutDashboard, onClick: handleCopyInBody, accent: false },
            { key: 'all',    label: '통합 복사',   Icon: Layers,          onClick: handleCopyAll,    accent: true  },
          ].map(({ key, label, Icon, onClick, accent }) => {
            const done = copyStatus === key;
            return (
              <button
                key={key}
                onClick={onClick}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                  done
                    ? 'bg-[var(--cta)] text-white border-[var(--cta)]'
                    : accent
                    ? 'bg-[var(--accent-muted)] border-[var(--accent-soft)] text-[var(--accent)] hover:border-[var(--accent)]'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-soft)]'
                }`}
              >
                {done ? <Check className="w-5 h-5" aria-hidden="true" /> : <Icon className="w-5 h-5" aria-hidden="true" />}
                <span className="text-[11px] font-black">{done ? '복사 완료!' : label}</span>
              </button>
            );
          })}
        </div>

        {/* 서류 카테고리별 복사 */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)] mb-2">서류 카테고리별 복사</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAT_COPY_BUTTONS.map(({ key, label }) => {
              const done = copyStatus === `cat-${key}`;
              return (
                <button
                  key={key}
                  onClick={() => handleCopyByCategory(key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 text-[11px] font-bold ${
                    done
                      ? 'bg-[var(--cta)] text-white border-[var(--cta)]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]'
                  }`}
                >
                  {done
                    ? <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    : <Copy  className="w-3.5 h-3.5" aria-hidden="true" />}
                  {done ? '복사됨!' : label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Tabs + Add button */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[var(--text-primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setIsAddingManual(true);
            setForm({ name: '', content: '', category: (activeTab === '전체' ? '건강검진' : activeTab) as DocCategory });
          }}
          className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--accent)] hover:bg-[var(--accent-muted)] px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">직접 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Memo */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-white p-5 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3 h-full">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">참고 메모</h3>
            </div>
            <textarea
              value={getNote()}
              onChange={(e) => updateNote(e.target.value)}
              placeholder="특이사항, 목표, 복용 약물 등을 적어두세요."
              aria-label="참고 메모"
              className="w-full h-[140px] lg:h-[220px] p-0 bg-transparent border-none focus:ring-0 outline-none text-[13px] leading-relaxed text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] resize-none"
            />
          </div>
        </div>

        {/* Right: Doc List */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-[var(--border)] mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-[var(--text-muted)]">등록된 자료가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => {
                const { bg, color, Icon } = getCategoryStyle(doc.category);
                return (
                  <div
                    key={doc.id}
                    onClick={() => setViewingDoc(doc)}
                    className="bg-white px-4 sm:px-5 py-3.5 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] hover:border-[var(--accent-soft)] transition-all group relative cursor-pointer"
                  >
                    {copyStatus === doc.id && (
                      <div className="absolute inset-0 bg-[var(--cta)] flex items-center justify-center text-white z-10 rounded-2xl">
                        <span className="font-black text-sm">복사 완료!</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-black text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{doc.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">{doc.date}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">·</span>
                            <span className="text-[10px] font-black text-[var(--cta)]">{doc.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative shrink-0 flex items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="더보기 메뉴"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === doc.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20 cursor-default"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] shadow-[var(--shadow-elevated)] rounded-2xl p-1.5 min-w-[130px] z-30 flex flex-col">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(doc); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] rounded-xl transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />수정
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(doc); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] rounded-xl transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />다운로드
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopySingle(doc); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--cta-muted)] hover:text-[var(--cta)] rounded-xl transition-all cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />복사
                              </button>
                              <hr className="my-1 border-[var(--border-subtle)]" />
                              <button
                                onClick={(e) => { e.stopPropagation(); if (confirm('삭제하시겠습니까?')) deleteDoc(doc.id); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[12px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Viewer Modal */}
      {viewingDoc && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewingDoc(null); }}
        >
          <div className="bg-[var(--surface-0)] w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] border-x-0 border-t-0 sm:border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getBadgeStyle(viewingDoc.category)}`}>{viewingDoc.category}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{viewingDoc.date}</span>
                </div>
                <h3 className="text-[17px] font-black text-[var(--text-primary)] leading-snug">{viewingDoc.name}</h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {viewingDoc.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-[15px] font-bold text-[var(--accent)] mt-5 mb-2 first:mt-0 pb-1.5 border-b border-[var(--accent-soft)]">{children}</h1>,
                    h2: ({children}) => <h2 className="text-sm font-bold text-[var(--accent)] mt-4 mb-1.5 first:mt-0 opacity-90">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-semibold text-[var(--accent)] mt-3 mb-1 first:mt-0 opacity-75">{children}</h3>,
                    p:  ({children}) => <p className="text-sm text-[var(--text-secondary)] leading-[1.75] mb-3 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
                    b:      ({children}) => <b className="font-semibold text-[var(--text-primary)]">{children}</b>,
                    em:     ({children}) => <em className="italic">{children}</em>,
                    del:    ({children}) => <del className="line-through text-[var(--text-muted)]">{children}</del>,
                    ul:     ({children}) => <ul className="list-disc pl-5 space-y-1.5 mb-3 text-sm text-[var(--text-secondary)]">{children}</ul>,
                    ol:     ({children}) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-sm text-[var(--text-secondary)]">{children}</ol>,
                    li:     ({children}) => <li className="leading-relaxed">{children}</li>,
                    hr:     () => <hr className="border-[var(--border-subtle)] my-5" />,
                    blockquote: ({children}) => <blockquote className="border-l-2 border-[var(--accent-soft)] pl-3 text-[var(--text-muted)] italic my-3">{children}</blockquote>,
                    code:   ({children}) => <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--text-primary)]">{children}</code>,
                    a:      ({children, href}) => <a href={href} className="text-[var(--accent)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >
                  {(viewingDoc.content as string).replace(/\r\n/g, '\n').replace(/\r/g, '\n')}
                </ReactMarkdown>
              ) : (
                <p className="text-[var(--text-muted)] text-sm text-center py-8">내용이 없습니다.</p>
              )}
            </div>

            {/* Footer: 복사 + 수정하기 */}
            <div className="px-6 pb-6 pt-4 border-t border-[var(--border)] shrink-0 flex gap-3">
              <button
                onClick={() => handleCopyViewerDoc(viewingDoc)}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  viewerCopied
                    ? 'bg-[var(--cta)] text-white border-[var(--cta)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent-soft)] hover:text-[var(--accent)]'
                }`}
              >
                {viewerCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {viewerCopied ? '복사됨!' : '복사'}
              </button>
              <button
                onClick={() => { openEdit(viewingDoc); setViewingDoc(null); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-md shadow-cyan-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" />
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry / Edit Modal */}
      {(isAddingManual || editingDoc) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setIsAddingManual(false); setEditingDoc(null); } }}
        >
          <div className="bg-[var(--surface-0)] w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] border-x-0 border-t-0 sm:border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0 bg-white sm:rounded-t-[28px]">
              <h3 className="text-[17px] font-black text-[var(--text-primary)]">{isAddingManual ? '새 자료 등록' : '자료 수정'}</h3>
              <button
                onClick={() => { setIsAddingManual(false); setEditingDoc(null); }}
                className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['건강검진', '보험', '기타'] as DocCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-4 py-2 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                      form.category === cat
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="제목 (파일명)"
                className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="내용을 입력하세요."
                className="w-full flex-1 min-h-[240px] sm:h-64 px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-[var(--border)] shrink-0">
              <button
                onClick={editingDoc ? saveEdit : handleAddManual}
                className="w-full py-3.5 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-md shadow-cyan-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                {editingDoc ? '저장 완료' : '등록 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
