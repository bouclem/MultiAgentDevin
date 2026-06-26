// ============================================================================
// MultiAgentDevin — Devin API Client
// ============================================================================

import type {
  CreateSessionParams,
  DevinSessionResponse,
  SessionMessage,
  SessionStatus,
} from "./types.js";
import { AuthManager } from "./auth.js";
import type { AuthConfig, ApiVersion } from "./auth.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface DevinClientConfig {
  apiKey: string;
  apiVersion?: ApiVersion;
  baseUrl?: string;
  orgId?: string;
  pollIntervalMs?: number;
}

const DEFAULT_BASE_URL = "https://api.devin.ai";
const DEFAULT_POLL_INTERVAL = 5000;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class DevinClient {
  private apiKey: string;
  private apiVersion: ApiVersion;
  private baseUrl: string;
  private orgId?: string;
  private pollIntervalMs: number;

  constructor(config: DevinClientConfig) {
    this.apiKey = config.apiKey;
    this.apiVersion = config.apiVersion ?? AuthManager.detectApiVersion(config.apiKey);
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.orgId = config.orgId;
    this.pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
  }

  // --- Session Management ---------------------------------------------------

  // --- API Version Helpers (v1.1.0) -----------------------------------------

  get version(): ApiVersion {
    return this.apiVersion;
  }

  /**
   * Build the API path prefix based on version.
   * v1: /v1/sessions
   * v3: /v3/organizations/{orgId}/sessions (requires orgId)
   */
  private get sessionsPath(): string {
    if (this.apiVersion === "v3") {
      const orgId = this.orgId ?? "default";
      return `/v3/organizations/${orgId}/sessions`;
    }
    return "/v1/sessions";
  }

  async createSession(
    params: CreateSessionParams
  ): Promise<DevinSessionResponse> {
    const body: Record<string, unknown> = {
      prompt: params.prompt,
      idempotent: params.idempotent ?? false,
    };

    if (params.playbook_id) body.playbook_id = params.playbook_id;
    if (params.tags) body.tags = params.tags;
    if (params.max_acu_limit) body.max_acu_limit = params.max_acu_limit;
    if (params.repos) body.repos = params.repos;
    if (params.title) body.title = params.title;
    if (params.bypass_approval !== undefined)
      body.bypass_approval = params.bypass_approval;
    if (params.structured_output_required) {
      body.structured_output_required = params.structured_output_required;
      if (params.structured_output_schema) {
        body.structured_output_schema = params.structured_output_schema;
      }
    }

    const res = await this.request("POST", this.sessionsPath, body);
    return res as DevinSessionResponse;
  }

  async getSession(sessionId: string): Promise<DevinSessionResponse> {
    const res = await this.request("GET", `${this.sessionsPath}/${sessionId}`);
    return res as DevinSessionResponse;
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const messagePath = this.apiVersion === "v3" ? "messages" : "message";
    await this.request("POST", `${this.sessionsPath}/${sessionId}/${messagePath}`, {
      message,
    });
  }

  async listSessions(): Promise<DevinSessionResponse[]> {
    const res = await this.request("GET", this.sessionsPath);
    // v3 API returns { items: [...], end_cursor, has_next_page, total }
    // v1 API returns a direct array
    if (Array.isArray(res)) return res as DevinSessionResponse[];
    if (res && Array.isArray((res as Record<string, unknown>).items)) {
      return (res as Record<string, unknown>).items as DevinSessionResponse[];
    }
    return res as DevinSessionResponse[];
  }

  async updateSessionTags(
    sessionId: string,
    tags: string[]
  ): Promise<void> {
    await this.request("PUT", `${this.sessionsPath}/${sessionId}/tags`, { tags });
  }

  // --- Waiting & Polling ----------------------------------------------------

  async waitForSession(
    sessionId: string,
    opts?: { timeoutMs?: number; onPoll?: (status: string) => void }
  ): Promise<DevinSessionResponse> {
    const timeoutMs = opts?.timeoutMs ?? 600_000; // 10 min default
    const deadline = Date.now() + timeoutMs;

    let session = await this.getSession(sessionId);

    while (this.isRunning(session.status)) {
      if (Date.now() > deadline) {
        throw new Error(
          `Session ${sessionId} timed out after ${timeoutMs}ms (last status: ${session.status})`
        );
      }

      if (opts?.onPoll) opts.onPoll(session.status);

      await this.sleep(this.pollIntervalMs);
      session = await this.getSession(sessionId);
    }

    return session;
  }

  async waitForSessions(
    sessionIds: string[],
    opts?: { timeoutMs?: number; onPoll?: (id: string, status: string) => void }
  ): Promise<Map<string, DevinSessionResponse>> {
    const results = new Map<string, DevinSessionResponse>();
    const pending = new Set(sessionIds);
    const timeoutMs = opts?.timeoutMs ?? 600_000;
    const deadline = Date.now() + timeoutMs;

    while (pending.size > 0) {
      if (Date.now() > deadline) {
        throw new Error(
          `waitForSessions timed out after ${timeoutMs}ms. Pending: ${[...pending].join(", ")}`
        );
      }

      for (const id of pending) {
        const session = await this.getSession(id);
        if (opts?.onPoll) opts.onPoll(id, session.status);

        if (!this.isRunning(session.status)) {
          results.set(id, session);
          pending.delete(id);
        }
      }

      if (pending.size > 0) {
        await this.sleep(this.pollIntervalMs);
      }
    }

    return results;
  }

  // --- Helpers --------------------------------------------------------------

  isRunning(status: string): boolean {
    const runningStatuses: SessionStatus[] = [
      "created",
      "working",
      "blocked",
      "suspend_requested",
      "suspend_requested_frontend",
      "resume_requested",
      "resume_requested_frontend",
      "resumed",
    ];
    return runningStatuses.includes(status as SessionStatus);
  }

  isFinished(status: string): boolean {
    return status === "finished";
  }

  isErrored(status: string): boolean {
    return status === "expired" || status === "errored";
  }

  extractMessages(session: DevinSessionResponse): SessionMessage[] {
    if (!session.messages) return [];
    return session.messages as SessionMessage[];
  }

  // --- Internal -------------------------------------------------------------

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // v3 API requires X-Org-Id header for enterprise accounts
    if (this.apiVersion === "v3" && this.orgId) {
      headers["X-Org-Id"] = this.orgId;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Devin API ${method} ${path} failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDevinClient(config?: {
  apiKey?: string;
  baseUrl?: string;
  orgId?: string;
  pollIntervalMs?: number;
}): DevinClient {
  const auth = AuthManager.resolve({
    apiKey: config?.apiKey,
    baseUrl: config?.baseUrl,
    orgId: config?.orgId,
    pollIntervalMs: config?.pollIntervalMs,
  });

  AuthManager.validate(auth);

  if (auth.apiVersion === "v3") {
    console.error(`[DevinClient] Using v3 API (org: ${auth.orgId ?? "default"})`);
  } else {
    console.error("[DevinClient] Using v1 API (legacy)");
  }

  return new DevinClient({
    apiKey: auth.apiKey,
    apiVersion: auth.apiVersion,
    baseUrl: auth.baseUrl,
    orgId: auth.orgId,
    pollIntervalMs: auth.pollIntervalMs,
  });
}
