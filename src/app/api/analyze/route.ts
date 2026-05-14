import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { records, question, mode, context, aiNote } = await req.json();

    if (mode === 'chat') {
      const prompt = `
당신은 스포츠 의학 및 임상 영양학 전문의 'Body Insight AI'입니다.
사용자의 질문에 답할 때 반드시 제공된 [건강 데이터]와 [특이사항 메모]를 근거로 논리적인 답변을 하세요.

[사용자 데이터 요약]
${context}

[사용자 특이사항 메모]
${aiNote || "없음"}

[사용자 질문]
${question}

[답변 가이드라인]
1. 답변은 반드시 구체적인 '근거 수치'를 포함해야 합니다. (예: "체중이 1kg 증가했고 허리둘레가 1cm 늘었기 때문에...")
2. 추측성 발언보다는 데이터에 기반한 팩트 위주로 답하세요.
3. 한국어로 친절하지만 전문적인 톤으로 답변하세요.
4. 사용자 메모에 질병이나 부상 이력이 있다면 그 점을 고려하여 조언하세요.
`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b', // or your preferred model
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Ollama connection failed');
      }

      const data = await response.json();
      return NextResponse.json({ analysis: data.response });
    }

    // Default analysis mode
    const latest = records[records.length - 1];
    const previous = records[records.length - 2];
    
    let deltaText = "";
    if (latest && previous) {
      const wDiff = (latest.weight - previous.weight).toFixed(1);
      const mDiff = (latest.skeletal_muscle - previous.skeletal_muscle).toFixed(1);
      deltaText = `지난 기록 대비 체중은 ${wDiff}kg ${parseFloat(wDiff) > 0 ? '증가' : '감소'}했고, 골격근량은 ${mDiff}kg ${parseFloat(mDiff) > 0 ? '증가' : '감소'}했습니다.`;
    }

    const analysisPrompt = `
사용자의 최근 7종 체성분 데이터를 기반으로 짧고 강렬한 팩트 폭격을 날려주세요.
[근거] ${deltaText} ${latest ? `(현재 체중 ${latest.weight}kg, 체지방 ${latest.body_fat}%)` : ""}
[지침] 
- 2~3문장 이내. 
- 구체적인 수치 근거를 한 번 더 언급할 것.
- 칭찬보다는 개선이 필요한 포인트를 짚어줄 것.
`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma2:2b',
        prompt: analysisPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ 
        analysis: `[데이터 기반 분석] ${deltaText} 근육량 변화가 미미합니다. 단백질 섭취량을 늘리고 고중량 웨이트 트레이닝 빈도를 주 4회 이상으로 높이세요.`
      });
    }

    const data = await response.json();
    return NextResponse.json({ analysis: data.response });

  } catch (error) {
    return NextResponse.json({ analysis: "데이터 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
