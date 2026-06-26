// ============================================================================
// MultiAgentDevin — Dashboard WebSocket Server
// ============================================================================
import express from "express";
import { WebSocketServer } from "ws";
import { join } from "path";
import { existsSync } from "fs";
import { globalEmitter } from "./events.js";
// ---------------------------------------------------------------------------
// DashboardServer
// ---------------------------------------------------------------------------
export class DashboardServer {
    app;
    server = null;
    wss = null;
    port;
    staticPath;
    sessions = new Map();
    constructor(port, staticPath) {
        this.port = port ?? 3456;
        this.staticPath = staticPath ?? join(process.cwd(), "dashboard", "dist");
        this.app = express();
        this.setupRoutes();
    }
    registerSession(session) {
        this.sessions.set(session.id, session);
    }
    updateSession(session) {
        this.sessions.set(session.id, session);
        this.broadcast({
            type: "session_updated",
            data: this.serializeSession(session),
        });
    }
    setupRoutes() {
        this.app.use(express.json());
        // API endpoints
        this.app.get("/api/health", (_req, res) => {
            res.json({ status: "ok", timestamp: Date.now() });
        });
        this.app.get("/api/sessions", (_req, res) => {
            const sessions = [...this.sessions.values()].map((s) => this.serializeSession(s));
            res.json(sessions);
        });
        this.app.get("/api/sessions/:id", (req, res) => {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            res.json(this.serializeSession(session));
        });
        this.app.get("/api/sessions/:id/events", (req, res) => {
            const events = globalEmitter.getRecentEvents(200, req.params.id);
            res.json(events);
        });
        this.app.get("/api/events", (_req, res) => {
            const events = globalEmitter.getRecentEvents(200);
            res.json(events);
        });
        // Serve dashboard static files
        if (existsSync(this.staticPath)) {
            this.app.use(express.static(this.staticPath));
            this.app.get("*", (_req, res) => {
                res.sendFile(join(this.staticPath, "index.html"));
            });
        }
    }
    start() {
        return new Promise((resolvePromise) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`[Dashboard] Server running at http://localhost:${this.port}`);
                this.wss = new WebSocketServer({ server: this.server, path: "/ws" });
                this.wss.on("connection", (ws) => {
                    // Send recent events on connect
                    const recentEvents = globalEmitter.getRecentEvents(100);
                    ws.send(JSON.stringify({
                        type: "initial",
                        data: recentEvents,
                    }));
                    // Forward new events to this client
                    const listener = (event) => {
                        if (ws.readyState === ws.OPEN) {
                            ws.send(JSON.stringify({ type: "event", data: event }));
                        }
                    };
                    globalEmitter.on("event", listener);
                    ws.on("close", () => {
                        globalEmitter.off("event", listener);
                    });
                });
                resolvePromise();
            });
        });
    }
    stop() {
        return new Promise((resolvePromise) => {
            this.wss?.close();
            this.server?.close(() => resolvePromise());
        });
    }
    broadcast(message) {
        if (!this.wss)
            return;
        const msg = JSON.stringify(message);
        for (const client of this.wss.clients) {
            if (client.readyState === client.OPEN) {
                client.send(msg);
            }
        }
    }
    serializeSession(session) {
        return {
            id: session.id,
            pattern: session.pattern,
            task: session.task,
            status: session.status,
            currentRound: session.currentRoundIndex,
            totalRounds: session.rounds.length,
            agents: [...session.agents.values()].map((a) => ({
                id: a.id,
                role: a.role,
                roleName: a.roleName,
                status: a.status,
                branchId: a.branchId,
                branchName: a.branchName,
                sessionId: a.sessionId,
                acusConsumed: a.acusConsumed,
            })),
            branches: [...session.branchTree.branches.values()].map((b) => ({
                id: b.id,
                name: b.name,
                parentId: b.parentId,
                depth: b.depth,
                status: b.status,
                agentId: b.agentId,
                childrenIds: b.childrenIds,
                commitSha: b.commitSha,
            })),
            rounds: session.rounds.map((r) => ({
                index: r.index,
                status: r.status,
                agentIds: r.agentIds,
                eliminatedAgentIds: r.eliminatedAgentIds,
                recycledAgentIds: r.recycledAgentIds,
            })),
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
}
//# sourceMappingURL=server.js.map