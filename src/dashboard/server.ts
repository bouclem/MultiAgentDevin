// ============================================================================
// MultiAgentDevin — Dashboard WebSocket Server
// ============================================================================

import express from "express";
import { WebSocketServer } from "ws";
import { join, resolve, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { globalEmitter } from "./events.js";
import type { CollaborationSession } from "../types.js";

// ---------------------------------------------------------------------------
// DashboardServer
// ---------------------------------------------------------------------------

export class DashboardServer {
  private app: express.Express;
  private server: ReturnType<express.Express["listen"]> | null = null;
  private wss: WebSocketServer | null = null;
  private port: number;
  private staticPath: string;
  private sessions: Map<string, CollaborationSession> = new Map();

  constructor(port?: number, staticPath?: string) {
    this.port = port ?? 3456;

    // Resolve dashboard/dist relative to this file (dist/dashboard/server.js)
    // so it works regardless of process.cwd()
    const defaultPath = staticPath ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..", "dashboard", "dist");

    // Fallback: process.cwd()/dashboard/dist if the relative path doesn't exist
    if (existsSync(defaultPath)) {
      this.staticPath = defaultPath;
    } else {
      const cwdPath = join(process.cwd(), "dashboard", "dist");
      this.staticPath = cwdPath;
    }

    this.app = express();
    this.setupRoutes();
  }

  registerSession(session: CollaborationSession): void {
    this.sessions.set(session.id, session);
  }

  updateSession(session: CollaborationSession): void {
    this.sessions.set(session.id, session);
    this.broadcast({
      type: "session_updated",
      data: this.serializeSession(session),
    });
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // API endpoints
    this.app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", timestamp: Date.now() });
    });

    this.app.get("/api/sessions", (_req, res) => {
      const sessions = [...this.sessions.values()].map((s) =>
        this.serializeSession(s)
      );
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
    } else {
      console.warn(
        `[Dashboard] Static files not found at ${this.staticPath}. ` +
        `Run "cd dashboard && npm install && npm run build" to build the dashboard UI. ` +
        `API endpoints are still available at http://localhost:${this.port}/api/*`
      );
      this.app.get("*", (_req, res) => {
        res.json({
          message: "Dashboard UI not built. API available at /api/*",
          staticPath: this.staticPath,
        });
      });
    }
  }

  start(): Promise<void> {
    return this.tryStart(this.port);
  }

  private tryStart(port: number, attempts = 0): Promise<void> {
    const MAX_RETRIES = 10;

    return new Promise((resolvePromise, rejectPromise) => {
      const server = this.app.listen(port, () => {
        this.port = port;
        this.server = server;
        console.log(`[Dashboard] Server running at http://localhost:${port}`);

        this.wss = new WebSocketServer({ server: server, path: "/ws" });

        this.wss.on("connection", (ws) => {
          const recentEvents = globalEmitter.getRecentEvents(100);
          ws.send(
            JSON.stringify({
              type: "initial",
              data: recentEvents,
            })
          );

          const listener = (event: unknown) => {
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

      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && attempts < MAX_RETRIES) {
          // Port in use — try next port automatically
          server.close();
          const nextPort = port + 1;
          console.warn(
            `[Dashboard] Port ${port} in use, trying ${nextPort}...`
          );
          this.tryStart(nextPort, attempts + 1).then(resolvePromise).catch(rejectPromise);
        } else if (err.code === "EADDRINUSE") {
          console.warn(
            `[Dashboard] Could not find a free port after ${MAX_RETRIES} attempts. ` +
            `Dashboard disabled — MCP server continues without it.`
          );
          rejectPromise(err);
        } else {
          console.error("[Dashboard] Server error:", err.message);
          rejectPromise(err);
        }
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolvePromise) => {
      this.wss?.close();
      this.server?.close(() => resolvePromise());
    });
  }

  private broadcast(message: { type: string; data: unknown }): void {
    if (!this.wss) return;
    const msg = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(msg);
      }
    }
  }

  private serializeSession(session: CollaborationSession): Record<string, unknown> {
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
