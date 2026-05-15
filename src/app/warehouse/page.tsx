"use client";

import React, { useState, useRef, useMemo } from 'react';
import {
  Trash2,
  UploadCloud,
  StickyNote,
  FileText,
  Paperclip,
  Copy,
  Download,
  Edit3,
  Check,
  PlusCircle,
  X,
  ShieldCheck,
  Stethoscope,
  LayoutDashboard,
  ClipboardList,
  Layers,
  MoreVertical,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { buildHealthContext } from '@/lib/health-context';

async function extractPdfText(_buf: ArrayBuffer): Promise<string> {
  return '';
}

export default function WarehousePage() {
  const { getNote, updateNote, getDocs, addDoc, updateDoc, deleteDoc, getRecords } = useHealthStore();
  const docs = getDocs();
  const records = getRecords();
  
  const [activeTab, setActiveTab] = useState<'전체' | '건강검진' | '보험'>('전체');
  const [isUploading, setIsUploading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [form, setForm] = useState({ name: '', content: '', category: '건강검진' as '건강검진' | '보험' });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.log', '.tsv'];

  const filteredDocs = useMemo(() => {
    if (activeTab === '전체') return docs;
    return docs.filter(d => d.category === activeTab);
  }, [docs, activeTab]);

  const showCopyFeedback = (key: string) => {
    setCopyStatus(key);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleCopyInBody = () => {
    if (records.length === 0) return;
    const tableHeader = '| 날짜 | 체중 | 골격근 | 체지방 | 내장지방 |\n|---|---|---|---|---|\n';
    const tableRows = records.map(r => `| ${r.date} | ${r.weight}kg | ${r.skeletal_muscle}kg | ${r.body_fat}% | ${r.visceral_fat_level}LV |`).join('\n');
    navigator.clipboard.writeText(`[나의 인바디 기록 전체]\n\n${tableHeader}${tableRows}`);
    showCopyFeedback('inbody');
  };

  const handleCopyDocs = () => {
    if (docs.length === 0) return;
    const allDocsText = docs.map(d => `[자료명: ${d.name}]\n${d.content || '(내용 없음)'}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(`[나의 건강 서류 전체 텍스트]\n\n${allDocsText}`);
    showCopyFeedback('docs');
  };

  const handleCopyAll = () => {
    const context = buildHealthContext(records, docs, getNote());
    const fullPrompt = `나의 통합 건강 데이터 분석 요청:\n\n${context}`;
    navigator.clipboard.writeText(fullPrompt);
    showCopyFeedback('all');
  };

  const handleCopySingle = (doc: any) => {
    if (!doc.content) return;
    navigator.clipboard.writeText(`[자료명: ${doc.name}]\n\n${doc.content}`);
    showCopyFeedback(doc.id);
  };

  const handleDownload = (doc: any) => {
    const blob = new Blob([doc.content || '내용 없음'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
      setEditingDoc(null);
    }
  };

  const handleAddManual = () => {
    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: form.name || '새로운 자료',
      content: form.content,
      category: form.category,
      date: new Date().toISOString().split('T')[0],
      size: '수동 입력',
    };
    addDoc(newDoc);
    setIsAddingManual(false);
    setForm({ name: '', content: '', category: '건강검진' });
  };

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    setIsUploading(true);

    const promises = Array.from(files).map(file => new Promise<void>(resolve => {
      const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
      const meta = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        category: activeTab === '전체' ? '건강검진' : activeTab,
        date: new Date().toISOString().split('T')[0],
        size: (file.size / 1024).toFixed(0) + 'KB',
      };

      if (ext === '.pdf') {
        const reader = new FileReader();
        reader.onload = async e => {
          const buf = e.target?.result as ArrayBuffer;
          const text = buf ? await extractPdfText(buf) : '';
          addDoc({ ...meta, content: text.trim() || null });
          resolve();
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = e => {
          addDoc({ ...meta, content: (e.target?.result as string) || '' });
          resolve();
        };
        reader.readAsText(file);
      }
    }));

    Promise.all(promises).then(() => setIsUploading(false));
  };

  return (
    <div className="max-w-5xl mx-auto pt-[60px] px-5 sm:px-10 pb-20 md:pb-10 space-y-6 animate-fade-up">

      <header className="mb-10">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)] mb-1">자료 관리</p>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">건강 자료실</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">건강검진 기록 및 보험 서류를 통합 관리하세요.</p>
      </header>

      {/* 1. Copy Center */}
      <section className="!mt-0 bg-white p-5 sm:p-6 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">데이터 복사 센터</h2>
          <span className="text-[11px] text-[var(--text-muted)]">— AI에 붙여넣기용</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'inbody', label: '인바디 복사', icon: LayoutDashboard, onClick: handleCopyInBody, accent: false },
            { key: 'docs',   label: '서류 복사',   icon: ClipboardList,   onClick: handleCopyDocs,   accent: false },
            { key: 'all',    label: '통합 복사',   icon: Layers,          onClick: handleCopyAll,    accent: true  },
          ].map(({ key, label, icon: Icon, onClick, accent }) => {
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
      </section>

      {/* 2. Category Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-0.5">
          {['전체', '건강검진', '보험'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
          onClick={() => { setIsAddingManual(true); setForm({ name: '', content: '', category: activeTab === '전체' ? '건강검진' : activeTab as any }); }}
          className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--accent)] hover:bg-[var(--accent-muted)] px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">직접 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Memo */}
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

        {/* Right Column: Doc List */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-[var(--border)] rounded-2xl p-4 flex items-center justify-center gap-3 hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all cursor-pointer bg-white"
            aria-label="파일 업로드"
          >
            <UploadCloud className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="text-[13px] font-bold text-[var(--text-muted)]">
              {isUploading ? '업로드 중...' : '파일 업로드 (PDF / TXT / CSV)'}
            </span>
            <input type="file" ref={fileInputRef} onChange={(e) => handleUpload(e.target.files)} multiple className="hidden" aria-hidden="true" />
          </button>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-[var(--border)] mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-[var(--text-muted)]">등록된 자료가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white px-4 sm:px-5 py-3.5 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] hover:border-[var(--accent-soft)] transition-all group relative"
                >
                  {copyStatus === doc.id && (
                    <div className="absolute inset-0 bg-[var(--cta)] flex items-center justify-center text-white z-10 rounded-2xl">
                      <span className="font-black text-sm">복사 완료!</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        doc.category === '보험'
                          ? 'bg-violet-50 text-violet-500'
                          : 'bg-[var(--accent-muted)] text-[var(--accent)]'
                      }`}>
                        {doc.category === '보험'
                          ? <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          : <Stethoscope className="w-4 h-4" aria-hidden="true" />
                        }
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
                        onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label="더보기 메뉴"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openMenuId === doc.id && (
                        <>
                          {/* Click backdrop to close menu */}
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
                              onClick={(e) => { e.stopPropagation(); if(confirm('삭제하시겠습니까?')) deleteDoc(doc.id); setOpenMenuId(null); }}
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry / Edit Modal */}
      {(isAddingManual || editingDoc) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setIsAddingManual(false); setEditingDoc(null); } }}
        >
          <div className="bg-[var(--surface-0)] w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border border-[var(--border)] shadow-[var(--shadow-elevated)] p-6 space-y-5 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-black text-[var(--text-primary)]">{isAddingManual ? '새 자료 등록' : '자료 수정'}</h3>
              <button
                onClick={() => { setIsAddingManual(false); setEditingDoc(null); }}
                className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {['건강검진', '보험'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat as any })}
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
                className="w-full h-64 px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <button
              onClick={editingDoc ? saveEdit : handleAddManual}
              className="w-full py-4 bg-gradient-to-r from-[var(--accent)] to-cyan-500 hover:opacity-90 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-md shadow-cyan-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              {editingDoc ? '저장 완료' : '등록 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
