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

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

interface DashboardGridProps {
  dashboard: Dashboard;
  isEditing: boolean;
  onLayoutChange?: (layout: any, layouts: any) => void;
}

export function DashboardGrid({ dashboard, isEditing, onLayoutChange }: DashboardGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-[400px] flex items-center justify-center">Loading dashboard...</div>;

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

  const layout = generateLayout();

  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 6, md: 6, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={100}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={onLayoutChange}
        margin={[16, 16]}
      >
        {dashboard.widgets_list.filter(w => w.is_enable).map((widget) => (
          <div key={widget.id} className="ip-widget relative group">
            {isEditing && (
              <div className="absolute top-2 right-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-ip-bg px-2 py-1 rounded text-ip-text-muted cursor-move">Drag</span>
              </div>
            )}
            <WidgetRenderer config={widget} />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
