'use client';

import { create } from 'zustand';
import { EVENT_DB } from '@/data/mock-events';
import type { EventDef } from '@/types/database';
import {
  cloneSeed,
  failure,
  nextId,
  normalizeEventDef,
  success,
  type StoreMutationResult,
  validateErrCode,
  validateEventCode,
} from '@/lib/ipark-store-helpers';
import { useEventHistoryStore } from '@/stores/event-history-store';

type CreateEventDefInput = Omit<EventDef, 'id'>;
type UpdateEventDefInput = Partial<Omit<EventDef, 'id'>>;

interface EventDefStore {
  eventDefs: EventDef[];
  getEventDef: (id: number) => EventDef | undefined;
  getEventDefByCode: (eventCode: string) => EventDef | undefined;
  getEnabledEventDefs: () => EventDef[];
  addEventDef: (eventDef: CreateEventDefInput) => StoreMutationResult<EventDef>;
  updateEventDef: (
    id: number,
    updates: UpdateEventDefInput,
  ) => StoreMutationResult<EventDef>;
  deleteEventDef: (id: number) => StoreMutationResult<number>;
  setEventDefEnabled: (id: number, isEnable: boolean) => StoreMutationResult<EventDef>;
}

const initialEventDefs = cloneSeed(EVENT_DB).map((eventDef) =>
  normalizeEventDef(eventDef),
);

const validateEventDef = (eventDefs: EventDef[], candidate: EventDef, previous?: EventDef) => {
  const duplicate = eventDefs.find(
    (eventDef) =>
      eventDef.event_code === candidate.event_code && eventDef.id !== candidate.id,
  );
  if (duplicate) {
    return `Event code "${candidate.event_code}" already exists.`;
  }

  const eventCodeError = validateEventCode(
    candidate.event_code,
    'event_code',
    previous?.event_code,
  );
  if (eventCodeError) {
    return eventCodeError;
  }

  const errCodeError = validateErrCode(candidate.error_code, 'error_code');
  if (errCodeError) {
    return errCodeError;
  }

  if (!candidate.event_name.trim()) {
    return 'event_name is required.';
  }

  if (!candidate.description.trim()) {
    return 'description is required.';
  }

  return null;
};

export const useEventDefStore = create<EventDefStore>((set, get) => ({
  eventDefs: initialEventDefs,

  getEventDef: (id) => get().eventDefs.find((eventDef) => eventDef.id === id),

  getEventDefByCode: (eventCode) =>
    get().eventDefs.find((eventDef) => eventDef.event_code === eventCode),

  getEnabledEventDefs: () =>
    get().eventDefs.filter((eventDef) => eventDef.is_enable),

  addEventDef: (eventDef) => {
    const candidate = normalizeEventDef({
      ...eventDef,
      id: nextId(get().eventDefs),
    });
    const error = validateEventDef(get().eventDefs, candidate);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      eventDefs: [...state.eventDefs, candidate],
    }));

    return success(candidate);
  },

  updateEventDef: (id, updates) => {
    const currentEventDef = get().getEventDef(id);
    if (!currentEventDef) {
      return failure(`Event definition ${id} was not found.`);
    }

    const nextEventDef = normalizeEventDef({
      ...currentEventDef,
      ...updates,
    });
    const error = validateEventDef(get().eventDefs, nextEventDef, currentEventDef);

    if (error) {
      return failure(error);
    }

    set((state) => ({
      eventDefs: state.eventDefs.map((eventDef) =>
        eventDef.id === id ? nextEventDef : eventDef,
      ),
    }));

    return success(nextEventDef);
  },

  deleteEventDef: (id) => {
    const eventDef = get().getEventDef(id);
    if (!eventDef) {
      return failure(`Event definition ${id} was not found.`);
    }

    const isInUse = useEventHistoryStore
      .getState()
      .events.some((event) => event.event_code === eventDef.event_code);

    if (isInUse) {
      return failure(
        `Event code "${eventDef.event_code}" is already referenced in event history and can not be deleted.`,
      );
    }

    set((state) => ({
      eventDefs: state.eventDefs.filter((item) => item.id !== id),
    }));

    return success(id);
  },

  setEventDefEnabled: (id, isEnable) =>
    get().updateEventDef(id, { is_enable: isEnable }),
}));
