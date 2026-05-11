'use client';

import { create } from 'zustand';
import { DASHBOARD_DB } from '@/data/mock-dashboards';
import type { Dashboard, WidgetConfig, WidgetDataSource } from '@/types/database';
import {
  cloneSeed,
  failure,
  getAutoWidgetId,
  nextId,
  normalizeDashboard,
  normalizeWidget,
  now,
  success,
  type StoreMutationResult,
  validateObjectName,
} from '@/lib/ipark-store-helpers';
import { useParkStore } from '@/stores/park-store';
import { useUserStore } from '@/stores/user-store';

type CreateDashboardInput = Omit<Dashboard, 'id' | 'created_at' | 'last_modified_at'>;
type UpdateDashboardInput = Partial<
  Omit<Dashboard, 'id' | 'created_at' | 'last_modified_at'>
>;
type UpdateWidgetInput = Partial<Omit<WidgetConfig, 'id'>>;
type WidgetLayoutUpdate = Partial<
  Pick<WidgetConfig, 'position_x' | 'position_y' | 'width' | 'height'>
>;

interface DashboardStore {
  dashboards: Dashboard[];
  getDashboard: (id: number) => Dashboard | undefined;
  getDashboardByName: (dashboardName: string) => Dashboard | undefined;
  getEnabledDashboards: () => Dashboard[];
  addDashboard: (dashboard: CreateDashboardInput) => StoreMutationResult<Dashboard>;
  updateDashboard: (
    id: number,
    updates: UpdateDashboardInput,
  ) => StoreMutationResult<Dashboard>;
  deleteDashboard: (id: number) => StoreMutationResult<number>;
  setDashboardEnabled: (
    id: number,
    isEnable: boolean,
  ) => StoreMutationResult<Dashboard>;
  addWidget: (
    dashboardId: number,
    widget: WidgetConfig,
  ) => StoreMutationResult<Dashboard>;
  updateWidget: (
    dashboardId: number,
    widgetId: string,
    updates: UpdateWidgetInput,
  ) => StoreMutationResult<Dashboard>;
  updateWidgetLayout: (
    dashboardId: number,
    widgetId: string,
    layout: WidgetLayoutUpdate,
  ) => StoreMutationResult<Dashboard>;
  removeWidget: (dashboardId: number, widgetId: string) => StoreMutationResult<Dashboard>;
  setWidgetEnabled: (
    dashboardId: number,
    widgetId: string,
    isEnable: boolean,
  ) => StoreMutationResult<Dashboard>;
}

const initialDashboards = cloneSeed(DASHBOARD_DB).map((dashboard) =>
  normalizeDashboard(dashboard),
);

const widgetsRequireSpecificPark = new Set<string>([]);
const switchesRequiringSpecificPark = new Set([
  'turn_onoff_lights',
  'turn_onoff_cameras',
  'turn_onoff_sensors',
]);

const parseSpecificParkId = (dataSource: WidgetDataSource) => {
  if (!('park' in dataSource) || !dataSource.park || dataSource.park === 'ALL') {
    return null;
  }

  const parkId = Number(dataSource.park);
  if (!Number.isInteger(parkId) || parkId < 1) {
    return Number.NaN;
  }

  return parkId;
};

const validateWidgetDataSource = (dataSource: WidgetDataSource) => {
  if (
    'park' in dataSource &&
    dataSource.park === 'ALL' &&
    widgetsRequireSpecificPark.has(dataSource.category)
  ) {
    return `${dataSource.category} widgets require a specific park reference.`;
  }

  if (
    dataSource.category === 'ACTION' &&
    dataSource.type === 'switch' &&
    dataSource.switch_id &&
    switchesRequiringSpecificPark.has(dataSource.switch_id) &&
    (!dataSource.park || dataSource.park === 'ALL')
  ) {
    return `${dataSource.switch_id} requires a specific park reference.`;
  }

  const parkId = parseSpecificParkId(dataSource);
  if (parkId === null) {
    return null;
  }

  if (Number.isNaN(parkId)) {
    return 'Widget park reference must be a positive integer or ALL.';
  }

  const park = useParkStore.getState().getPark(parkId);
  if (!park) {
    return `Widget references park ${parkId}, which does not exist.`;
  }

  return null;
};

const validateWidget = (widgets: WidgetConfig[], candidate: WidgetConfig) => {
  if (!candidate.id.trim()) {
    return 'Widget id is required.';
  }

  const duplicate = widgets.find((widget) => widget.id === candidate.id);
  if (duplicate) {
    return `Widget id "${candidate.id}" already exists in this dashboard.`;
  }

  if (!candidate.label.trim()) {
    return 'Widget label is required.';
  }

  if (!candidate.description.trim()) {
    return 'Widget description is required.';
  }

  if (
    !Number.isInteger(candidate.position_x) ||
    candidate.position_x < 0 ||
    !Number.isInteger(candidate.position_y) ||
    candidate.position_y < 0
  ) {
    return 'Widget position must use non-negative integers.';
  }

  if (
    !Number.isInteger(candidate.width) ||
    candidate.width < 1 ||
    !Number.isInteger(candidate.height) ||
    candidate.height < 1
  ) {
    return 'Widget size must use positive integers.';
  }

  return validateWidgetDataSource(candidate.data_source);
};

const validateDashboard = (dashboards: Dashboard[], candidate: Dashboard) => {
  const dashboardNameError = validateObjectName(
    candidate.dashboard_name,
    'dashboard_name',
  );
  if (dashboardNameError) {
    return dashboardNameError;
  }

  const duplicate = dashboards.find(
    (dashboard) =>
      dashboard.dashboard_name === candidate.dashboard_name &&
      dashboard.id !== candidate.id,
  );
  if (duplicate) {
    return `Dashboard name "${candidate.dashboard_name}" already exists.`;
  }

  if (!candidate.display_name.trim()) {
    return 'display_name is required.';
  }

  if (!candidate.description.trim()) {
    return 'description is required.';
  }

  const widgetIds = new Set<string>();
  for (const widget of candidate.widgets_list) {
    const normalizedWidget = normalizeWidget(widget);
    if (widgetIds.has(normalizedWidget.id)) {
      return `Widget id "${normalizedWidget.id}" already exists in this dashboard.`;
    }

    const widgetError = validateWidget(
      candidate.widgets_list.filter((item) => item.id !== normalizedWidget.id),
      normalizedWidget,
    );
    if (widgetError) {
      return widgetError;
    }

    widgetIds.add(normalizedWidget.id);
  }

  return null;
};

const resolveFallbackDashboardId = (targetId: number) => {
  const alternative = useDashboardStore
    .getState()
    .dashboards.find((dashboard) => dashboard.id !== targetId && dashboard.is_enable);

  return alternative?.id;
};

const reassignPinnedDashboards = (targetId: number) => {
  const pinnedUsers = useUserStore
    .getState()
    .users.filter((user) => user.pinned_dashboard_id === targetId);

  if (pinnedUsers.length === 0) {
    return null;
  }

  const fallbackId = resolveFallbackDashboardId(targetId);
  if (!fallbackId) {
    return `Dashboard ${targetId} is pinned by active users and there is no enabled fallback dashboard.`;
  }

  useUserStore.getState().reassignPinnedDashboard(targetId, fallbackId);
  return null;
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboards: initialDashboards,

  getDashboard: (id) => get().dashboards.find((dashboard) => dashboard.id === id),

  getDashboardByName: (dashboardName) =>
    get().dashboards.find((dashboard) => dashboard.dashboard_name === dashboardName),

  getEnabledDashboards: () =>
    get().dashboards.filter((dashboard) => dashboard.is_enable),

  addDashboard: (dashboard) => {
    const timestamp = now();
    const candidate = normalizeDashboard({
      ...dashboard,
      id: nextId(get().dashboards),
      created_at: timestamp,
      last_modified_at: timestamp,
    });
    const error = validateDashboard(get().dashboards, candidate);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      dashboards: [...state.dashboards, candidate],
    }));

    return success(candidate);
  },

  updateDashboard: (id, updates) => {
    const currentDashboard = get().getDashboard(id);
    if (!currentDashboard) {
      return failure(`Dashboard ${id} was not found.`);
    }

    const nextDashboard = normalizeDashboard({
      ...currentDashboard,
      ...updates,
      last_modified_at: now(),
    });
    const error = validateDashboard(get().dashboards, nextDashboard);

    if (error) {
      return failure(error);
    }

    if (currentDashboard.is_enable && !nextDashboard.is_enable) {
      const reassignmentError = reassignPinnedDashboards(id);
      if (reassignmentError) {
        return failure(reassignmentError);
      }
    }

    set((state) => ({
      dashboards: state.dashboards.map((dashboard) =>
        dashboard.id === id ? nextDashboard : dashboard,
      ),
    }));

    return success(nextDashboard);
  },

  deleteDashboard: (id) => {
    const dashboard = get().getDashboard(id);
    if (!dashboard) {
      return failure(`Dashboard ${id} was not found.`);
    }

    const reassignmentError = reassignPinnedDashboards(id);
    if (reassignmentError) {
      return failure(reassignmentError);
    }

    set((state) => ({
      dashboards: state.dashboards.filter((item) => item.id !== id),
    }));

    return success(id);
  },

  setDashboardEnabled: (id, isEnable) =>
    get().updateDashboard(id, { is_enable: isEnable }),

  addWidget: (dashboardId, widget) => {
    const dashboard = get().getDashboard(dashboardId);
    if (!dashboard) {
      return failure(`Dashboard ${dashboardId} was not found.`);
    }

    const candidate = normalizeWidget({
      ...widget,
      id: widget.id.trim() || getAutoWidgetId(dashboard.widgets_list),
    });
    const error = validateWidget(dashboard.widgets_list, candidate);

    if (error) {
      return failure(error);
    }

    return get().updateDashboard(dashboardId, {
      widgets_list: [...dashboard.widgets_list, candidate],
    });
  },

  updateWidget: (dashboardId, widgetId, updates) => {
    const dashboard = get().getDashboard(dashboardId);
    if (!dashboard) {
      return failure(`Dashboard ${dashboardId} was not found.`);
    }

    const currentWidget = dashboard.widgets_list.find((widget) => widget.id === widgetId);
    if (!currentWidget) {
      return failure(`Widget "${widgetId}" was not found.`);
    }

    const nextWidget = normalizeWidget({
      ...currentWidget,
      ...updates,
      id: currentWidget.id,
    });
    const siblingWidgets = dashboard.widgets_list.filter((widget) => widget.id !== widgetId);
    const error = validateWidget(siblingWidgets, nextWidget);

    if (error) {
      return failure(error);
    }

    return get().updateDashboard(dashboardId, {
      widgets_list: dashboard.widgets_list.map((widget) =>
        widget.id === widgetId ? nextWidget : widget,
      ),
    });
  },

  updateWidgetLayout: (dashboardId, widgetId, layout) => {
    const dashboard = get().getDashboard(dashboardId);
    if (!dashboard) {
      return failure(`Dashboard ${dashboardId} was not found.`);
    }

    const widget = dashboard.widgets_list.find((item) => item.id === widgetId);
    if (!widget) {
      return failure(`Widget "${widgetId}" was not found.`);
    }

    if (widget.is_fixed) {
      return failure(`Widget "${widgetId}" has a fixed layout and can not be moved.`);
    }

    return get().updateWidget(dashboardId, widgetId, layout);
  },

  removeWidget: (dashboardId, widgetId) => {
    const dashboard = get().getDashboard(dashboardId);
    if (!dashboard) {
      return failure(`Dashboard ${dashboardId} was not found.`);
    }

    const hasWidget = dashboard.widgets_list.some((widget) => widget.id === widgetId);
    if (!hasWidget) {
      return failure(`Widget "${widgetId}" was not found.`);
    }

    return get().updateDashboard(dashboardId, {
      widgets_list: dashboard.widgets_list.filter((widget) => widget.id !== widgetId),
    });
  },

  setWidgetEnabled: (dashboardId, widgetId, isEnable) =>
    get().updateWidget(dashboardId, widgetId, { is_enable: isEnable }),
}));

const disableWidgetsForMissingParks = () => {
  const parkMap = new Map(
    useParkStore.getState().parks.map((park) => [park.id, park]),
  );
  const { dashboards } = useDashboardStore.getState();
  const timestamp = now();
  let changed = false;

  const nextDashboards = dashboards.map((dashboard) => {
    let dashboardChanged = false;

    const nextWidgets = dashboard.widgets_list.map((widget) => {
      const parkId = parseSpecificParkId(widget.data_source);
      if (parkId === null || Number.isNaN(parkId)) {
        return widget;
      }

      const park = parkMap.get(parkId);
      if (park && park.is_enable) {
        return widget;
      }

      if (!widget.is_enable) {
        return widget;
      }

      changed = true;
      dashboardChanged = true;

      return {
        ...widget,
        is_enable: false,
      };
    });

    if (!dashboardChanged) {
      return dashboard;
    }

    return {
      ...dashboard,
      widgets_list: nextWidgets,
      last_modified_at: timestamp,
    };
  });

  if (changed) {
    useDashboardStore.setState({ dashboards: nextDashboards });
  }
};

useParkStore.subscribe(() => {
  disableWidgetsForMissingParks();
});
