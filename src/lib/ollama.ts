// Electron IPC types injected by preload.js
declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      platform: string;
      ollamaStatus:              () => Promise<{ ok: boolean; models?: string[] }>;
      ollamaGenerate:            (data: { prompt: string; model?: string }) => Promise<{ ok: boolean; response?: string; offline?: boolean; error?: string }>;
      extractPdfText:            (buffer: Uint8Array) => Promise<{ ok: boolean; text: string }>;
      onOllamaChunk:             (callback: (token: string) => void) => void;
      removeOllamaChunkListener: () => void;
    };
  }
}

const MODEL_PRIORITY = ['gemma2:2b'];

export function pickBestModel(models: string[]): string {
  return 'gemma2:2b';
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electron?.isElectron;
}

export async function checkOllamaStatus(): Promise<{ ok: boolean; models?: string[] }> {
  if (isElectron()) {
    return window.electron!.ollamaStatus();
  }
  try {
    const res = await fetch('/api/ollama-status', { method: 'POST' });
    return res.json();
  } catch {
    return { ok: false };
  }
}

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  if (isElectron()) {
    // Pass Uint8Array directly — Electron IPC handles Buffers efficiently
    const result = await window.electron!.extractPdfText(new Uint8Array(arrayBuffer));
    return result.ok ? result.text : '';
  }
  return '';
}

/**
 * Generate a response from Ollama.
 * Pass `onToken` to receive streaming tokens one-by-one as they arrive (Electron only).
 * The returned `response` always contains the full completed text.
 */
export async function ollamaGenerate(
  prompt: string,
  model = 'gemma2:2b',
  onToken?: (token: string) => void,
): Promise<{ ok: boolean; response?: string; offline?: boolean; error?: string }> {
  // Always use gemma2:2b
  const targetModel = 'gemma2:2b';

  if (isElectron()) {
    if (onToken) {
      window.electron!.onOllamaChunk(onToken);
    }
    const result = await window.electron!.ollamaGenerate({ prompt, model: targetModel });
    window.electron!.removeOllamaChunkListener();
    return result;
  }
  // Web / dev-server fallback (no streaming)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: targetModel }),
    });
    if (!res.ok) return { ok: false, offline: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, response: data.response };
  } catch {
    return { ok: false, offline: true };
  }
}
