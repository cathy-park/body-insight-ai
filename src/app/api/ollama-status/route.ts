import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return NextResponse.json({ ok: false }, { status: 503 });
    const data = await response.json();
    const models = (data.models || []).map((m: { name: string }) => m.name);
    return NextResponse.json({ ok: true, models });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
