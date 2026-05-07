import React, { useMemo } from 'react';
import { WorkingTimeDataSource } from '@/types/database';
import { PARK_DB } from '@/data/mock-parks';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function WorkingTimeWidgets({ ds }: { ds: WorkingTimeDataSource }) {
  // Resolve park from datasource
  const park = ds.park !== 'ALL' ? PARK_DB.find(p => p.id.toString() === ds.park && p.is_enable) : null;

  // Stable chart data
  const chartData = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      name: `Wk ${i + 1}`,
      time: Math.floor(Math.random() * 40) + 80,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ds.park]
  );

  if (ds.type === 'start_end_time') {
    // Read real start/end times from PARK_DB
    const startTime = park?.start_time?.slice(0, 5) ?? '06:00';
    const endTime = park?.end_time?.slice(0, 5) ?? '18:00';
    const parkName = park?.display_name ?? 'All Parks';
    return (
      <div className="flex flex-col w-full">
        <p className="text-[10px] text-ip-text-muted text-center uppercase mb-2">{parkName} · Working Hours</p>
        <div className="flex justify-between items-center w-full px-4 py-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-ip-text-muted uppercase mb-1">Opens</span>
            <span className="text-2xl font-bold text-ip-success">{startTime}</span>
          </div>
          <div className="h-px bg-ip-border flex-grow mx-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ip-text-muted bg-ip-card px-2 text-xs">
              to
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-ip-text-muted uppercase mb-1">Closes</span>
            <span className="text-2xl font-bold text-ip-error">{endTime}</span>
          </div>
        </div>
      </div>
    );
  }

  if (ds.type === 'curr_total_working_time') {
    // Calculate from park start/end times
    let totalHours = 0;
    if (park) {
      const [sh, sm] = (park.start_time ?? '06:00:00').split(':').map(Number);
      const [eh, em] = (park.end_time ?? '18:00:00').split(':').map(Number);
      totalHours = (eh * 60 + em - sh * 60 - sm) / 60;
    } else {
      totalHours = 12; // default
    }
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold text-ip-primary">
          {totalHours} <span className="text-xl text-ip-text-secondary">{ds.unit}</span>
        </div>
        <div className="text-xs text-ip-text-muted mt-1 uppercase tracking-wider">
          {park?.display_name ?? 'Park'} Working Shift
        </div>
      </div>
    );
  }

  if (ds.type === 'stats_curr_total_working_time') {
    return (
      <div className="flex justify-between items-center w-full px-2">
        <div className="text-center">
          <p className="text-[10px] text-ip-text-muted uppercase">Lowest</p>
          <p className="text-lg font-semibold text-ip-text-secondary">90 {ds.unit}</p>
        </div>
        <div className="text-center border-x border-ip-border px-4">
          <p className="text-[10px] text-ip-text-muted uppercase">Average</p>
          <p className="text-xl font-bold text-ip-primary">110 {ds.unit}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-ip-text-muted uppercase">Highest</p>
          <p className="text-lg font-semibold text-ip-text-secondary">125 {ds.unit}</p>
        </div>
      </div>
    );
  }

  if (ds.type === 'chart_curr_total_working_time') {
    return (
      <div className="w-full h-full min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={10} stroke="var(--ip-text-muted)" />
            <YAxis fontSize={10} stroke="var(--ip-text-muted)" />
            <Tooltip
              contentStyle={{ background: 'var(--ip-card)', border: '1px solid var(--ip-border)' }}
              formatter={(value: any) => [`${value} ${ds.unit}`, 'Working Time']}
            />
            <Line type="monotone" dataKey="time" stroke="var(--ip-primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">Unknown Working Time Widget</div>;
}

