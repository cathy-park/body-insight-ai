import { HealthRecord } from '@/types';

const MAX_TABLE_RECORDS = 20;
const MAX_DOC_CHARS = 4000;

function fmt(n: number | undefined | null, unit = '') {
  if (!n) return '-';
  return `${n}${unit}`;
}

function delta(a: number, b: number, unit = '') {
  const d = b - a;
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}${unit}`;
}

export function buildHealthContext(
  records: HealthRecord[],
  docs: any[],
  note: string,
): string {
  // Filter out invalid records (e.g., zero weight) to avoid 0kg -> XXkg hallucinations
  const validRecords = records.filter(r => r.weight && r.weight > 0);
  
  if (validRecords.length === 0 && docs.length === 0) return '기록된 데이터가 없습니다.';

  const docsWithContent = docs.filter(d => d.content);
  const docSection = docsWithContent.length > 0
    ? '\n## [최우선 분석 대상] 첨부된 건강검진 자료\n' + docsWithContent.map(d =>
        `### 문서명: ${d.name} (등록일: ${d.date})\n- 내용 요약용 텍스트: ${(d.content as string).slice(0, MAX_DOC_CHARS)}`
      ).join('\n\n')
    : '';

  if (validRecords.length === 0) return `${docSection}\n\n## 참고 메모\n${note}`;

  // Trend always computed from full valid record set
  const first  = validRecords[0];
  const latest = validRecords[validRecords.length - 1];
  const prev   = validRecords.length >= 2 ? validRecords[validRecords.length - 2] : null;

  // Table shows only last MAX_TABLE_RECORDS rows
  const display = validRecords.slice(-MAX_TABLE_RECORDS);

  const tableRows = display.map(r =>
    `| ${r.date} | ${fmt(r.weight)} | ${fmt(r.skeletal_muscle)} | ${fmt(r.body_fat,'%')} | ${fmt(r.body_fat_mass)} | ${fmt(r.visceral_fat_level,'LV')} | ${fmt(r.abdominal_fat_ratio)} | ${fmt(r.waist_circumference_belly,'cm')} | ${fmt(r.waist_circumference_beauty,'cm')} |`
  ).join('\n');

  const totalDays = Math.round(
    (new Date(latest.date).getTime() - new Date(first.date).getTime()) / 86_400_000,
  );

  let trend = `\n## 전체 기간 인바디 변화 (${first.date} → ${latest.date}, ${totalDays}일, 총 ${records.length}건)\n`;
  trend += `| 지표 | 시작 | 현재 | 변화 |\n|------|------|------|------|\n`;
  trend += `| 체중 | ${first.weight}kg | ${latest.weight}kg | ${delta(first.weight, latest.weight, 'kg')} |\n`;
  trend += `| 골격근량 | ${first.skeletal_muscle}kg | ${latest.skeletal_muscle}kg | ${delta(first.skeletal_muscle, latest.skeletal_muscle, 'kg')} |\n`;
  trend += `| 체지방률 | ${first.body_fat}% | ${latest.body_fat}% | ${delta(first.body_fat, latest.body_fat, '%')} |\n`;
  trend += `| 체지방량 | ${first.body_fat_mass}kg | ${latest.body_fat_mass}kg | ${delta(first.body_fat_mass, latest.body_fat_mass, 'kg')} |\n`;
  trend += `| 내장지방 | ${first.visceral_fat_level}LV | ${latest.visceral_fat_level}LV | ${delta(first.visceral_fat_level, latest.visceral_fat_level, 'LV')} |\n`;
  if (first.waist_circumference_belly) {
    trend += `| 복부둘레 | ${first.waist_circumference_belly}cm | ${latest.waist_circumference_belly}cm | ${delta(first.waist_circumference_belly, latest.waist_circumference_belly, 'cm')} |\n`;
  }

  if (prev) {
    trend += `\n## 최근 측정 대비 (${prev.date} → ${latest.date})\n`;
    trend += `- 체중: ${prev.weight}kg → ${latest.weight}kg (${delta(prev.weight, latest.weight, 'kg')})\n`;
    trend += `- 골격근량: ${prev.skeletal_muscle}kg → ${latest.skeletal_muscle}kg (${delta(prev.skeletal_muscle, latest.skeletal_muscle, 'kg')})\n`;
    trend += `- 체지방률: ${prev.body_fat}% → ${latest.body_fat}% (${delta(prev.body_fat, latest.body_fat, '%')})\n`;
    trend += `- 내장지방: ${prev.visceral_fat_level}LV → ${latest.visceral_fat_level}LV (${delta(prev.visceral_fat_level, latest.visceral_fat_level, 'LV')})\n`;
  }

  return `${docSection}

## 사용자 인바디 데이터
### 최근 기록 (최근 ${display.length}건 표시)
| 날짜 | 체중(kg) | 골격근(kg) | 체지방률 | 체지방(kg) | 내장지방 | 복부비율 | 복부둘레 | 미용허리 |
|------|---------|-----------|---------|-----------|---------|---------|---------|---------|
${tableRows}
${trend}

## 사용자 메모 / 특이사항
${note || '(없음)'}`;
}
