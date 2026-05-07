import React, { useState, useEffect } from 'react';
import { MiscDataSource } from '@/types/database';

export function MiscWidgets({ ds }: { ds: MiscDataSource }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (ds.type === 'curr_time') {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [ds.type]);

  if (ds.type === 'curr_time') {
    const timeString = time.toLocaleTimeString('en-US', { hour12: false });
    const dateString = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
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
      { temp: '28°C', condition: 'Sunny', icon: '☀️', color: 'text-yellow-500' },
      { temp: '24°C', condition: 'Cloudy', icon: '☁️', color: 'text-gray-400' },
      { temp: '22°C', condition: 'Rainy', icon: '🌧️', color: 'text-blue-400' }
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

  return <div>Unknown Misc Widget</div>;
}
