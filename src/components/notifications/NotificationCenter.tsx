'use client';

import { useState, useEffect, useRef } from 'react';
import { useEventHistoryStore } from '@/stores/event-history-store';
import { X, Bell, AlertTriangle, AlertCircle, Info as InfoIcon } from 'lucide-react';
import type { EventHistory } from '@/types/database';

interface NotificationItemProps {
  event: EventHistory;
  onDismiss: (id: number) => void;
}

function NotificationItem({ event, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(event.id), 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [event.id, onDismiss]);

  const levelStyles = {
    info: 'border-blue-100 bg-blue-50/90 text-blue-800',
    warning: 'border-amber-100 bg-amber-50/90 text-amber-800',
    error: 'border-red-100 bg-red-50/90 text-red-800',
  };

  const levelIcons = {
    info: <InfoIcon size={18} className="text-blue-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
  };

  return (
    <div
      className={`group relative flex w-80 items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        levelStyles[event.event_type] || levelStyles.info
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}
    >
      <div className="mt-0.5 shrink-0">{levelIcons[event.event_type] || levelIcons.info}</div>
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-bold leading-tight">{event.event_name}</h4>
        <p className="mt-1 line-clamp-2 text-xs opacity-80">{event.description}</p>
        <div className="mt-2 text-[10px] font-medium opacity-50 uppercase tracking-wider">
          {event.received_time.split(' ')[1]} • Park #{event.at_park_id}
        </div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(event.id), 300);
        }}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const events = useEventHistoryStore((state) => state.events);
  const [activeNotifications, setActiveNotifications] = useState<EventHistory[]>([]);
  const lastProcessedId = useRef<number>(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      if (events.length > 0) {
        lastProcessedId.current = Math.max(...events.map((e) => e.id));
      }
      isInitialized.current = true;
      return;
    }

    const newEvents = events.filter((e) => e.id > lastProcessedId.current);
    if (newEvents.length > 0) {
      setActiveNotifications((prev) => {
        const next = [...newEvents, ...prev].slice(0, 5);
        return next;
      });
      lastProcessedId.current = Math.max(...events.map((e) => e.id));
    }
  }, [events]);

  const dismissNotification = (id: number) => {
    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {activeNotifications.map((event) => (
        <div key={event.id} className="pointer-events-auto">
          <NotificationItem event={event} onDismiss={dismissNotification} />
        </div>
      ))}
    </div>
  );
}
