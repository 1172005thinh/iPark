'use client';

import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Responsive } from 'react-grid-layout';
// @ts-ignore
import { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Dashboard, WidgetConfig } from '@/types/database';
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useTranslation } from '@/lib/i18n';
import { Trash2 } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

interface DashboardGridProps {
  dashboard: Dashboard;
  isEditing: boolean;
  onLayoutChange?: (layout: any, layouts: any) => void;
}

export function DashboardGrid({ dashboard, isEditing, onLayoutChange }: DashboardGridProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRightEdge, setDragRightEdge] = useState(false);
  const updateDashboard = useDashboardStore(state => state.updateDashboard);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-[400px] flex items-center justify-center">{t('loading_dashboard')}</div>;

  // Convert our WidgetConfig to React-Grid-Layout format
  const generateLayout = () => {
    return dashboard.widgets_list.map((widget) => ({
      i: widget.id,
      x: widget.position_x,
      y: widget.position_y,
      w: widget.width,
      h: widget.height,
      static: !isEditing || widget.is_fixed,
    }));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_layout: any, _oldItem: any, _newItem: any, _placeholder: any, e: MouseEvent) => {
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;
    if (windowWidth - mouseX < 150) {
      setDragRightEdge(true);
    } else {
      setDragRightEdge(false);
    }
  };

  const handleDragStop = (_layout: any, oldItem: any, _newItem: any, _placeholder: any, e: MouseEvent) => {
    setIsDragging(false);
    setDragRightEdge(false);
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;
    if (windowWidth - mouseX < 150) {
      const newWidgets = dashboard.widgets_list.filter(w => w.id !== oldItem.i);
      updateDashboard(dashboard.id, { widgets_list: newWidgets });
    }
  };

  const layout = generateLayout();

  return (
    <div className="w-full relative">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 6, md: 6, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={100}
        isDraggable={isEditing}
        isResizable={isEditing}
        resizeHandles={['s', 'e', 'se']}
        onLayoutChange={onLayoutChange}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        margin={[16, 16]}
      >
        {dashboard.widgets_list.filter(w => w.is_enable).map((widget) => (
          <div 
            key={widget.id} 
            className={`ip-widget relative group overflow-hidden transition-all duration-300 ${
              isEditing && widget.is_fixed ? 'ring-2 ring-ip-primary shadow-[0_0_15px_rgba(37,99,235,0.3)] border-ip-primary' : ''
            }`}
          >
            <WidgetRenderer 
              config={widget} 
              isEditing={isEditing} 
              dashboardId={dashboard.id} 
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Drop to delete zone */}
      {isEditing && isDragging && (
        <div 
          className={`fixed right-0 top-16 bottom-0 w-32 flex flex-col items-center justify-center transition-all duration-300 z-50 ${
            dragRightEdge 
              ? 'bg-ip-error text-white opacity-100 shadow-[0_0_50px_rgba(239,68,68,0.5)]' 
              : 'bg-ip-error/10 text-ip-error/50 opacity-0 pointer-events-none'
          }`}
        >
          <Trash2 size={48} className={dragRightEdge ? 'animate-bounce' : ''} />
          <span className="mt-4 font-bold text-center px-4">{t('drop_to_delete')}</span>
        </div>
      )}
    </div>
  );
}
