import type { AgentRole } from "./types.js";
export interface RoleDefinition {
    role: AgentRole;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    color: string;
}
export declare const ROLE_DEFINITIONS: Record<string, RoleDefinition>;
export declare function getRoleDefinition(role: AgentRole): RoleDefinition;
export declare function getRolePrompt(role: AgentRole, customPrompt?: string): string;
export declare function getAllRoleNames(): {
    role: AgentRole;
    name: string;
}[];
export declare function buildAgentPrompt(role: AgentRole, task: string, context?: string, customPrompt?: string): string;
export declare const STRUCTURED_OUTPUT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly summary: {
            readonly type: "string";
            readonly description: "Brief summary of what was accomplished";
        };
        readonly score: {
            readonly type: "number";
            readonly description: "Quality score 0-100 (if evaluating)";
        };
        readonly files_changed: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "List of files that were created or modified";
        };
        readonly issues_found: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly severity: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly file: {
                        readonly type: "string";
                    };
                };
            };
            readonly description: "Issues found (if reviewing)";
        };
        readonly recommendations: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Recommendations for improvement";
        };
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["in_progress", "completed", "blocked", "failed"];
            readonly description: "Current status of this agent's work";
        };
        readonly benchmark: {
            readonly type: "object";
            readonly description: "Benchmark results (required for AI specialist roles)";
            readonly properties: {
                readonly benchmark_type: {
                    readonly type: "string";
                };
                readonly before: {
                    readonly type: "object";
                    readonly description: "Metric values before optimization";
                    readonly additionalProperties: {
                        readonly type: "number";
                    };
                };
                readonly after: {
                    readonly type: "object";
                    readonly description: "Metric values after optimization";
                    readonly additionalProperties: {
                        readonly type: "number";
                    };
                };
                readonly improvement_percent: {
                    readonly type: "object";
                    readonly description: "Percentage improvement per metric";
                    readonly additionalProperties: {
                        readonly type: "number";
                    };
                };
                readonly metrics: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: "number";
                            };
                            readonly unit: {
                                readonly type: "string";
                            };
                            readonly higher_is_better: {
                                readonly type: "boolean";
                            };
                        };
                    };
                };
            };
        };
    };
    readonly required: readonly ["summary", "status"];
};
export declare const BENCHMARK_REQUIRED_ROLES: AgentRole[];
export declare function requiresBenchmarking(role: AgentRole): boolean;
//# sourceMappingURL=roles.d.ts.map