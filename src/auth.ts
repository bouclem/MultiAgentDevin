// ============================================================================
// MultiAgentDevin — Auth Manager (v1.1.0)
// ============================================================================
// Multi-source authentication: MCP config interpolation, file-based,
// environment variables, Devin Desktop native config.
// ============================================================================

import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";
import { Buffer } from "buffer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApiVersion = "v1" | "v3";

export interface AuthConfig {
  apiKey: string;
  apiVersion: ApiVersion;
  baseUrl: string;
  orgId?: string;
  pollIntervalMs: number;
}

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
  static resolve(config?: {
    apiKey?: string;
    baseUrl?: string;
    orgId?: string;
    pollIntervalMs?: number;
  }): AuthConfig {
    const apiKey = config?.apiKey
      ?? this.resolveApiKeyFromEnv()
      ?? this.resolveApiKeyFromFile()
      ?? this.resolveApiKeyFromDevinDesktopConfig();

    if (!apiKey) {
      throw new Error(
        "Devin API key not found. Configure it via one of:\n" +
        "  1. MCP client env: { \"DEVIN_API_KEY\": \"<key>\" }\n" +
        "  2. File: ~/.devin/api_key or set DEVIN_API_KEY_FILE=/path/to/key\n" +
        "  3. Devin Desktop config: ~/.codeium/windsurf/mcp_config.json\n" +
        "  4. Environment variable: DEVIN_API_KEY\n" +
        "Get your key from https://app.devin.ai/settings/api-keys"
      );
    }

    const apiVersion = this.detectApiVersion(apiKey);
    const orgId = config?.orgId
      ?? (process.env.DEVIN_ORG_ID ? this.interpolateValue(process.env.DEVIN_ORG_ID) : undefined)
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
  static detectApiVersion(key: string): ApiVersion {
    if (key.startsWith("cog_")) return "v3";
    if (key.startsWith("apk_")) return "v1";
    // Default to v1 for unknown prefixes (backward compat)
    return "v1";
  }

  // --- Source 1: Environment Variables ---------------------------------------

  private static resolveApiKeyFromEnv(): string | undefined {
    const raw = process.env.DEVIN_API_KEY;
    if (!raw) return undefined;
    // MCP clients may pass interpolation patterns like ${file:~/.devin/api_key}
    // or ${env:DEVIN_API_KEY} — resolve them.
    return this.interpolateValue(raw);
  }

  // --- Source 2: File-based --------------------------------------------------

  private static resolveApiKeyFromFile(): string | undefined {
    // Check DEVIN_API_KEY_FILE env var first
    const envFilePath = process.env.DEVIN_API_KEY_FILE;
    if (envFilePath) {
      const key = this.readKeyFile(envFilePath);
      if (key) return key;
    }

    // Check ~/.devin/api_key
    const defaultPath = join(homedir(), ".devin", "api_key");
    return this.readKeyFile(defaultPath);
  }

  /**
   * Read a key file and clean its content.
   * Handles UTF-8, UTF-16 LE/BE (PowerShell echo), BOM, null bytes, quotes.
   */
  private static readKeyFile(filePath: string): string | undefined {
    if (!existsSync(filePath)) return undefined;
    try {
      const buf = readFileSync(filePath);
      let str: string;

      // Detect UTF-16 LE (BOM: FF FE) or UTF-16 BE (BOM: FE FF)
      if (buf.length >= 2) {
        if (buf[0] === 0xff && buf[1] === 0xfe) {
          // UTF-16 LE
          str = buf.slice(2).toString("utf16le");
        } else if (buf[0] === 0xfe && buf[1] === 0xff) {
          // UTF-16 BE
          str = buf.slice(2).toString("utf16le").split("").reverse().join("");
        } else {
          // UTF-8 (possibly with BOM)
          str = buf.toString("utf-8");
        }
      } else {
        str = buf.toString("utf-8");
      }

      return this.cleanKey(str);
    } catch {
      return undefined;
    }
  }

  /**
   * Clean a key string: strip BOM, null bytes, whitespace, surrounding quotes.
   */
  private static cleanKey(raw: string): string {
    return raw
      .replace(/\uFEFF/g, "")     // BOM
      .replace(/\0/g, "")          // null bytes
      .replace(/^["']|["']$/g, "") // surrounding quotes
      .trim();
  }

  // --- Source 3: Devin Desktop (ex-Windsurf) config --------------------------

  private static resolveApiKeyFromDevinDesktopConfig(): string | undefined {
    const configPath = this.getDevinDesktopConfigPath();
    if (!configPath || !existsSync(configPath)) return undefined;

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
        const auth = devinServer.headers.Authorization as string;
        if (auth.startsWith("Bearer ")) {
          return auth.slice(7).trim();
        }
      }
    } catch {
      // Fall through
    }

    return undefined;
  }

  private static resolveOrgIdFromDevinDesktopConfig(): string | undefined {
    const configPath = this.getDevinDesktopConfigPath();
    if (!configPath || !existsSync(configPath)) return undefined;

    try {
      const raw = readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);

      const servers = config.mcpServers ?? {};
      const devinServer = servers["devin"];
      if (devinServer?.headers?.["X-Org-Id"]) {
        return this.interpolateValue(devinServer.headers["X-Org-Id"] as string);
      }

      const ourServer = servers["multi-agent-devin"];
      if (ourServer?.env?.DEVIN_ORG_ID) {
        return this.interpolateValue(ourServer.env.DEVIN_ORG_ID);
      }
    } catch {
      // Fall through
    }

    return undefined;
  }

  private static getDevinDesktopConfigPath(): string | null {
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
        if (existsSync(p)) return p;
      }
    } else if (platform === "darwin") {
      // macOS: ~/.codeium/windsurf/mcp_config.json
      const p = join(home, ".codeium", "windsurf", "mcp_config.json");
      if (existsSync(p)) return p;
    } else {
      // Linux: ~/.codeium/windsurf/mcp_config.json
      const p = join(home, ".codeium", "windsurf", "mcp_config.json");
      if (existsSync(p)) return p;
    }

    return null;
  }

  // --- MCP Config Interpolation ---------------------------------------------

  /**
   * Resolve ${env:VAR_NAME} and ${file:/path/to/file} interpolation patterns
   * used by Devin Desktop's mcp_config.json.
   */
  private static interpolateValue(value: string): string {
    // ${env:VAR_NAME}
    let result = value.replace(/\$\{env:([^}]+)\}/g, (_, varName: string) => {
      return process.env[varName] ?? "";
    });

    // ${file:/path/to/file} or ${file:~/path/to/file}
    result = result.replace(/\$\{file:([^}]+)\}/g, (_, filePath: string) => {
      let p = filePath;
      if (p.startsWith("~/")) {
        p = join(homedir(), p.slice(2));
      }
      const key = this.readKeyFile(p);
      return key ?? p;
    });

    return result;
  }

  // --- Validation ------------------------------------------------------------

  static validate(config: AuthConfig): void {
    if (!config.apiKey) {
      throw new Error("Devin API key is required but not set.");
    }

    const validPrefixes = ["cog_", "apk_", "apk_user_"];
    const hasValidPrefix = validPrefixes.some((p) => config.apiKey.startsWith(p));
    if (!hasValidPrefix) {
      console.warn(
        "[Auth] API key does not start with a known prefix (cog_, apk_, apk_user_). " +
        "It may not work with the Devin API."
      );
    }

    if (config.apiVersion === "v3" && !config.orgId) {
      console.warn(
        "[Auth] v3 API key detected (cog_) but no DEVIN_ORG_ID set. " +
        "Enterprise accounts may require X-Org-Id header. " +
        "Set DEVIN_ORG_ID or add X-Org-Id to your Devin Desktop MCP config."
      );
    }
  }
}
