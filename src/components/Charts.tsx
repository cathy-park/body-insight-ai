import React from 'react';
import { HealthRecord } from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartsProps {
  filteredRecords: HealthRecord[];
}

export function Charts({ filteredRecords }: ChartsProps) {
  if (filteredRecords.length === 0) {
    return (
      <div className="bg-[var(--surface-2)] h-[400px] rounded-3xl relative overflow-hidden border border-[var(--border)] flex items-center justify-center mb-6">
        <div className="relative z-10 text-center px-6">
          <div className="w-12 h-12 bg-[var(--surface-1)] rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-[var(--shadow-card)]" aria-hidden="true">
            📊
          </div>
          <h3 className="text-[var(--text-primary)] font-semibold text-base mb-2">데이터 없음</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
            CSV 파일을 업로드하여 건강 트렌드를 확인하세요.
          </p>
        </div>
      </div>
    );
  }

  const axisStyle = { fontSize: 10, fill: 'var(--text-muted)' };

  const chartRecords = filteredRecords.map(r => ({
    ...r,
    weight: r.weight || null,
    skeletal_muscle: r.skeletal_muscle || null,
    body_fat: r.body_fat || null,
  }));

  const cardClass = "bg-[var(--surface-1)] p-6 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col";
  const titleClass = "text-sm font-bold text-[var(--text-primary)]";
  const badgeClass = "text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-1 rounded-full";

  return (
    <div className="space-y-6">
      <div className={`${cardClass} h-[320px]`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={titleClass}>체중 히스토리</h3>
          <span className={badgeClass}>최근 {filteredRecords.length}개 데이터</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRecords} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-elevated)',
                  backgroundColor: 'var(--surface-1)',
                }}
              />
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <Bar dataKey="weight" name="체중" fill="url(#colorWeight)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${cardClass} h-[280px]`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={titleClass}>골격근량 변화</h3>
          <span className={badgeClass}>전문 데이터 분석</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRecords} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} hide />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-elevated)',
                  backgroundColor: 'var(--surface-1)',
                }}
              />
              <defs>
                <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="skeletal_muscle"
                name="골격근량"
                stroke="var(--accent)"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: 'var(--accent)' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${cardClass} h-[280px]`}>
        <div className="mb-6">
          <h3 className={titleClass}>체지방률 변화</h3>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRecords} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} hide />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-elevated)',
                  backgroundColor: 'var(--surface-1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="body_fat"
                name="체지방률"
                stroke="var(--accent)"
                strokeWidth={4}
                strokeDasharray="8 8"
                dot={false}
                activeDot={{ r: 6, fill: 'var(--accent)' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
