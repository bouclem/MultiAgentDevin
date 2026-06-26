export type ApiVersion = "v1" | "v3";
export interface AuthConfig {
    apiKey: string;
    apiVersion: ApiVersion;
    baseUrl: string;
    orgId?: string;
    pollIntervalMs: number;
}
export declare class AuthManager {
    /**
     * Resolve the Devin API key from multiple sources, in priority order:
     *
     * 1. Explicitly passed apiKey (programmatic)
     * 2. MCP env interpolation: process.env.DEVIN_API_KEY (set by MCP client)
     * 3. File-based: ~/.devin/api_key (or DEVIN_API_KEY_FILE env var)
     * 4. Devin Desktop config: ~/.codeium/windsurf/mcp_config.json
     * 5. Legacy .env: DEVIN_API_KEY
     *
     * Also resolves:
     * - API version from key prefix (cog_ → v3, apk_ → v1)
     * - X-Org-Id from DEVIN_ORG_ID env or config
     * - Base URL from DEVIN_API_BASE_URL or config
     */
    static resolve(config?: {
        apiKey?: string;
        baseUrl?: string;
        orgId?: string;
        pollIntervalMs?: number;
    }): AuthConfig;
    /**
     * Detect API version from key prefix.
     * cog_ → v3 (service user, recommended)
     * apk_ / apk_user_ → v1 (legacy, deprecated)
     */
    static detectApiVersion(key: string): ApiVersion;
    private static resolveApiKeyFromEnv;
    private static resolveApiKeyFromFile;
    private static resolveApiKeyFromDevinDesktopConfig;
    private static resolveOrgIdFromDevinDesktopConfig;
    private static getDevinDesktopConfigPath;
    /**
     * Resolve ${env:VAR_NAME} and ${file:/path/to/file} interpolation patterns
     * used by Devin Desktop's mcp_config.json.
     */
    private static interpolateValue;
    static validate(config: AuthConfig): void;
}
//# sourceMappingURL=auth.d.ts.map