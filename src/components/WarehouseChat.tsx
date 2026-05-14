"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkOllamaStatus, ollamaGenerate, pickBestModel } from '@/lib/ollama';
import { buildHealthContext } from '@/lib/health-context';

const SYSTEM_PROMPT = `당신은 인바디 기록과 건강검진 자료를 종합하여 상담해주는 전문적인 **AI 건강 주치의**입니다. 🩺

[필수 규칙]
1. **신뢰감 있는 따뜻한 말투**를 사용하세요. 과도한 이모지 사용은 지양하고 문장 끝에 적절히 하나씩만 사용하세요.
2. **첨부된 건강검진 결과(PDF)**가 있을 경우, 이를 **가장 우선순위로 검토**하고 상세히 요약하여 상담에 반영하세요. 자료를 읽지 않은 듯한 원론적인 답변은 절대 금지합니다.
3. 변화 추세를 분석할 때 실제 수치(날짜, kg 등)를 정확히 인용하세요.
4. 데이터가 없는 내용은 추측하지 말고 솔직하게 안내하세요.
5. 한국어로 알기 쉽게 설명하세요.`;

export function WarehouseChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: '안녕하세요! **AI 건강 주치의**입니다. 😊\n\n인바디 기록, 메모, 그리고 첨부해주신 건강검진 자료까지 종합적으로 분석해 드릴게요.\n\n- 궁금한 점을 물어보시면 데이터를 바탕으로 분석해 드립니다.\n- 왼쪽 메모에 **건강 목표나 특이사항**을 남겨주시면 더욱 정확한 조언이 가능합니다.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemma2:2b');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { getRecords, getNote, getDocs } = useHealthStore();
  const records = getRecords();
  const note = getNote();
  const docs = getDocs();

  const context = useMemo(
    () => buildHealthContext(records, docs, note),
    [records, docs, note]
  );

  useEffect(() => { checkConnection(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText]);

  const checkConnection = async () => {
    setStatus('checking');
    const result = await checkOllamaStatus();
    if (result.ok) {
      setStatus('connected');
      if (result.models && result.models.length > 0) {
        setAvailableModels(result.models);
        setSelectedModel(prev => {
          if (result.models!.includes(prev)) return prev;
          return pickBestModel(result.models!);
        });
      }
    } else {
      setStatus('offline');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    setStreamingText('');
    try {
      const prompt = `${SYSTEM_PROMPT}

---
[사용자 건강 데이터]
${context}
---

사용자 질문: ${userMessage}`;

      const result = await ollamaGenerate(
        prompt,
        selectedModel,
        (token) => setStreamingText(prev => (prev ?? '') + token),
      );

      if (!result.ok) {
        if (result.offline) setStatus('offline');
        const errDetail = result.error ? `\n\n오류: \`${result.error.slice(0, 200)}\`` : '';
        setMessages(prev => [...prev, {
          role: 'ai',
          content: result.offline
            ? `Ollama에 연결할 수 없습니다.\n\n- Ollama 앱이 실행 중인지 확인하세요.\n- 연결 새로고침 버튼을 눌러보세요.${errDetail}`
            : `응답 생성에 실패했습니다.\n\n- 선택된 모델 **${selectedModel}**이 질문을 처리하지 못했습니다.\n- 다른 모델을 선택하거나 질문을 짧게 바꿔보세요.${errDetail}`,
        }]);
        return;
      }
      setMessages(prev => [...prev, { role: 'ai', content: result.response || '' }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '예기치 않은 오류가 발생했습니다. 다시 시도해주세요.',
      }]);
    } finally {
      setStreamingText(null);
      setIsLoading(false);
    }
  };

  return (
    <div
      role="complementary"
      aria-label="AI 건강 상담"
      className="bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col h-[780px] sticky top-[88px]"
    >
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--surface-dark)] text-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center" aria-hidden="true">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold tracking-tight">AI 맞춤 주치의 상담</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'connected' ? 'bg-emerald-400' :
                    status === 'offline' ? 'bg-rose-400' : 'bg-gray-400 animate-pulse'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  {status === 'connected' ? 'connected' : status === 'offline' ? 'offline' : 'connecting...'}
                </span>
                <span className="text-[10px] text-gray-600 ml-1">· 기록 {records.length}건 로드됨</span>
              </div>
            </div>
          </div>
          <button
            onClick={checkConnection}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="연결 상태 새로고침"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${status === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-gray-400">
          <span>AI Model: gemma2:2b</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[var(--surface-0)]"
        aria-live="polite"
        aria-label="대화 내역"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-[var(--shadow-card)] ${
              m.role === 'user'
                ? 'bg-[var(--accent)] text-white rounded-tr-none'
                : 'bg-[var(--surface-1)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border)]'
            }`}>
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[var(--accent)] prose-strong:font-bold prose-ul:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {streamingText !== null && (
          <div className="flex justify-start">
            <div className="max-w-[92%] px-5 py-4 rounded-2xl rounded-tl-none bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-card)] text-sm leading-relaxed">
              {streamingText ? (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[var(--accent)] prose-strong:font-bold prose-ul:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" aria-hidden="true" />
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {records.length}건 데이터 + {docs.filter(d => d.content).length}개 자료 분석 중...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="relative">
          <label htmlFor="warehouse-chat-input" className="sr-only">메시지 입력</label>
          <input
            id="warehouse-chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
            placeholder="인바디 수치, 추세, 건강 관리에 대해 물어보세요..."
            className="w-full pl-5 pr-14 py-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="메시지 보내기"
            className="absolute right-2 top-2 w-10 h-10 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
