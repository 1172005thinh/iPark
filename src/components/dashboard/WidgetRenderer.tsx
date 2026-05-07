import React from 'react';
import { WidgetConfig } from '@/types/database';
import { ParkWidgets } from '@/components/dashboard/widgets/ParkWidgets';
import { FeeWidgets } from '@/components/dashboard/widgets/FeeWidgets';
import { MiscWidgets } from '@/components/dashboard/widgets/MiscWidgets';
import { StaffWidgets } from '@/components/dashboard/widgets/StaffWidgets';
import { WorkingTimeWidgets } from '@/components/dashboard/widgets/WorkingTimeWidgets';
import { EventWidgets } from '@/components/dashboard/widgets/EventWidgets';
import { ActionWidgets } from '@/components/dashboard/widgets/ActionWidgets';

interface WidgetRendererProps {
  config: WidgetConfig;
}

export function WidgetRenderer({ config }: WidgetRendererProps) {
  const ds = config.data_source;

  return (
    <div className="flex flex-col h-full w-full p-4 overflow-hidden">
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-ip-text truncate" title={config.label}>{config.label}</h3>
        <p className="text-[10px] text-ip-text-muted truncate" title={config.description}>{config.description}</p>
      </div>
      <div className="flex-grow flex flex-col justify-center relative">
        {renderWidgetContent(ds)}
      </div>
    </div>
  );
}

function renderWidgetContent(ds: WidgetConfig['data_source']) {
  switch (ds.category) {
    case 'PARK':
      return <ParkWidgets ds={ds} />;
    case 'FEE':
      return <FeeWidgets ds={ds} />;
    case 'MISC':
      return <MiscWidgets ds={ds} />;
    case 'STAFF':
      return <StaffWidgets ds={ds} />;
    case 'WORKING_TIME':
      return <WorkingTimeWidgets ds={ds} />;
    case 'EVENT':
      return <EventWidgets ds={ds} />;
    case 'ACTION':
      return <ActionWidgets ds={ds} />;
    default:
      return (
        <div className="text-xs text-ip-warning text-center">
          Widget type {(ds as any).category} not implemented
        </div>
      );
  }
}
