import React, { useMemo } from 'react';
import { StaffDataSource } from '@/types/database';
import { useStaffStore } from '@/stores/staff-store';
import { useTranslation } from '@/lib/i18n';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function StaffWidgets({ ds }: { ds: StaffDataSource }) {
  const { t } = useTranslation();
  const { staffs } = useStaffStore();
  const allStaff = ds.park === 'ALL'
    ? staffs.filter((staff) => staff.is_enable)
    : staffs.filter((staff) => staff.at_park_id.toString() === ds.park && staff.is_enable);

  const currStaff = allStaff.filter(s => s.is_on_shift).length;
  const maxStaff = allStaff.length;

  const totalPayment = allStaff.reduce((sum, s) => sum + s.payment, 0);

  const chartData = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      name: `${ds.interval === 'hour' ? 'H' : ds.interval === 'week' ? 'Wk' : ds.interval === 'month' ? 'Mo' : 'D'}${i + 1}`,
      staff: Math.floor(maxStaff * (0.3 + Math.random() * 0.7)),
    })),
    [maxStaff, ds.interval]
  );

  const payrollData = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      name: `${t('month')} ${i + 1}`,
      payroll: Math.floor(totalPayment * (0.9 + Math.random() * 0.3)),
    })),
    [totalPayment, t]
  );

  if (ds.type === 'curr_staff_max_staff') {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold text-ip-primary">
          {currStaff} <span className="text-xl text-ip-text-secondary">/ {maxStaff}</span>
        </div>
        <div className="text-xs text-ip-text-muted mt-1 uppercase tracking-wider">
          {t('staff_on_shift')} · {ds.park === 'ALL' ? t('all_parks') : `${t('park')} #${ds.park}`}
        </div>
      </div>
    );
  }

  if (ds.type === 'stats_curr_staff') {
    return (
      <div className="flex justify-between items-center w-full px-2">
        <div className="text-center">
          <p className="text-[10px] text-ip-text-muted uppercase">{t('min')}</p>
          <p className="text-lg font-semibold text-ip-text-secondary">{Math.max(0, currStaff - 2)}</p>
        </div>
        <div className="text-center border-x border-ip-border px-4">
          <p className="text-[10px] text-ip-text-muted uppercase">{t('average')}</p>
          <p className="text-xl font-bold text-ip-primary">{currStaff}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-ip-text-muted uppercase">{t('max')}</p>
          <p className="text-lg font-semibold text-ip-text-secondary">{maxStaff}</p>
        </div>
      </div>
    );
  }

  if (ds.type === 'chart_curr_staff') {
    return (
      <div className="w-full h-full min-h-[140px] relative">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" fontSize={10} stroke="var(--ip-text-muted)" />
            <YAxis fontSize={10} stroke="var(--ip-text-muted)" domain={[0, maxStaff]} />
            <Tooltip contentStyle={{ background: 'var(--ip-card)', border: '1px solid var(--ip-border)' }} />
            <Line type="monotone" dataKey="staff" stroke="var(--ip-primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (ds.type === 'estimate_payment') {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-xl text-ip-text-secondary">{t('est_payroll')}</div>
        <div className="text-4xl font-black text-ip-warning mt-2 drop-shadow-sm">
          {totalPayment.toLocaleString()} <span className="text-xl text-ip-text-secondary">VND</span>
        </div>
        <div className="text-[10px] bg-ip-warning/10 text-ip-warning px-2 py-1 rounded-full mt-2">
          {t('per')} {t(ds.interval as any)} · {t('active_staff_count').replace('{count}', String(maxStaff))}
        </div>
      </div>
    );
  }

  if (ds.type === 'chart_estimate_payment') {
    return (
      <div className="w-full h-full min-h-[140px] relative">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <LineChart data={payrollData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ip-border)" vertical={false} />
            <XAxis dataKey="name" fontSize={10} stroke="var(--ip-text-muted)" />
            <YAxis
              fontSize={10}
              stroke="var(--ip-text-muted)"
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{ background: 'var(--ip-card)', border: '1px solid var(--ip-border)', borderRadius: '8px' }}
              formatter={(value: any) => [`${value.toLocaleString()} VND`, t('payroll')]}
            />
            <Line type="monotone" dataKey="payroll" stroke="var(--ip-warning)" strokeWidth={3} dot={{ r: 4, fill: 'var(--ip-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className="text-xs text-ip-text-muted text-center">{t('unknown_widget')}</div>;
}
