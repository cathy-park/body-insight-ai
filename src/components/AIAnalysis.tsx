"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Brain, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import { ollamaGenerate, checkOllamaStatus, pickBestModel } from '@/lib/ollama';
import { buildHealthContext } from '@/lib/health-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DASHBOARD_SYSTEM_PROMPT = `당신은 사용자의 건강 데이터를 정밀하게 분석하는 **AI 건강 주치의**입니다. 🩺

[필수 규칙]
1. **전문적이면서도 따뜻한 말투**를 사용하세요. (~해요 체를 유지하되 과도한 호들갑은 피하세요.)
2. **이모지**는 문장 끝에 포인트로만 사용하세요. (과도한 사용 금지 🚫)
3. **첨부된 건강검진 자료(PDF)**가 있다면, 인바디 수치보다 **이 자료의 내용을 가장 먼저, 그리고 가장 심도 있게 분석**하여 답변의 서두에 배치하세요.
4. 분석 시 반드시 실제 수치와 날짜를 직접 인용하세요.
5. 마크다운을 사용하여 가독성 있게 구조화하세요.
6. 한국어로 답변하세요.`;

export function AIAnalysis() {
  const { getRecords, getDocs, getNote, currentUserId } = useHealthStore();
  const records = getRecords();
  const docs    = getDocs();
  const note    = getNote();

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [model, setModel] = useState('');

  const context = useMemo(
    () => buildHealthContext(records, docs, note),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records.length, docs.length, note, currentUserId],
  );

  const runAnalysis = useCallback(async (modelToUse: string) => {
    setLoading(true);
    setUnavailable(false);
    setAnalysis('');
    try {
      const prompt = `${DASHBOARD_SYSTEM_PROMPT}

---
[건강 데이터]
${context}
---

위 데이터를 바탕으로 핵심 건강 인사이트 3~4가지를 마크다운 형식으로 작성하세요.`;

      const result = await ollamaGenerate(
        prompt,
        modelToUse,
        (token) => setAnalysis(prev => (prev ?? '') + token),
      );
      if (!result.ok || !result.response) throw new Error('unavailable');
    } catch {
      setAnalysis(null);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  useEffect(() => {
    setAnalysis(null);
    setUnavailable(false);
    if (records.length < 1) return;

    let cancelled = false;
    (async () => {
      const res = await checkOllamaStatus();
      if (cancelled) return;

      if (!res.ok) { setUnavailable(true); return; }

      const best = res.models?.length ? pickBestModel(res.models) : 'gemma2:2b';
      setModel(best);
      await runAnalysis(best);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, records.length]);

  if (records.length < 1) return null;

  /* ── Offline state ── */
  const bgClass = "bg-[var(--surface-dark)] p-6 sm:p-8 relative overflow-hidden";

  if (unavailable) {
    return (
      <div className={bgClass}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 text-slate-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300 mb-1">Ollama 연결 실패</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              로컬에서 Ollama를 실행한 후 다시 시도하세요.
            </p>
            <button
              onClick={() => model && runAnalysis(model)}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={bgClass}>
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 rounded-full bg-violet-500/6 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.18em]">AI 분석</span>
            <span className="text-[11px] text-slate-600">· {records.length}건 데이터</span>
          </div>
          <button
            onClick={() => model && runAnalysis(model)}
            disabled={loading}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-cyan-400/40 hover:text-cyan-400 disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="AI 분석 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-5 tracking-tight">
          {loading && !analysis ? '분석 중...' : '맞춤형 건강 인사이트'}
        </h2>

        {analysis ? (
          <div className="
            prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
            prose-h3:text-[15px] prose-h3:mt-5 prose-h3:mb-1.5
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-[14px]
            prose-strong:text-cyan-200 prose-strong:font-bold
            prose-li:text-slate-300 prose-li:text-[14px]
            prose-ul:space-y-1
            prose-table:text-xs prose-th:text-cyan-300 prose-td:text-slate-300
            prose-a:text-cyan-400
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <div className="flex items-center text-cyan-300 gap-3 mb-4">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span className="text-sm text-slate-400">
                {records.length}건 기록{docs.filter(d => d.content).length > 0 ? ` + 첨부 자료 ${docs.filter(d => d.content).length}건` : ''}을 분석하고 있습니다...
              </span>
            </div>
            <div className="space-y-2 opacity-40">
              <div className="h-3 rounded bg-white/5 w-3/4" />
              <div className="h-3 rounded bg-white/5 w-full" />
              <div className="h-3 rounded bg-white/5 w-2/3" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">기록된 데이터를 분석하여 맞춤형 인사이트를 생성합니다.</p>
        )}
      </div>
    </div>
  );
}
