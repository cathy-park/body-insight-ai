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
  Sparkles,
  Bot,
} from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { extractPdfText } from '@/lib/ollama';
import { buildHealthContext } from '@/lib/health-context';

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
    <div className="max-w-5xl mx-auto pt-[92px] md:pt-[112px] px-5 sm:px-10 pb-24 space-y-8">
      
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">건강 자료실</h1>
        <p className="text-sm text-slate-500 mt-1">건강검진 기록 및 보험 서류를 통합 관리하세요.</p>
      </header>

      {/* 1. Global Copy Center */}
      <section className="bg-white p-5 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-[13px] sm:text-[14px] font-black uppercase tracking-wider text-slate-800">데이터 복사 센터 (GPT 전송용)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={handleCopyInBody}
            className={`flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-2 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] transition-all border ${
              copyStatus === 'inbody' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 border-slate-100 hover:border-blue-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[12px] sm:text-[13px] font-black">{copyStatus === 'inbody' ? '복사 완료!' : '인바디 전체 복사'}</span>
          </button>
          <button
            onClick={handleCopyDocs}
            className={`flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-2 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] transition-all border ${
              copyStatus === 'docs' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 border-slate-100 hover:border-blue-200'
            }`}
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[12px] sm:text-[13px] font-black">{copyStatus === 'docs' ? '복사 완료!' : '서류 전체 복사'}</span>
          </button>
          <button
            onClick={handleCopyAll}
            className={`flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-2 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] transition-all border ${
              copyStatus === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 border-blue-100 hover:border-blue-300'
            }`}
          >
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[12px] sm:text-[13px] font-black">{copyStatus === 'all' ? '통합 복사 완료!' : '통합 분석용 복사'}</span>
          </button>
        </div>
      </section>

      {/* 2. Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {['전체', '건강검진', '보험'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 sm:px-6 py-2 rounded-xl text-[12px] sm:text-[14px] font-black transition-all ${
                activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setIsAddingManual(true); setForm({ name: '', content: '', category: activeTab === '전체' ? '건강검진' : activeTab as any }); }}
          className="flex items-center gap-1 text-[12px] font-bold text-blue-600 px-2 py-2"
        >
          <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">직접 추가</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Memo */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" />
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">참고 메모</h3>
            </div>
            <textarea
              value={getNote()}
              onChange={(e) => updateNote(e.target.value)}
              placeholder="특이사항을 적어두세요."
              className="w-full h-[120px] lg:h-[200px] p-0 bg-transparent border-none focus:ring-0 outline-none text-[13px] sm:text-[14px] leading-relaxed text-slate-700 placeholder:text-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-[24px] p-5 flex items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer bg-white"
          >
            <UploadCloud className="w-5 h-5 text-slate-400" />
            <span className="text-[13px] sm:text-[14px] font-bold text-slate-500">{isUploading ? '업로드 중...' : '파일 업로드 (PDF/TXT)'}</span>
            <input type="file" ref={fileInputRef} onChange={(e) => handleUpload(e.target.files)} multiple className="hidden" />
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <p className="text-slate-300 text-[13px] sm:text-[14px]">등록된 자료가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="bg-white px-4 sm:px-6 py-3.5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group relative overflow-hidden">
                  {copyStatus === doc.id && (
                    <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white z-10">
                      <span className="font-black text-[12px] sm:text-[13px]">복사 완료!</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        doc.category === '보험' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {doc.category === '보험' ? <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[13px] sm:text-[14px] font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-300 uppercase">{doc.date}</span>
                          <span className="text-[10px] font-bold text-slate-300">·</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">{doc.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button onClick={() => openEdit(doc)} className="p-1.5 sm:p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => handleDownload(doc)} className="p-1.5 sm:p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => handleCopySingle(doc)} className="p-1.5 sm:p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      <button onClick={() => deleteDoc(doc.id)} className="p-1.5 sm:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[600px] rounded-[40px] shadow-2xl p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{isAddingManual ? '새 자료 등록' : '자료 수정'}</h3>
              <button onClick={() => { setIsAddingManual(false); setEditingDoc(null); }} className="text-slate-300 hover:text-slate-600"><X className="w-8 h-8"/></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {['건강검진', '보험'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat as any })}
                    className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all ${
                      form.category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
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
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold outline-none focus:bg-white focus:border-blue-300"
              />
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="내용을 입력하세요."
                className="w-full h-[300px] px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] leading-relaxed outline-none focus:bg-white focus:border-blue-300 resize-none"
              />
            </div>
            <button
              onClick={editingDoc ? saveEdit : handleAddManual}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[16px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> {editingDoc ? '저장 완료' : '등록 완료'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
