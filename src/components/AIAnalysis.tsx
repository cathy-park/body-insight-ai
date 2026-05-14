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
  if (unavailable) {
    return (
      <section
        aria-label="AI 분석 — 오프라인"
        className="bg-[var(--surface-dark)] p-8 rounded-3xl shadow-[var(--shadow-elevated)] relative overflow-hidden border border-white/5"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.15em] mb-1">AI Synthesis</p>
            <h2 className="text-xl font-bold text-white mb-2">Ollama 연결 실패</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ollama가 실행 중인지 확인하세요.
            </p>
            <button
              onClick={() => model && runAnalysis(model)}
              className="mt-4 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold rounded-xl transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ── Normal state ── */
  return (
    <section
      aria-label="AI 건강 인사이트"
      className="bg-[var(--surface-dark)] p-8 rounded-3xl shadow-[var(--shadow-elevated)] relative overflow-hidden border border-white/5"
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.15em]">AI Synthesis</span>
            <span className="text-[11px] text-gray-600 ml-1">· {records.length}건 데이터 기반</span>
          </div>
          <button
            onClick={() => model && runAnalysis(model)}
            disabled={loading}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-blue-400/50 hover:text-blue-400 disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="AI 분석 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
          {loading && !analysis ? '데이터 분석 중...' : '맞춤형 건강 인사이트'}
        </h2>

        {analysis ? (
          <div className="
            prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
            prose-h3:text-[16px] prose-h3:mt-4 prose-h3:mb-1
            prose-p:text-white/90 prose-p:leading-relaxed prose-p:text-[14px]
            prose-strong:text-blue-200 prose-strong:font-bold
            prose-li:text-white/90 prose-li:text-[14px]
            prose-table:text-xs prose-th:text-blue-300 prose-td:text-white/90
            prose-a:text-blue-400
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>
        ) : loading ? (
          <div className="flex items-center text-blue-300 gap-3">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">
              {records.length}건 기록
              {docs.filter(d => d.content).length > 0 && ` + 첨부 자료 ${docs.filter(d => d.content).length}건`}
              을 분석하고 있습니다...
            </span>
          </div>
        ) : (
          <p className="text-sm text-blue-100/40">기록된 데이터를 분석하여 맞춤형 인사이트를 생성합니다.</p>
        )}
      </div>
    </section>
  );
}
