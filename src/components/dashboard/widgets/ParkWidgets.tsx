import React, { useMemo } from 'react';
import { ParkDataSource } from '@/types/database';
import { PARK_DB } from '@/data/mock-parks';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function ParkWidgets({ ds }: { ds: ParkDataSource }) {
  // Resolve parks from datasource — 'ALL' means aggregate, otherwise specific park
  const parks = ds.park === 'ALL'
    ? PARK_DB.filter(p => p.is_enable)
    : PARK_DB.filter(p => p.id.toString() === ds.park && p.is_enable);

  const totalMaxSlot = parks.reduce((sum, p) => sum + p.max_slot, 0);

  // Stable mock slot usage (seeded per park list so no re-render flicker)
  const mockCurrSlot = useMemo(
    () => Math.floor(totalMaxSlot * (0.3 + Math.random() * 0.5)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalMaxSlot]
  );

  // Stable chart data
  const chartData = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      name: `${ds.interval === 'hour' ? 'H' : ds.interval === 'week' ? 'Wk' : ds.interval === 'month' ? 'Mo' : 'D'}${i + 1}`,
      val: Math.floor(totalMaxSlot * (0.2 + Math.random() * 0.6)),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalMaxSlot, ds.interval]
  );

  if (ds.type === 'curr_slot_max_slot') {
    if (totalMaxSlot === 0) return <div className="text-xs text-ip-text-muted text-center">No park data</div>;
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-ip-primary">
          {mockCurrSlot}
          <span className="text-xl text-ip-text-secondary"> / {totalMaxSlot}</span>
        </div>
        <div className="text-xs text-ip-text-muted mt-1 uppercase tracking-wider">
          {ds.unit}s used {ds.park !== 'ALL' && parks[0] ? `· ${parks[0].display_name}` : '· All Parks'}
        </div>
      </div>
    );
  }

  if (ds.type === 'stats_curr_slot') {
    const lowest = Math.floor(totalMaxSlot * 0.15);
    const avg = Math.floor(totalMaxSlot * 0.45);
    const highest = Math.floor(totalMaxSlot * 0.9);
    return (
      <div className="flex flex-col items-center w-full">
        <p className="text-[10px] text-ip-text-muted uppercase mb-2">Slot Stats · per {ds.interval}</p>
        <div className="flex justify-between items-center w-full px-2">
          <div className="text-center">
            <p className="text-[10px] text-ip-text-muted uppercase">Lowest</p>
            <p className="text-lg font-semibold text-ip-success">{lowest}</p>
          </div>
          <div className="text-center border-x border-ip-border px-4">
            <p className="text-[10px] text-ip-text-muted uppercase">Average</p>
            <p className="text-xl font-bold text-ip-primary">{avg}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-ip-text-muted uppercase">Highest</p>
            <p className="text-lg font-semibold text-ip-error">{highest}</p>
          </div>
        </div>
      </div>
    );
  }

  if (ds.type === 'chart_curr_slot') {
    return (
      <div className="w-full h-full min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={10} stroke="var(--ip-text-muted)" />
            <YAxis fontSize={10} stroke="var(--ip-text-muted)" domain={[0, totalMaxSlot]} />
            <Tooltip
              contentStyle={{ background: 'var(--ip-card)', border: '1px solid var(--ip-border)' }}
              formatter={(value: any) => [`${value} ${ds.unit}`, 'Slots']}
            />
            <Line type="monotone" dataKey="val" stroke="var(--ip-primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">Unknown Park Widget</div>;
}

