"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bot, X, Send, Loader2, RefreshCw, ChevronDown, MessageCircle } from 'lucide-react';
import { useHealthStore } from '@/store/useHealthStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkOllamaStatus, ollamaGenerate, pickBestModel } from '@/lib/ollama';
import { buildHealthContext } from '@/lib/health-context';

const SYSTEM_PROMPT = `당신은 인바디·건강 데이터 전문 분석 AI입니다.

[필수 규칙]
1. 반드시 제공된 수치와 날짜를 직접 인용하며 답변하세요.
2. 변화 추세를 분석할 때 전체 기간 변화와 최근 변화를 함께 언급하세요.
3. 첨부 자료 내용이 있으면 반드시 참고하고 "[자료명 참고]"라고 출처를 표기하세요.
4. 메모에 목표·질환·이슈가 있으면 반드시 고려하세요.
5. 데이터에 없는 내용은 추측하지 마세요.
6. 마크다운으로 구조화된 답변을 작성하세요.
7. 한국어로 전문적이지만 이해하기 쉽게 설명하세요.`;

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: '안녕하세요! 건강 데이터에 대해 궁금한 점을 물어보세요.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [selectedModel, setSelectedModel] = useState('gemma2:2b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getRecords, getNote, getDocs } = useHealthStore();
  const context = useMemo(
    () => buildHealthContext(getRecords(), getDocs(), getNote()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getRecords().length, getDocs().length, getNote()],
  );

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen]);

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
        setSelectedModel(prev =>
          result.models!.includes(prev) ? prev : pickBestModel(result.models!)
        );
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
      const prompt = `${SYSTEM_PROMPT}\n\n---\n[사용자 건강 데이터]\n${context}\n---\n\n사용자 질문: ${userMessage}`;
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
            ? `Ollama에 연결할 수 없습니다. Ollama 앱이 실행 중인지 확인해주세요.${errDetail}`
            : `응답 생성에 실패했습니다. 다른 모델을 선택하거나 질문을 짧게 바꿔보세요.${errDetail}`,
        }]);
        return;
      }
      setMessages(prev => [...prev, { role: 'ai', content: result.response || '' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '예기치 않은 오류가 발생했습니다.' }]);
    } finally {
      setStreamingText(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI 건강 주치의 채팅"
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[560px] bg-[var(--surface-1)] rounded-3xl shadow-[var(--shadow-elevated)] border border-[var(--border)] flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {/* Header — dark, intentional exception within the chat UI */}
          <div className="bg-[var(--surface-dark)] text-white px-5 py-4 shrink-0">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 bg-[var(--accent)] rounded-xl flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[14px] font-bold tracking-tight">AI 건강 주치의</p>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === 'connected' ? 'bg-emerald-400' :
                        status === 'offline'   ? 'bg-rose-400' : 'bg-gray-400 animate-pulse'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {status === 'connected' ? 'connected' : status === 'offline' ? 'offline' : 'connecting...'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={checkConnection}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="연결 상태 확인"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${status === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="채팅 닫기"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(v => !v)}
                aria-expanded={showModelMenu}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-[11px] font-bold text-gray-300"
              >
                <span>모델: {selectedModel || '선택 안됨'}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showModelMenu ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {showModelMenu && (
                <div
                  role="listbox"
                  aria-label="AI 모델 선택"
                  className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto scrollbar-hide"
                >
                  {availableModels.length === 0 ? (
                    <p className="px-4 py-3 text-[11px] text-gray-400">
                      {status === 'offline' ? 'Ollama 오프라인' : '모델 로딩 중...'}
                    </p>
                  ) : (
                    availableModels.map(m => (
                      <button
                        key={m}
                        role="option"
                        aria-selected={m === selectedModel}
                        onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${
                          m === selectedModel
                            ? 'bg-[var(--accent)] text-white'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {m}
                        {m === pickBestModel(availableModels) && m !== selectedModel && (
                          <span className="ml-2 text-[9px] text-emerald-400">추천</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[var(--surface-0)]"
            aria-live="polite"
            aria-label="대화 내역"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-[var(--shadow-card)] ${
                  m.role === 'user'
                    ? 'bg-[var(--accent)] text-white rounded-tr-none'
                    : 'bg-[var(--surface-1)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border)]'
                }`}>
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[var(--accent)] prose-p:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {streamingText !== null && (
              <div className="flex justify-start">
                <div className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-none bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-card)] text-[13px] leading-relaxed">
                  {streamingText ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[var(--accent)] prose-p:my-1 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" aria-hidden="true" />
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">분석 중...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="p-3 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] shrink-0">
            <div className="relative">
              <label htmlFor="chat-input" className="sr-only">메시지 입력</label>
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                placeholder="건강에 대해 물어보세요..."
                className="w-full pl-4 pr-12 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none text-[13px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                autoComplete="off"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="메시지 보내기"
                className="absolute right-2 top-1.5 w-8 h-8 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'AI 채팅 닫기' : 'AI 건강 주치의 열기'}
        aria-expanded={isOpen}
        className={`fixed bottom-24 md:bottom-6 right-4 sm:right-6 w-14 h-14 rounded-full shadow-[var(--shadow-elevated)] flex items-center justify-center transition-all duration-200 z-50 active:scale-90 cursor-pointer ${
          isOpen
            ? 'bg-[var(--surface-dark)] hover:bg-gray-800'
            : 'bg-gradient-to-br from-[var(--accent)] to-cyan-500 hover:opacity-90 hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" aria-hidden="true" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
            {status === 'connected' && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"
                aria-label="연결됨"
              />
            )}
          </>
        )}
      </button>
    </>
  );
}
