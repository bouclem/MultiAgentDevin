import type { CollaborationSession } from "../types.js";
export declare class DashboardServer {
    private app;
    private server;
    private wss;
    private port;
    private staticPath;
    private sessions;
    constructor(port?: number, staticPath?: string);
    registerSession(session: CollaborationSession): void;
    updateSession(session: CollaborationSession): void;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
    private broadcast;
    private serializeSession;
}
//# sourceMappingURL=server.d.ts.map