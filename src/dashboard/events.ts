// ============================================================================
// MultiAgentDevin — Dashboard Event Emitter
// ============================================================================

import { EventEmitter } from "events";
import type { DashboardEvent, DashboardEventType } from "../types.js";

// ---------------------------------------------------------------------------
// CollaborationEventEmitter
// ---------------------------------------------------------------------------

export class CollaborationEventEmitter extends EventEmitter {
  private events: DashboardEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents = 1000) {
    super();
    this.maxEvents = maxEvents;
  }

  emitEvent(event: DashboardEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    this.emit("event", event);
    this.emit(event.type, event);
  }

  getEvents(collaborationId?: string): DashboardEvent[] {
    if (collaborationId) {
      return this.events.filter((e) => e.collaborationId === collaborationId);
    }
    return [...this.events];
  }

  getRecentEvents(count: number, collaborationId?: string): DashboardEvent[] {
    const events = this.getEvents(collaborationId);
    return events.slice(-count);
  }

  clearEvents(collaborationId?: string): void {
    if (collaborationId) {
      this.events = this.events.filter(
        (e) => e.collaborationId !== collaborationId
      );
    } else {
      this.events = [];
    }
  }

  // --- Convenience Methods --------------------------------------------------

  log(collaborationId: string, message: string, data?: Record<string, unknown>): void {
    this.emitEvent({
      type: "log",
      timestamp: Date.now(),
      collaborationId,
      data: data ?? {},
      message,
    });
  }

  notify(
    collaborationId: string,
    type: DashboardEventType,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.emitEvent({
      type,
      timestamp: Date.now(),
      collaborationId,
      data: data ?? {},
      message,
    });
  }
}

// ---------------------------------------------------------------------------
// Global Instance
// ---------------------------------------------------------------------------

export const globalEmitter = new CollaborationEventEmitter();
