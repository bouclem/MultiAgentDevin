// ============================================================================
// MultiAgentDevin — MCP Tool Definitions
// ============================================================================
import { z } from "zod";
// ---------------------------------------------------------------------------
// Zod Schemas for Tool Input Validation
// ---------------------------------------------------------------------------
export const multiAgentCollaborateSchema = z.object({
    task: z.string().describe("The task to accomplish using multi-agent collaboration"),
    pattern: z
        .enum(["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"])
        .describe("Collaboration pattern to use"),
    numWorkers: z.number().min(1).max(20).optional().describe("Number of worker agents (default varies by pattern)"),
    numRounds: z.number().min(1).max(10).optional().describe("Number of rounds (for tournament/iterative/swarm)"),
    specialistRoles: z
        .array(z.enum([
        "coordinator",
        "worker",
        "reviewer",
        "security",
        "performance",
        "architecture",
        "testing",
        "devops",
        "researcher",
        "inference-optimizer",
        "training-optimizer",
        "data-scientist",
        "ml-engineer",
        "prompt-engineer",
        "api-designer",
        "database-optimizer",
        "frontend-specialist",
        "backend-specialist",
        "mobile-specialist",
        "custom",
    ]))
        .optional()
        .describe("Specialist roles for agents"),
    repos: z.array(z.string()).optional().describe("Repository URLs for agents to work on"),
    playbookId: z.string().optional().describe("Devin playbook ID to attach to all agents"),
    maxAcuLimit: z.number().min(1).max(100).optional().describe("Max ACU per agent session (default 20)"),
    useBinaryTreeBranching: z.boolean().optional().describe("Use binary tree Git branching strategy (default true)"),
    branchingStrategy: z.enum(["binary-tree", "linear"]).optional().describe("Branching strategy: binary-tree (1→2→4→8) or linear (1→1→1→1, left-to-right)"),
    recycleEliminatedAgents: z.boolean().optional().describe("Recycle eliminated agents to winning branches (default true)"),
    qualityThreshold: z.number().min(0).max(100).optional().describe("Quality threshold for iterative pattern (default 85)"),
    enableBenchmarking: z.boolean().optional().describe("Require AI specialist roles to run benchmarks before/after (default true)"),
    customRolePrompts: z.record(z.string(), z.string()).optional().describe("Custom prompts for custom roles"),
});
export const createAgentTeamSchema = z.object({
    task: z.string().describe("The overall task"),
    roles: z
        .array(z.object({
        role: z.enum([
            "coordinator",
            "worker",
            "reviewer",
            "security",
            "performance",
            "architecture",
            "testing",
            "devops",
            "researcher",
            "inference-optimizer",
            "training-optimizer",
            "data-scientist",
            "ml-engineer",
            "prompt-engineer",
            "api-designer",
            "database-optimizer",
            "frontend-specialist",
            "backend-specialist",
            "mobile-specialist",
            "custom",
        ]),
        customPrompt: z.string().optional(),
    }))
        .describe("Array of agent roles to create"),
    repos: z.array(z.string()).optional(),
    playbookId: z.string().optional(),
    maxAcuLimit: z.number().min(1).max(100).optional(),
});
export const agentDebateSchema = z.object({
    task: z.string().describe("The task for agents to debate"),
    roles: z
        .array(z.enum([
        "security",
        "performance",
        "architecture",
        "testing",
        "devops",
        "researcher",
        "inference-optimizer",
        "training-optimizer",
        "data-scientist",
        "ml-engineer",
        "prompt-engineer",
        "api-designer",
        "database-optimizer",
        "frontend-specialist",
        "backend-specialist",
        "mobile-specialist",
        "custom",
    ]))
        .optional()
        .describe("Specialist roles for debaters (default: security, performance, architecture)"),
    repos: z.array(z.string()).optional(),
    maxAcuLimit: z.number().min(1).max(100).optional(),
    useBinaryTreeBranching: z.boolean().optional(),
    branchingStrategy: z.enum(["binary-tree", "linear"]).optional(),
});
export const parallelCodeReviewSchema = z.object({
    task: z.string().describe("What to review (e.g., 'Review PR #123' or 'Review the authentication module')"),
    repos: z.array(z.string()).optional(),
    specialistRoles: z
        .array(z.enum([
        "security",
        "performance",
        "architecture",
        "testing",
        "devops",
        "researcher",
        "inference-optimizer",
        "training-optimizer",
        "data-scientist",
        "ml-engineer",
        "prompt-engineer",
        "api-designer",
        "database-optimizer",
        "frontend-specialist",
        "backend-specialist",
        "mobile-specialist",
    ]))
        .optional()
        .describe("Review perspectives (default: all specialists)"),
    maxAcuLimit: z.number().min(1).max(100).optional(),
});
export const iterativeImproveSchema = z.object({
    task: z.string().describe("The task to iteratively improve"),
    maxRounds: z.number().min(1).max(10).optional().describe("Max improvement rounds (default 3)"),
    qualityThreshold: z.number().min(0).max(100).optional().describe("Stop when score reaches this (default 85)"),
    repos: z.array(z.string()).optional(),
    maxAcuLimit: z.number().min(1).max(100).optional(),
    useBinaryTreeBranching: z.boolean().optional(),
});
export const tournamentSchema = z.object({
    task: z.string().describe("The task for the tournament"),
    numAgents: z.number().min(2).max(16).optional().describe("Initial number of competing agents (default 8)"),
    numRounds: z.number().min(1).max(5).optional().describe("Tournament rounds (default 3)"),
    recycleEliminatedAgents: z.boolean().optional().describe("Recycle losers to winning branches (default true)"),
    useBinaryTreeBranching: z.boolean().optional().describe("Use binary tree branching (default true)"),
    branchingStrategy: z.enum(["binary-tree", "linear"]).optional().describe("Branching strategy: binary-tree or linear"),
    repos: z.array(z.string()).optional(),
    maxAcuLimit: z.number().min(1).max(100).optional(),
});
export const swarmSolveSchema = z.object({
    task: z.string().describe("The complex task for the swarm to solve"),
    initialAgents: z.number().min(1).max(10).optional().describe("Initial number of agents (default 3)"),
    maxDepth: z.number().min(1).max(5).optional().describe("Maximum swarm depth (default 3)"),
    maxTotalAgents: z.number().min(3).max(30).optional().describe("Maximum total agents (default 20)"),
    useBinaryTreeBranching: z.boolean().optional(),
    branchingStrategy: z.enum(["binary-tree", "linear"]).optional(),
    recycleEliminatedAgents: z.boolean().optional(),
    repos: z.array(z.string()).optional(),
    maxAcuLimit: z.number().min(1).max(100).optional(),
});
export const getTeamStatusSchema = z.object({
    collaborationId: z.string().describe("The collaboration session ID to check"),
});
export const savePatternTemplateSchema = z.object({
    name: z.string().describe("Template name"),
    description: z.string().describe("Template description"),
    pattern: z.enum(["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"]),
    config: z
        .object({
        numWorkers: z.number().optional(),
        numRounds: z.number().optional(),
        specialistRoles: z.array(z.string()).optional(),
        maxAcuLimit: z.number().optional(),
        useBinaryTreeBranching: z.boolean().optional(),
        branchingStrategy: z.enum(["binary-tree", "linear"]).optional(),
        recycleEliminatedAgents: z.boolean().optional(),
        qualityThreshold: z.number().optional(),
        enableBenchmarking: z.boolean().optional(),
    })
        .optional()
        .describe("Default configuration for this template"),
});
export const runPatternTemplateSchema = z.object({
    templateId: z.string().describe("The template ID to run"),
    task: z.string().describe("The task to execute with this template"),
    repos: z.array(z.string()).optional(),
    overrides: z
        .object({
        numWorkers: z.number().optional(),
        numRounds: z.number().optional(),
        maxAcuLimit: z.number().optional(),
    })
        .optional()
        .describe("Override template defaults"),
});
export const TOOL_DEFINITIONS = [
    {
        name: "multi_agent_collaborate",
        description: `Main orchestration tool for multi-agent collaboration. Spawns multiple Devin agents that work together on a task.

Patterns:
- parallel: Coordinator breaks task → N workers solve in parallel → reviewer merges
- debate: N specialists solve independently → reviewer picks best
- pipeline: Sequential stages (e.g., architecture → code → test → security)
- iterative: Worker → reviewer → improve loop until quality threshold
- tournament: Agents compete in elimination rounds, losers recycled to winning branches
- swarm: Self-organizing agents that dynamically spawn sub-agents

Features:
- Binary tree Git branching (1→2→4→8 branches)
- Specialist roles (security, performance, architecture, etc.)
- Agent recycling for tournament mode
- Real-time dashboard at http://localhost:3456

Inspired by Thom Wolf's 100+ agent collaboration experiment (https://x.com/Thom_Wolf/status/2070134136304517284).`,
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string", description: "The task to accomplish" },
                pattern: {
                    type: "string",
                    enum: ["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"],
                    description: "Collaboration pattern",
                },
                numWorkers: { type: "number", minimum: 1, maximum: 20 },
                numRounds: { type: "number", minimum: 1, maximum: 10 },
                specialistRoles: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["coordinator", "worker", "reviewer", "security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"],
                    },
                },
                repos: { type: "array", items: { type: "string" } },
                playbookId: { type: "string" },
                maxAcuLimit: { type: "number", minimum: 1, maximum: 100 },
                useBinaryTreeBranching: { type: "boolean" },
                branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
                recycleEliminatedAgents: { type: "boolean" },
                qualityThreshold: { type: "number", minimum: 0, maximum: 100 },
                enableBenchmarking: { type: "boolean" },
                customRolePrompts: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["task", "pattern"],
        },
    },
    {
        name: "create_agent_team",
        description: "Create a team of agents with specific specialist roles. Returns a team configuration that can be used with multi_agent_collaborate.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                roles: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            role: { type: "string", enum: ["coordinator", "worker", "reviewer", "security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"] },
                            customPrompt: { type: "string" },
                        },
                    },
                },
                repos: { type: "array", items: { type: "string" } },
                playbookId: { type: "string" },
                maxAcuLimit: { type: "number" },
            },
            required: ["task", "roles"],
        },
    },
    {
        name: "agent_debate",
        description: "Multiple specialist agents solve the same problem independently. A reviewer then compares and selects the best solution. Great for getting diverse perspectives.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                roles: {
                    type: "array",
                    items: { type: "string", enum: ["security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist", "custom"] },
                },
                repos: { type: "array", items: { type: "string" } },
                maxAcuLimit: { type: "number" },
                useBinaryTreeBranching: { type: "boolean" },
                branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
            },
            required: ["task"],
        },
    },
    {
        name: "parallel_code_review",
        description: "Run multiple specialist reviewers (security, performance, architecture, testing, devops) on code in parallel. Each reviews from their expertise angle.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                repos: { type: "array", items: { type: "string" } },
                specialistRoles: {
                    type: "array",
                    items: { type: "string", enum: ["security", "performance", "architecture", "testing", "devops", "researcher", "inference-optimizer", "training-optimizer", "data-scientist", "ml-engineer", "prompt-engineer", "api-designer", "database-optimizer", "frontend-specialist", "backend-specialist", "mobile-specialist"] },
                },
                maxAcuLimit: { type: "number" },
            },
            required: ["task"],
        },
    },
    {
        name: "iterative_improve",
        description: "Iterative refinement loop: a worker writes code, a reviewer critiques it, the worker improves. Repeats until quality threshold is met or max rounds reached.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                maxRounds: { type: "number", minimum: 1, maximum: 10 },
                qualityThreshold: { type: "number", minimum: 0, maximum: 100 },
                repos: { type: "array", items: { type: "string" } },
                maxAcuLimit: { type: "number" },
                useBinaryTreeBranching: { type: "boolean" },
                branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
            },
            required: ["task"],
        },
    },
    {
        name: "tournament",
        description: "Agents compete in elimination rounds. Losers are recycled to work on winning branches (binary tree branching). Inspired by 100+ agent collaboration experiments. The winning solution emerges through evolutionary selection.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                numAgents: { type: "number", minimum: 2, maximum: 16 },
                numRounds: { type: "number", minimum: 1, maximum: 5 },
                recycleEliminatedAgents: { type: "boolean" },
                useBinaryTreeBranching: { type: "boolean" },
                branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
                repos: { type: "array", items: { type: "string" } },
                maxAcuLimit: { type: "number" },
            },
            required: ["task"],
        },
    },
    {
        name: "swarm_solve",
        description: "Self-organizing swarm that dynamically spawns sub-agents based on task complexity. Agents assess their own work and spawn children when more work is needed. Binary tree branching by default.",
        inputSchema: {
            type: "object",
            properties: {
                task: { type: "string" },
                initialAgents: { type: "number", minimum: 1, maximum: 10 },
                maxDepth: { type: "number", minimum: 1, maximum: 5 },
                maxTotalAgents: { type: "number", minimum: 3, maximum: 30 },
                useBinaryTreeBranching: { type: "boolean" },
                branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
                recycleEliminatedAgents: { type: "boolean" },
                repos: { type: "array", items: { type: "string" } },
                maxAcuLimit: { type: "number" },
            },
            required: ["task"],
        },
    },
    {
        name: "get_team_status",
        description: "Check the status of all agents in a collaboration session. Returns agent statuses, branch tree, rounds, and progress.",
        inputSchema: {
            type: "object",
            properties: {
                collaborationId: { type: "string" },
            },
            required: ["collaborationId"],
        },
    },
    {
        name: "save_pattern_template",
        description: "Save a collaboration pattern as a reusable template for future tasks.",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                description: { type: "string" },
                pattern: { type: "string", enum: ["parallel", "debate", "pipeline", "iterative", "tournament", "swarm"] },
                config: {
                    type: "object",
                    properties: {
                        numWorkers: { type: "number" },
                        numRounds: { type: "number" },
                        specialistRoles: { type: "array", items: { type: "string" } },
                        maxAcuLimit: { type: "number" },
                        useBinaryTreeBranching: { type: "boolean" },
                        branchingStrategy: { type: "string", enum: ["binary-tree", "linear"] },
                        recycleEliminatedAgents: { type: "boolean" },
                        qualityThreshold: { type: "number" },
                        enableBenchmarking: { type: "boolean" },
                    },
                },
            },
            required: ["name", "description", "pattern"],
        },
    },
    {
        name: "run_pattern_template",
        description: "Execute a previously saved pattern template with a specific task.",
        inputSchema: {
            type: "object",
            properties: {
                templateId: { type: "string" },
                task: { type: "string" },
                repos: { type: "array", items: { type: "string" } },
                overrides: {
                    type: "object",
                    properties: {
                        numWorkers: { type: "number" },
                        numRounds: { type: "number" },
                        maxAcuLimit: { type: "number" },
                    },
                },
            },
            required: ["templateId", "task"],
        },
    },
];
//# sourceMappingURL=definitions.js.map