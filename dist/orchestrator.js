// ============================================================================
// MultiAgentDevin — Orchestrator Engine
// ============================================================================
import { GitWorkspaceManager } from "./git-workspace.js";
import { globalEmitter } from "./dashboard/events.js";
import { ParallelPattern } from "./patterns/parallel.js";
import { DebatePattern } from "./patterns/debate.js";
import { PipelinePattern } from "./patterns/pipeline.js";
import { IterativePattern } from "./patterns/iterative.js";
import { TournamentPattern } from "./patterns/tournament.js";
import { SwarmPattern } from "./patterns/swarm.js";
// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------
export class Orchestrator {
    client;
    gitWorkspace;
    sessions = new Map();
    constructor(client) {
        this.client = client;
        this.gitWorkspace = new GitWorkspaceManager();
    }
    // --- Session Management ---------------------------------------------------
    createSession(config) {
        const id = `collab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const session = {
            id,
            pattern: config.pattern,
            task: config.task,
            agents: new Map(),
            branchTree: this.gitWorkspace.createTree(id, `collab-${id}`),
            status: "pending",
            rounds: [],
            currentRoundIndex: -1,
            config,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.sessions.set(id, session);
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    getAllSessions() {
        return [...this.sessions.values()];
    }
    // --- Pattern Execution ----------------------------------------------------
    async execute(config) {
        const session = this.createSession(config);
        return this.executeSession(session);
    }
    async executeSession(session) {
        session.status = "running";
        session.updatedAt = Date.now();
        globalEmitter.notify(session.id, "collaboration_started", `Starting collaboration: ${session.pattern} — ${session.task.slice(0, 100)}`, { pattern: session.pattern, task: session.task });
        try {
            const pattern = this.createPattern(session);
            const result = await pattern.execute(session);
            session.status = "completed";
            session.result = result;
            session.updatedAt = Date.now();
            globalEmitter.notify(session.id, "collaboration_completed", `Collaboration completed: ${result.summary}`, { result: result.summary });
            return result;
        }
        catch (error) {
            session.status = "failed";
            session.updatedAt = Date.now();
            const errorMsg = error instanceof Error ? error.message : String(error);
            globalEmitter.notify(session.id, "collaboration_failed", `Collaboration failed: ${errorMsg}`, { error: errorMsg });
            throw error;
        }
    }
    // --- Status ---------------------------------------------------------------
    getStatus(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return undefined;
        return {
            status: session.status,
            pattern: session.pattern,
            agents: [...session.agents.values()].map((a) => ({
                id: a.id,
                role: a.role,
                status: a.status,
                branchName: a.branchName,
            })),
            rounds: session.rounds.length,
            currentRound: session.currentRoundIndex,
            branches: this.gitWorkspace.getAllBranches(sessionId).map((b) => ({
                id: b.id,
                name: b.name,
                status: b.status,
                depth: b.depth,
            })),
        };
    }
    // --- Pattern Factory ------------------------------------------------------
    createPattern(session) {
        const config = session.config;
        switch (config.pattern) {
            case "parallel":
                return new ParallelPattern(this.client, this.gitWorkspace, globalEmitter, config);
            case "debate":
                return new DebatePattern(this.client, this.gitWorkspace, globalEmitter, config);
            case "pipeline":
                return new PipelinePattern(this.client, this.gitWorkspace, globalEmitter, config);
            case "iterative":
                return new IterativePattern(this.client, this.gitWorkspace, globalEmitter, config);
            case "tournament":
                return new TournamentPattern(this.client, this.gitWorkspace, globalEmitter, config);
            case "swarm":
                return new SwarmPattern(this.client, this.gitWorkspace, globalEmitter, config);
            default:
                throw new Error(`Unknown pattern: ${config.pattern}`);
        }
    }
}
//# sourceMappingURL=orchestrator.js.map