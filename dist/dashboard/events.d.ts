import { EventEmitter } from "events";
import type { DashboardEvent, DashboardEventType } from "../types.js";
export declare class CollaborationEventEmitter extends EventEmitter {
    private events;
    private maxEvents;
    constructor(maxEvents?: number);
    emitEvent(event: DashboardEvent): void;
    getEvents(collaborationId?: string): DashboardEvent[];
    getRecentEvents(count: number, collaborationId?: string): DashboardEvent[];
    clearEvents(collaborationId?: string): void;
    log(collaborationId: string, message: string, data?: Record<string, unknown>): void;
    notify(collaborationId: string, type: DashboardEventType, message: string, data?: Record<string, unknown>): void;
}
export declare const globalEmitter: CollaborationEventEmitter;
//# sourceMappingURL=events.d.ts.map