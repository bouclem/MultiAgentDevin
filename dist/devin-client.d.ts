import type { CreateSessionParams, DevinSessionResponse, SessionMessage } from "./types.js";
import type { ApiVersion } from "./auth.js";
interface DevinClientConfig {
    apiKey: string;
    apiVersion?: ApiVersion;
    baseUrl?: string;
    orgId?: string;
    pollIntervalMs?: number;
}
export declare class DevinClient {
    private apiKey;
    private apiVersion;
    private baseUrl;
    private orgId?;
    private pollIntervalMs;
    constructor(config: DevinClientConfig);
    get version(): ApiVersion;
    /**
     * Build the API path prefix based on version.
     * v1: /v1/sessions
     * v3: /v3/organizations/{orgId}/sessions (requires orgId)
     */
    private get sessionsPath();
    createSession(params: CreateSessionParams): Promise<DevinSessionResponse>;
    getSession(sessionId: string): Promise<DevinSessionResponse>;
    sendMessage(sessionId: string, message: string): Promise<void>;
    listSessions(): Promise<DevinSessionResponse[]>;
    updateSessionTags(sessionId: string, tags: string[]): Promise<void>;
    waitForSession(sessionId: string, opts?: {
        timeoutMs?: number;
        onPoll?: (status: string) => void;
    }): Promise<DevinSessionResponse>;
    waitForSessions(sessionIds: string[], opts?: {
        timeoutMs?: number;
        onPoll?: (id: string, status: string) => void;
    }): Promise<Map<string, DevinSessionResponse>>;
    isRunning(status: string): boolean;
    isFinished(status: string): boolean;
    isErrored(status: string): boolean;
    extractMessages(session: DevinSessionResponse): SessionMessage[];
    private request;
    private sleep;
}
export declare function createDevinClient(config?: {
    apiKey?: string;
    baseUrl?: string;
    orgId?: string;
    pollIntervalMs?: number;
}): DevinClient;
export {};
//# sourceMappingURL=devin-client.d.ts.map