// ============================================================================
// MultiAgentDevin — Auth Manager (v1.1.0)
// ============================================================================
// Multi-source authentication: MCP config interpolation, file-based,
// environment variables, Devin Desktop native config.
// ============================================================================
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
// ---------------------------------------------------------------------------
// Auth Manager
// ---------------------------------------------------------------------------
export class AuthManager {
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
    static resolve(config) {
        const apiKey = config?.apiKey
            ?? this.resolveApiKeyFromEnv()
            ?? this.resolveApiKeyFromFile()
            ?? this.resolveApiKeyFromDevinDesktopConfig();
        if (!apiKey) {
            throw new Error("Devin API key not found. Configure it via one of:\n" +
                "  1. MCP client env: { \"DEVIN_API_KEY\": \"<key>\" }\n" +
                "  2. File: ~/.devin/api_key or set DEVIN_API_KEY_FILE=/path/to/key\n" +
                "  3. Devin Desktop config: ~/.codeium/windsurf/mcp_config.json\n" +
                "  4. Environment variable: DEVIN_API_KEY\n" +
                "Get your key from https://app.devin.ai/settings/api-keys");
        }
        const apiVersion = this.detectApiVersion(apiKey);
        const orgId = config?.orgId
            ?? process.env.DEVIN_ORG_ID
            ?? this.resolveOrgIdFromDevinDesktopConfig();
        const baseUrl = config?.baseUrl
            ?? process.env.DEVIN_API_BASE_URL
            ?? (apiVersion === "v3" ? "https://api.devin.ai" : "https://api.devin.ai");
        const pollIntervalMs = config?.pollIntervalMs
            ?? (process.env.POLL_INTERVAL_MS
                ? parseInt(process.env.POLL_INTERVAL_MS, 10)
                : 5000);
        return { apiKey, apiVersion, baseUrl, orgId, pollIntervalMs };
    }
    /**
     * Detect API version from key prefix.
     * cog_ → v3 (service user, recommended)
     * apk_ / apk_user_ → v1 (legacy, deprecated)
     */
    static detectApiVersion(key) {
        if (key.startsWith("cog_"))
            return "v3";
        if (key.startsWith("apk_"))
            return "v1";
        // Default to v1 for unknown prefixes (backward compat)
        return "v1";
    }
    // --- Source 1: Environment Variables ---------------------------------------
    static resolveApiKeyFromEnv() {
        return process.env.DEVIN_API_KEY;
    }
    // --- Source 2: File-based --------------------------------------------------
    static resolveApiKeyFromFile() {
        // Check DEVIN_API_KEY_FILE env var first
        const envFilePath = process.env.DEVIN_API_KEY_FILE;
        if (envFilePath && existsSync(envFilePath)) {
            try {
                return readFileSync(envFilePath, "utf-8").trim();
            }
            catch {
                // Fall through
            }
        }
        // Check ~/.devin/api_key
        const defaultPath = join(homedir(), ".devin", "api_key");
        if (existsSync(defaultPath)) {
            try {
                return readFileSync(defaultPath, "utf-8").trim();
            }
            catch {
                // Fall through
            }
        }
        return undefined;
    }
    // --- Source 3: Devin Desktop (ex-Windsurf) config --------------------------
    static resolveApiKeyFromDevinDesktopConfig() {
        const configPath = this.getDevinDesktopConfigPath();
        if (!configPath || !existsSync(configPath))
            return undefined;
        try {
            const raw = readFileSync(configPath, "utf-8");
            const config = JSON.parse(raw);
            // Look for our server in mcpServers
            const servers = config.mcpServers ?? {};
            const ourServer = servers["multi-agent-devin"] ?? servers["multi-agent-devin"];
            if (ourServer?.env?.DEVIN_API_KEY) {
                return this.interpolateValue(ourServer.env.DEVIN_API_KEY);
            }
            // Also check if the Devin MCP server itself has a key we can reuse
            const devinServer = servers["devin"];
            if (devinServer?.headers?.Authorization) {
                const auth = devinServer.headers.Authorization;
                if (auth.startsWith("Bearer ")) {
                    return auth.slice(7).trim();
                }
            }
        }
        catch {
            // Fall through
        }
        return undefined;
    }
    static resolveOrgIdFromDevinDesktopConfig() {
        const configPath = this.getDevinDesktopConfigPath();
        if (!configPath || !existsSync(configPath))
            return undefined;
        try {
            const raw = readFileSync(configPath, "utf-8");
            const config = JSON.parse(raw);
            const servers = config.mcpServers ?? {};
            const devinServer = servers["devin"];
            if (devinServer?.headers?.["X-Org-Id"]) {
                return this.interpolateValue(devinServer.headers["X-Org-Id"]);
            }
            const ourServer = servers["multi-agent-devin"];
            if (ourServer?.env?.DEVIN_ORG_ID) {
                return this.interpolateValue(ourServer.env.DEVIN_ORG_ID);
            }
        }
        catch {
            // Fall through
        }
        return undefined;
    }
    static getDevinDesktopConfigPath() {
        // Check env override first
        if (process.env.DEVIN_DESKTOP_CONFIG_PATH) {
            return process.env.DEVIN_DESKTOP_CONFIG_PATH;
        }
        // Platform-specific paths
        const home = homedir();
        const platform = process.platform;
        if (platform === "win32") {
            // Windows: C:\Users\<user>\AppData\Roaming\Windsurf
            // or C:\Users\<user>\.codeium\windsurf
            const paths = [
                join(home, "AppData", "Roaming", "Windsurf", "mcp_config.json"),
                join(home, ".codeium", "windsurf", "mcp_config.json"),
            ];
            for (const p of paths) {
                if (existsSync(p))
                    return p;
            }
        }
        else if (platform === "darwin") {
            // macOS: ~/.codeium/windsurf/mcp_config.json
            const p = join(home, ".codeium", "windsurf", "mcp_config.json");
            if (existsSync(p))
                return p;
        }
        else {
            // Linux: ~/.codeium/windsurf/mcp_config.json
            const p = join(home, ".codeium", "windsurf", "mcp_config.json");
            if (existsSync(p))
                return p;
        }
        return null;
    }
    // --- MCP Config Interpolation ---------------------------------------------
    /**
     * Resolve ${env:VAR_NAME} and ${file:/path/to/file} interpolation patterns
     * used by Devin Desktop's mcp_config.json.
     */
    static interpolateValue(value) {
        // ${env:VAR_NAME}
        let result = value.replace(/\$\{env:([^}]+)\}/g, (_, varName) => {
            return process.env[varName] ?? "";
        });
        // ${file:/path/to/file} or ${file:~/path/to/file}
        result = result.replace(/\$\{file:([^}]+)\}/g, (_, filePath) => {
            let p = filePath;
            if (p.startsWith("~/")) {
                p = join(homedir(), p.slice(2));
            }
            try {
                if (existsSync(p)) {
                    return readFileSync(p, "utf-8").trim();
                }
            }
            catch {
                // Leave unchanged
            }
            return p;
        });
        return result;
    }
    // --- Validation ------------------------------------------------------------
    static validate(config) {
        if (!config.apiKey) {
            throw new Error("Devin API key is required but not set.");
        }
        const validPrefixes = ["cog_", "apk_", "apk_user_"];
        const hasValidPrefix = validPrefixes.some((p) => config.apiKey.startsWith(p));
        if (!hasValidPrefix) {
            console.warn("[Auth] API key does not start with a known prefix (cog_, apk_, apk_user_). " +
                "It may not work with the Devin API.");
        }
        if (config.apiVersion === "v3" && !config.orgId) {
            console.warn("[Auth] v3 API key detected (cog_) but no DEVIN_ORG_ID set. " +
                "Enterprise accounts may require X-Org-Id header. " +
                "Set DEVIN_ORG_ID or add X-Org-Id to your Devin Desktop MCP config.");
        }
    }
}
//# sourceMappingURL=auth.js.map