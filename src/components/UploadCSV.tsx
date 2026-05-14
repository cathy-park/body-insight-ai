"use client";

import React, { useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { useHealthStore } from '@/store/useHealthStore';
import { NewHealthRecord } from '@/types';

const ALIAS_MAP = {
  date: ['날짜', '일자', 'date'],
  weight: ['체중', '몸무게', 'weight'],
  skeletal_muscle: ['골격근량', '근육량', 'muscle'],
  body_fat: ['체지방률', 'percent', 'fat'],
  body_fat_mass: ['체지방량', 'mass'],
  visceral_fat_level: ['내장지방', 'visceral'],
  abdominal_fat_ratio: ['복부지방률', 'abdominal'],
  waist_combined: ['허리둘레', '복부둘레', '배꼽둘레', '복부', '허리'],
  sleep: ['수면', '수면시간', 'sleep'],
  alcohol: ['술', '금주', '음주', 'alcohol'],
  bowel: ['배변', '변기', '똥', '쾌변', 'bowel'],
  period: ['생리', '월경', 'period'],
  memo: ['메모', '비고']
};

const findValueByAlias = (row: any, aliases: string[]) => {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const key = keys.find(k => k.replace(/[\s\(\)\/\-\_]/g, '').includes(alias.replace(/[\s\(\)\/\-\_]/g, '')));
    if (key) return row[key];
  }
  return undefined;
};

const extractAllNumbers = (val: any): number[] => {
  if (val === undefined || val === null) return [];
  const str = String(val).replace(/,/g, '');
  const matches = str.match(/(\d+\.?\d*)/g);
  return matches ? matches.map(m => parseFloat(m)) : [];
};

const extractSingleNumber = (val: any) => {
  const nums = extractAllNumbers(val);
  if (nums.length === 0) return 0;
  const num = nums[0];
  if (num > 500) {
    const s = String(num);
    return parseFloat(s.substring(0, 2) + "." + s.substring(2));
  }
  return num;
};

export function UploadCSV() {
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addBulkRecords = useHealthStore((state) => state.addBulkRecords);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    setIsParsing(true);
    const allValidRecords: NewHealthRecord[] = [];

    const parseFile = (file: File, encoding: string): Promise<NewHealthRecord[]> => {
      return new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: encoding,
          complete: (results) => {
            const validRows = results.data.map((row: any) => {
              const rawDate = findValueByAlias(row, ALIAS_MAP.date);
              if (!rawDate) return null;

              const waistVal = findValueByAlias(row, ALIAS_MAP.waist_combined);
              const waistNums = extractAllNumbers(waistVal);
              const belly = waistNums.length >= 1 ? waistNums[0] : 0;
              const beauty = waistNums.length >= 2 ? waistNums[1] : 0;

              const alcoholVal = String(findValueByAlias(row, ALIAS_MAP.alcohol) || '').trim();
              const alcoholFlag = alcoholVal === 'O' || alcoholVal.includes('음주') || alcoholVal.includes('술');

              const bowelVal = String(findValueByAlias(row, ALIAS_MAP.bowel) || '').trim();
              const bowelCondition = (bowelVal === 'O' || bowelVal.includes('쾌변')) ? 'good' : 'bad';

              const periodVal = String(findValueByAlias(row, ALIAS_MAP.period) || '').trim();
              const periodFlag = periodVal === 'O' || periodVal.includes('생리') || periodVal.includes('시작');

              const dateStr = String(rawDate).replace(/[년월일\.\/]/g, '-').replace(/\s+/g, '');
              const dp = dateStr.split('-').filter(Boolean);
              const finalDate = dp.length >= 3 ? `${dp[0]}-${dp[1].padStart(2, '0')}-${dp[2].padStart(2, '0')}` : dateStr;

              return {
                date: finalDate,
                weight: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.weight)),
                skeletal_muscle: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.skeletal_muscle)),
                body_fat: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.body_fat)),
                body_fat_mass: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.body_fat_mass)),
                visceral_fat_level: Math.round(extractSingleNumber(findValueByAlias(row, ALIAS_MAP.visceral_fat_level))),
                abdominal_fat_ratio: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.abdominal_fat_ratio)),
                waist_circumference_belly: belly,
                waist_circumference_beauty: beauty,
                sleep_hours: extractSingleNumber(findValueByAlias(row, ALIAS_MAP.sleep)) || 7,
                alcohol_flag: alcoholFlag,
                bowel_condition: bowelCondition,
                period_flag: periodFlag,
                memo: String(findValueByAlias(row, ALIAS_MAP.memo) || ''),
              } as NewHealthRecord;
            }).filter(Boolean) as NewHealthRecord[];
            resolve(validRows);
          },
        });
      });
    };

    for (const file of Array.from(files)) {
      // 1. 기본 UTF-8 파싱 시도
      let parsed = await parseFile(file, 'UTF-8');

      // 2. 파싱결과가 비어있거나, 한글이 깨져서 체중이 전부 0으로 매칭된 경우 EUC-KR(또는 CP949)로 재시도
      const isBroken = parsed.length === 0 || (parsed.length > 0 && parsed.every(r => r.weight === 0));
      if (isBroken) {
        const fallbackParsed = await parseFile(file, 'EUC-KR');
        if (fallbackParsed.length > 0 && fallbackParsed.some(r => r.weight > 0)) {
          parsed = fallbackParsed;
        }
      }

      // 3. 체중이 0인 레코드(무효 데이터)는 최종 필터링
      const trulyValid = parsed.filter(r => r.weight > 0);
      allValidRecords.push(...trulyValid);
    }

    if (allValidRecords.length > 0) {
      addBulkRecords(allValidRecords);
      alert(`${allValidRecords.length}개의 데이터가 성공적으로 연동되었습니다.`);
    } else {
      alert('가져올 수 있는 유효한 건강 데이터가 없습니다. CSV 파일의 인코딩 및 컬럼명을 확인해 주세요.');
    }
    setIsParsing(false);
  };

  return (
    <div className="flex items-center">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isParsing}
        className="flex items-center gap-2.5 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-[14px] font-bold hover:bg-[var(--accent-hover)] active:scale-95 transition-all shadow-sm disabled:opacity-60"
        aria-label="CSV 파일로 건강 데이터 연동하기"
      >
        {isParsing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
        데이터 연동하기
      </button>
      <input
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        aria-hidden="true"
      />
    </div>
  );
}
