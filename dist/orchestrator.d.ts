import type { CollaborationConfig, CollaborationPattern, CollaborationResult, CollaborationSession } from "./types.js";
import { DevinClient } from "./devin-client.js";
export declare class Orchestrator {
    private client;
    private gitWorkspace;
    private sessions;
    constructor(client: DevinClient);
    createSession(config: CollaborationConfig): CollaborationSession;
    getSession(id: string): CollaborationSession | undefined;
    getAllSessions(): CollaborationSession[];
    execute(config: CollaborationConfig): Promise<CollaborationResult>;
    executeSession(session: CollaborationSession): Promise<CollaborationResult>;
    getStatus(sessionId: string): {
        status: string;
        pattern: CollaborationPattern;
        agents: Array<{
            id: string;
            role: string;
            status: string;
            branchName?: string;
        }>;
        rounds: number;
        currentRound: number;
        branches: Array<{
            id: string;
            name: string;
            status: string;
            depth: number;
        }>;
    } | undefined;
    private createPattern;
}
//# sourceMappingURL=orchestrator.d.ts.map