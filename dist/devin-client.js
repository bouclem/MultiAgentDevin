// ============================================================================
// MultiAgentDevin — Devin API Client
// ============================================================================
import { AuthManager } from "./auth.js";
const DEFAULT_BASE_URL = "https://api.devin.ai";
const DEFAULT_POLL_INTERVAL = 5000;
// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export class DevinClient {
    apiKey;
    apiVersion;
    baseUrl;
    orgId;
    pollIntervalMs;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiVersion = config.apiVersion ?? AuthManager.detectApiVersion(config.apiKey);
        this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
        this.orgId = config.orgId;
        this.pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
    }
    // --- Session Management ---------------------------------------------------
    // --- API Version Helpers (v1.1.0) -----------------------------------------
    get version() {
        return this.apiVersion;
    }
    /**
     * Build the API path prefix based on version.
     * v1: /v1/sessions
     * v3: /v3/organizations/{orgId}/sessions (requires orgId)
     */
    get sessionsPath() {
        if (this.apiVersion === "v3") {
            const orgId = this.orgId ?? "default";
            return `/v3/organizations/${orgId}/sessions`;
        }
        return "/v1/sessions";
    }
    async createSession(params) {
        const body = {
            prompt: params.prompt,
            idempotent: params.idempotent ?? false,
        };
        if (params.playbook_id)
            body.playbook_id = params.playbook_id;
        if (params.tags)
            body.tags = params.tags;
        if (params.max_acu_limit)
            body.max_acu_limit = params.max_acu_limit;
        if (params.repos)
            body.repos = params.repos;
        if (params.title)
            body.title = params.title;
        if (params.bypass_approval !== undefined)
            body.bypass_approval = params.bypass_approval;
        if (params.structured_output_required) {
            body.structured_output_required = params.structured_output_required;
            if (params.structured_output_schema) {
                body.structured_output_schema = params.structured_output_schema;
            }
        }
        const res = await this.request("POST", this.sessionsPath, body);
        return res;
    }
    async getSession(sessionId) {
        const res = await this.request("GET", `${this.sessionsPath}/${sessionId}`);
        return res;
    }
    async sendMessage(sessionId, message) {
        await this.request("POST", `${this.sessionsPath}/${sessionId}/message`, {
            message,
        });
    }
    async listSessions() {
        const res = await this.request("GET", this.sessionsPath);
        return res;
    }
    async updateSessionTags(sessionId, tags) {
        await this.request("PUT", `${this.sessionsPath}/${sessionId}/tags`, { tags });
    }
    // --- Waiting & Polling ----------------------------------------------------
    async waitForSession(sessionId, opts) {
        const timeoutMs = opts?.timeoutMs ?? 600_000; // 10 min default
        const deadline = Date.now() + timeoutMs;
        let session = await this.getSession(sessionId);
        while (this.isRunning(session.status)) {
            if (Date.now() > deadline) {
                throw new Error(`Session ${sessionId} timed out after ${timeoutMs}ms (last status: ${session.status})`);
            }
            if (opts?.onPoll)
                opts.onPoll(session.status);
            await this.sleep(this.pollIntervalMs);
            session = await this.getSession(sessionId);
        }
        return session;
    }
    async waitForSessions(sessionIds, opts) {
        const results = new Map();
        const pending = new Set(sessionIds);
        const timeoutMs = opts?.timeoutMs ?? 600_000;
        const deadline = Date.now() + timeoutMs;
        while (pending.size > 0) {
            if (Date.now() > deadline) {
                throw new Error(`waitForSessions timed out after ${timeoutMs}ms. Pending: ${[...pending].join(", ")}`);
            }
            for (const id of pending) {
                const session = await this.getSession(id);
                if (opts?.onPoll)
                    opts.onPoll(id, session.status);
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
    isRunning(status) {
        const runningStatuses = [
            "created",
            "working",
            "blocked",
            "suspend_requested",
            "suspend_requested_frontend",
            "resume_requested",
            "resume_requested_frontend",
            "resumed",
        ];
        return runningStatuses.includes(status);
    }
    isFinished(status) {
        return status === "finished";
    }
    isErrored(status) {
        return status === "expired" || status === "errored";
    }
    extractMessages(session) {
        if (!session.messages)
            return [];
        return session.messages;
    }
    // --- Internal -------------------------------------------------------------
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
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
            throw new Error(`Devin API ${method} ${path} failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            return res.json();
        }
        return null;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createDevinClient(config) {
    const auth = AuthManager.resolve({
        apiKey: config?.apiKey,
        baseUrl: config?.baseUrl,
        orgId: config?.orgId,
        pollIntervalMs: config?.pollIntervalMs,
    });
    AuthManager.validate(auth);
    if (auth.apiVersion === "v3") {
        console.error(`[DevinClient] Using v3 API (org: ${auth.orgId ?? "default"})`);
    }
    else {
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
//# sourceMappingURL=devin-client.js.map