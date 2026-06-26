// ============================================================================
// MultiAgentDevin — Dashboard Event Emitter
// ============================================================================
import { EventEmitter } from "events";
// ---------------------------------------------------------------------------
// CollaborationEventEmitter
// ---------------------------------------------------------------------------
export class CollaborationEventEmitter extends EventEmitter {
    events = [];
    maxEvents;
    constructor(maxEvents = 1000) {
        super();
        this.maxEvents = maxEvents;
    }
    emitEvent(event) {
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        this.emit("event", event);
        this.emit(event.type, event);
    }
    getEvents(collaborationId) {
        if (collaborationId) {
            return this.events.filter((e) => e.collaborationId === collaborationId);
        }
        return [...this.events];
    }
    getRecentEvents(count, collaborationId) {
        const events = this.getEvents(collaborationId);
        return events.slice(-count);
    }
    clearEvents(collaborationId) {
        if (collaborationId) {
            this.events = this.events.filter((e) => e.collaborationId !== collaborationId);
        }
        else {
            this.events = [];
        }
    }
    // --- Convenience Methods --------------------------------------------------
    log(collaborationId, message, data) {
        this.emitEvent({
            type: "log",
            timestamp: Date.now(),
            collaborationId,
            data: data ?? {},
            message,
        });
    }
    notify(collaborationId, type, message, data) {
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
//# sourceMappingURL=events.js.map