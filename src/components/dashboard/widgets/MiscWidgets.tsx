import React, { useState, useEffect } from 'react';
import { MiscDataSource } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

export function MiscWidgets({ ds }: { ds: MiscDataSource }) {
  const { t, langCode } = useTranslation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (ds.type === 'curr_time') {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [ds.type]);

  if (ds.type === 'curr_time') {
    const format = ds.format || 'HH:mm:ss';
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format.includes('A'),
      second: format.includes(':ss') ? '2-digit' : undefined,
    };
    
    const timeString = time.toLocaleTimeString(langCode === 'vi' ? 'vi-VN' : 'en-US', timeOptions);
    const dateString = time.toLocaleDateString(langCode === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-black text-ip-text tracking-widest font-mono">
          {timeString}
        </div>
        <div className="text-sm text-ip-text-muted mt-1">
          {dateString}
        </div>
      </div>
    );
  }

  if (ds.type === 'curr_weather') {
    const weathers = [
      { temp: '28°C', condition: t('sunny'), icon: '☀️', color: 'text-yellow-500' },
      { temp: '24°C', condition: t('cloudy'), icon: '☁️', color: 'text-gray-400' },
      { temp: '22°C', condition: t('rainy'), icon: '🌧️', color: 'text-blue-400' }
    ];
    // Random but stable per mount
    const [w] = useState(() => weathers[Math.floor(Math.random() * weathers.length)]);

    return (
      <div className="flex items-center justify-center gap-4">
        <div className={`text-5xl ${w.color}`}>{w.icon}</div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-ip-text">{w.temp}</span>
          <span className="text-sm text-ip-text-secondary">{w.condition}</span>
        </div>
      </div>
    );
  }

  return <div className="text-center text-xs text-ip-text-muted">{t('unknown_widget')}</div>;
}
