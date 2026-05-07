import React, { useMemo } from 'react';
import { FeeDataSource } from '@/types/database';
import { PARK_DB } from '@/data/mock-parks';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function FeeWidgets({ ds }: { ds: FeeDataSource }) {
  // Resolve park from datasource
  const park = ds.park !== 'ALL' ? PARK_DB.find(p => p.id.toString() === ds.park && p.is_enable) : null;
  const enabledParks = PARK_DB.filter(p => p.is_enable);

  // Stable mock income data
  const incomeData = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      name: `${ds.interval === 'hour' ? 'H' : ds.interval === 'week' ? 'Wk' : ds.interval === 'month' ? 'Mo' : 'D'}${i + 1}`,
      income: Math.floor(Math.random() * 5000000) + 1000000,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ds.interval, ds.park]
  );

  if (ds.type === 'curr_fee') {
    // Fee from PARK_DB (money type, stored as integer in VND)
    const fee = park?.fee ?? (enabledParks[0]?.fee ?? 0);
    const parkName = park?.display_name ?? 'All Parks';
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-ip-accent">
          {fee.toLocaleString()} <span className="text-lg text-ip-text-secondary">{ds.unit}</span>
        </div>
        <div className="text-xs text-ip-text-muted mt-1 uppercase tracking-wider">
          Entry Fee · {parkName}
        </div>
      </div>
    );
  }

  if (ds.type === 'estimate_income') {
    // Estimate: fee × average daily entries (mocked as max_slot * 0.4 per day per park)
    const totalFee = ds.park === 'ALL'
      ? enabledParks.reduce((sum, p) => sum + p.fee * Math.floor(p.max_slot * 0.4), 0)
      : (park ? park.fee * Math.floor(park.max_slot * 0.4) : 0);
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-xl text-ip-text-secondary">Est. Income</div>
        <div className="text-4xl font-black text-ip-success mt-2 drop-shadow-sm">
          {totalFee.toLocaleString()} <span className="text-xl text-ip-text-secondary">{ds.unit}</span>
        </div>
        <div className="text-[10px] bg-ip-success/10 text-ip-success px-2 py-1 rounded-full mt-2">
          Per {ds.interval}
        </div>
      </div>
    );
  }

  if (ds.type === 'chart_estimate_income') {
    return (
      <div className="w-full h-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={incomeData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ip-border)" vertical={false} />
            <XAxis dataKey="name" fontSize={10} stroke="var(--ip-text-muted)" />
            <YAxis
              fontSize={10}
              stroke="var(--ip-text-muted)"
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{ background: 'var(--ip-card)', border: '1px solid var(--ip-border)', borderRadius: '8px' }}
              formatter={(value: any) => [`${value.toLocaleString()} ${ds.unit}`, 'Income']}
            />
            <Line type="monotone" dataKey="income" stroke="var(--ip-success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--ip-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">Unknown Fee Widget</div>;
}

