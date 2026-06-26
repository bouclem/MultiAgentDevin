import { z } from "zod";
export declare const multiAgentCollaborateSchema: z.ZodObject<{
    task: z.ZodString;
    pattern: z.ZodEnum<["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"]>;
    numWorkers: z.ZodOptional<z.ZodNumber>;
    numRounds: z.ZodOptional<z.ZodNumber>;
    specialistRoles: z.ZodOptional<z.ZodArray<z.ZodEnum<["coordinator", "worker", "reviewer", "security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"]>, "many">>;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    playbookId: z.ZodOptional<z.ZodString>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
    useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
    branchingStrategy: z.ZodOptional<z.ZodEnum<["binary-tree", "linear"]>>;
    recycleEliminatedAgents: z.ZodOptional<z.ZodBoolean>;
    qualityThreshold: z.ZodOptional<z.ZodNumber>;
    enableBenchmarking: z.ZodOptional<z.ZodBoolean>;
    customRolePrompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    task: string;
    pattern: "parallel" | "debate" | "pipeline" | "iterative" | "tournament" | "swarm";
    numWorkers?: number | undefined;
    numRounds?: number | undefined;
    specialistRoles?: ("coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom")[] | undefined;
    repos?: string[] | undefined;
    playbookId?: string | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    qualityThreshold?: number | undefined;
    customRolePrompts?: Record<string, string> | undefined;
    enableBenchmarking?: boolean | undefined;
}, {
    task: string;
    pattern: "parallel" | "debate" | "pipeline" | "iterative" | "tournament" | "swarm";
    numWorkers?: number | undefined;
    numRounds?: number | undefined;
    specialistRoles?: ("coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom")[] | undefined;
    repos?: string[] | undefined;
    playbookId?: string | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    qualityThreshold?: number | undefined;
    customRolePrompts?: Record<string, string> | undefined;
    enableBenchmarking?: boolean | undefined;
}>;
export declare const createAgentTeamSchema: z.ZodObject<{
    task: z.ZodString;
    roles: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["coordinator", "worker", "reviewer", "security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"]>;
        customPrompt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        role: "coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom";
        customPrompt?: string | undefined;
    }, {
        role: "coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom";
        customPrompt?: string | undefined;
    }>, "many">;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    playbookId: z.ZodOptional<z.ZodString>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    roles: {
        role: "coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom";
        customPrompt?: string | undefined;
    }[];
    repos?: string[] | undefined;
    playbookId?: string | undefined;
    maxAcuLimit?: number | undefined;
}, {
    task: string;
    roles: {
        role: "coordinator" | "worker" | "reviewer" | "security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom";
        customPrompt?: string | undefined;
    }[];
    repos?: string[] | undefined;
    playbookId?: string | undefined;
    maxAcuLimit?: number | undefined;
}>;
export declare const agentDebateSchema: z.ZodObject<{
    task: z.ZodString;
    roles: z.ZodOptional<z.ZodArray<z.ZodEnum<["security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"]>, "many">>;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
    useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
    branchingStrategy: z.ZodOptional<z.ZodEnum<["binary-tree", "linear"]>>;
}, "strip", z.ZodTypeAny, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    roles?: ("security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom")[] | undefined;
}, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    roles?: ("security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist" | "custom")[] | undefined;
}>;
export declare const parallelCodeReviewSchema: z.ZodObject<{
    task: z.ZodString;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specialistRoles: z.ZodOptional<z.ZodArray<z.ZodEnum<["security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist"]>, "many">>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    specialistRoles?: ("security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist")[] | undefined;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
}, {
    task: string;
    specialistRoles?: ("security" | "performance" | "architecture" | "testing" | "devops" | "researcher" | "inference-optimizer" | "training-optimizer" | "data-scientist" | "ml-engineer" | "prompt-engineer" | "api-designer" | "database-optimizer" | "frontend-specialist" | "backend-specialist" | "mobile-specialist")[] | undefined;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
}>;
export declare const iterativeImproveSchema: z.ZodObject<{
    task: z.ZodString;
    maxRounds: z.ZodOptional<z.ZodNumber>;
    qualityThreshold: z.ZodOptional<z.ZodNumber>;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
    useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    qualityThreshold?: number | undefined;
    maxRounds?: number | undefined;
}, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    qualityThreshold?: number | undefined;
    maxRounds?: number | undefined;
}>;
export declare const tournamentSchema: z.ZodObject<{
    task: z.ZodString;
    numAgents: z.ZodOptional<z.ZodNumber>;
    numRounds: z.ZodOptional<z.ZodNumber>;
    recycleEliminatedAgents: z.ZodOptional<z.ZodBoolean>;
    useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
    branchingStrategy: z.ZodOptional<z.ZodEnum<["binary-tree", "linear"]>>;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    numRounds?: number | undefined;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    numAgents?: number | undefined;
}, {
    task: string;
    numRounds?: number | undefined;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    numAgents?: number | undefined;
}>;
export declare const swarmSolveSchema: z.ZodObject<{
    task: z.ZodString;
    initialAgents: z.ZodOptional<z.ZodNumber>;
    maxDepth: z.ZodOptional<z.ZodNumber>;
    maxTotalAgents: z.ZodOptional<z.ZodNumber>;
    useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
    branchingStrategy: z.ZodOptional<z.ZodEnum<["binary-tree", "linear"]>>;
    recycleEliminatedAgents: z.ZodOptional<z.ZodBoolean>;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxAcuLimit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    initialAgents?: number | undefined;
    maxDepth?: number | undefined;
    maxTotalAgents?: number | undefined;
}, {
    task: string;
    repos?: string[] | undefined;
    maxAcuLimit?: number | undefined;
    useBinaryTreeBranching?: boolean | undefined;
    branchingStrategy?: "binary-tree" | "linear" | undefined;
    recycleEliminatedAgents?: boolean | undefined;
    initialAgents?: number | undefined;
    maxDepth?: number | undefined;
    maxTotalAgents?: number | undefined;
}>;
export declare const getTeamStatusSchema: z.ZodObject<{
    collaborationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    collaborationId: string;
}, {
    collaborationId: string;
}>;
export declare const savePatternTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    pattern: z.ZodEnum<["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"]>;
    config: z.ZodOptional<z.ZodObject<{
        numWorkers: z.ZodOptional<z.ZodNumber>;
        numRounds: z.ZodOptional<z.ZodNumber>;
        specialistRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        maxAcuLimit: z.ZodOptional<z.ZodNumber>;
        useBinaryTreeBranching: z.ZodOptional<z.ZodBoolean>;
        branchingStrategy: z.ZodOptional<z.ZodEnum<["binary-tree", "linear"]>>;
        recycleEliminatedAgents: z.ZodOptional<z.ZodBoolean>;
        qualityThreshold: z.ZodOptional<z.ZodNumber>;
        enableBenchmarking: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        specialistRoles?: string[] | undefined;
        maxAcuLimit?: number | undefined;
        useBinaryTreeBranching?: boolean | undefined;
        branchingStrategy?: "binary-tree" | "linear" | undefined;
        recycleEliminatedAgents?: boolean | undefined;
        qualityThreshold?: number | undefined;
        enableBenchmarking?: boolean | undefined;
    }, {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        specialistRoles?: string[] | undefined;
        maxAcuLimit?: number | undefined;
        useBinaryTreeBranching?: boolean | undefined;
        branchingStrategy?: "binary-tree" | "linear" | undefined;
        recycleEliminatedAgents?: boolean | undefined;
        qualityThreshold?: number | undefined;
        enableBenchmarking?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    pattern: "parallel" | "debate" | "pipeline" | "iterative" | "tournament" | "swarm";
    name: string;
    description: string;
    config?: {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        specialistRoles?: string[] | undefined;
        maxAcuLimit?: number | undefined;
        useBinaryTreeBranching?: boolean | undefined;
        branchingStrategy?: "binary-tree" | "linear" | undefined;
        recycleEliminatedAgents?: boolean | undefined;
        qualityThreshold?: number | undefined;
        enableBenchmarking?: boolean | undefined;
    } | undefined;
}, {
    pattern: "parallel" | "debate" | "pipeline" | "iterative" | "tournament" | "swarm";
    name: string;
    description: string;
    config?: {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        specialistRoles?: string[] | undefined;
        maxAcuLimit?: number | undefined;
        useBinaryTreeBranching?: boolean | undefined;
        branchingStrategy?: "binary-tree" | "linear" | undefined;
        recycleEliminatedAgents?: boolean | undefined;
        qualityThreshold?: number | undefined;
        enableBenchmarking?: boolean | undefined;
    } | undefined;
}>;
export declare const runPatternTemplateSchema: z.ZodObject<{
    templateId: z.ZodString;
    task: z.ZodString;
    repos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    overrides: z.ZodOptional<z.ZodObject<{
        numWorkers: z.ZodOptional<z.ZodNumber>;
        numRounds: z.ZodOptional<z.ZodNumber>;
        maxAcuLimit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        maxAcuLimit?: number | undefined;
    }, {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        maxAcuLimit?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    task: string;
    templateId: string;
    repos?: string[] | undefined;
    overrides?: {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        maxAcuLimit?: number | undefined;
    } | undefined;
}, {
    task: string;
    templateId: string;
    repos?: string[] | undefined;
    overrides?: {
        numWorkers?: number | undefined;
        numRounds?: number | undefined;
        maxAcuLimit?: number | undefined;
    } | undefined;
}>;
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export declare const TOOL_DEFINITIONS: ToolDefinition[];
//# sourceMappingURL=definitions.d.ts.map