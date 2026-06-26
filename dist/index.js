#!/usr/bin/env node
// ============================================================================
// MultiAgentDevin — MCP Server Entry Point
// ============================================================================
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./tools/definitions.js";
import { createDevinClient } from "./devin-client.js";
import { Orchestrator } from "./orchestrator.js";
import { TemplateManager } from "./templates.js";
import { DashboardServer } from "./dashboard/server.js";
// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------
const server = new Server({
    name: "multi-agent-devin",
    version: "1.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// ---------------------------------------------------------------------------
// Initialize Components
// ---------------------------------------------------------------------------
let orchestrator;
let templateManager;
let dashboardServer = null;
function initialize() {
    const client = createDevinClient();
    orchestrator = new Orchestrator(client);
    templateManager = new TemplateManager();
    templateManager.initializePresets();
    // Start dashboard if enabled
    const dashboardEnabled = process.env.DASHBOARD_ENABLED !== "false";
    if (dashboardEnabled) {
        const port = process.env.DASHBOARD_PORT
            ? parseInt(process.env.DASHBOARD_PORT, 10)
            : 3456;
        dashboardServer = new DashboardServer(port);
        dashboardServer.start().catch((err) => {
            console.error("[Dashboard] Failed to start:", err);
        });
    }
}
// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------
async function handleToolCall(name, args) {
    try {
        switch (name) {
            case "multi_agent_collaborate":
                return await handleMultiAgentCollaborate(args);
            case "create_agent_team":
                return await handleCreateAgentTeam(args);
            case "agent_debate":
                return await handleAgentDebate(args);
            case "parallel_code_review":
                return await handleParallelCodeReview(args);
            case "iterative_improve":
                return await handleIterativeImprove(args);
            case "tournament":
                return await handleTournament(args);
            case "swarm_solve":
                return await handleSwarmSolve(args);
            case "get_team_status":
                return await handleGetTeamStatus(args);
            case "save_pattern_template":
                return await handleSavePatternTemplate(args);
            case "run_pattern_template":
                return await handleRunPatternTemplate(args);
            default:
                return {
                    content: [
                        { type: "text", text: `Unknown tool: ${name}` },
                    ],
                };
        }
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
            content: [
                { type: "text", text: `Error: ${msg}` },
            ],
        };
    }
}
// --- multi_agent_collaborate ------------------------------------------------
async function handleMultiAgentCollaborate(args) {
    const config = {
        pattern: args.pattern,
        task: args.task,
        numWorkers: args.numWorkers,
        numRounds: args.numRounds,
        specialistRoles: args.specialistRoles,
        repos: args.repos,
        playbookId: args.playbookId,
        maxAcuLimit: args.maxAcuLimit,
        useBinaryTreeBranching: args.useBinaryTreeBranching,
        branchingStrategy: args.branchingStrategy,
        recycleEliminatedAgents: args.recycleEliminatedAgents,
        qualityThreshold: args.qualityThreshold,
        enableBenchmarking: args.enableBenchmarking,
        customRolePrompts: args.customRolePrompts,
        dashboardEnabled: true,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    bestSessionId: result.bestSessionId,
                    bestBranchId: result.bestBranchId,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions.map((s) => ({
                        agentId: s.agentId,
                        score: s.score,
                        summary: s.summary,
                        sessionId: s.sessionId,
                        branchId: s.branchId,
                        prUrl: s.prUrl,
                    })),
                }, null, 2),
            },
        ],
    };
}
// --- create_agent_team ------------------------------------------------------
async function handleCreateAgentTeam(args) {
    const roles = args.roles;
    const task = args.task;
    const config = {
        pattern: "parallel",
        task,
        specialistRoles: roles.map((r) => r.role),
        customRolePrompts: Object.fromEntries(roles
            .filter((r) => r.customPrompt)
            .map((r) => [r.role, r.customPrompt])),
        repos: args.repos,
        playbookId: args.playbookId,
        maxAcuLimit: args.maxAcuLimit,
        useBinaryTreeBranching: true,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// --- agent_debate -----------------------------------------------------------
async function handleAgentDebate(args) {
    const config = {
        pattern: "debate",
        task: args.task,
        specialistRoles: args.roles,
        repos: args.repos,
        maxAcuLimit: args.maxAcuLimit,
        useBinaryTreeBranching: args.useBinaryTreeBranching,
        branchingStrategy: args.branchingStrategy,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    bestSessionId: result.bestSessionId,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// --- parallel_code_review ---------------------------------------------------
async function handleParallelCodeReview(args) {
    const config = {
        pattern: "debate",
        task: args.task,
        specialistRoles: args.specialistRoles ?? [
            "security",
            "performance",
            "architecture",
            "testing",
            "devops",
        ],
        repos: args.repos,
        maxAcuLimit: args.maxAcuLimit,
        useBinaryTreeBranching: false,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    allSolutions: result.allSolutions,
                    metrics: result.metrics,
                }, null, 2),
            },
        ],
    };
}
// --- iterative_improve ------------------------------------------------------
async function handleIterativeImprove(args) {
    const config = {
        pattern: "iterative",
        task: args.task,
        numRounds: args.maxRounds,
        qualityThreshold: args.qualityThreshold,
        repos: args.repos,
        maxAcuLimit: args.maxAcuLimit,
        useBinaryTreeBranching: args.useBinaryTreeBranching,
        branchingStrategy: args.branchingStrategy,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// --- tournament -------------------------------------------------------------
async function handleTournament(args) {
    const config = {
        pattern: "tournament",
        task: args.task,
        numWorkers: args.numAgents,
        numRounds: args.numRounds,
        recycleEliminatedAgents: args.recycleEliminatedAgents,
        useBinaryTreeBranching: args.useBinaryTreeBranching,
        branchingStrategy: args.branchingStrategy,
        repos: args.repos,
        maxAcuLimit: args.maxAcuLimit,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    bestSessionId: result.bestSessionId,
                    bestBranchId: result.bestBranchId,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// --- swarm_solve ------------------------------------------------------------
async function handleSwarmSolve(args) {
    const config = {
        pattern: "swarm",
        task: args.task,
        numWorkers: args.initialAgents,
        numRounds: args.maxDepth,
        maxAcuLimit: args.maxTotalAgents,
        useBinaryTreeBranching: args.useBinaryTreeBranching,
        branchingStrategy: args.branchingStrategy,
        recycleEliminatedAgents: args.recycleEliminatedAgents,
        repos: args.repos,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    bestSessionId: result.bestSessionId,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// --- get_team_status --------------------------------------------------------
async function handleGetTeamStatus(args) {
    const collaborationId = args.collaborationId;
    const status = orchestrator.getStatus(collaborationId);
    if (!status) {
        return {
            content: [
                { type: "text", text: `Collaboration ${collaborationId} not found` },
            ],
        };
    }
    return {
        content: [
            { type: "text", text: JSON.stringify(status, null, 2) },
        ],
    };
}
// --- save_pattern_template --------------------------------------------------
async function handleSavePatternTemplate(args) {
    const template = templateManager.saveTemplate(args.name, args.description, args.pattern, args.config ?? {});
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    pattern: template.pattern,
                    config: template.config,
                }, null, 2),
            },
        ],
    };
}
// --- run_pattern_template ---------------------------------------------------
async function handleRunPatternTemplate(args) {
    const templateId = args.templateId;
    const template = templateManager.getTemplate(templateId);
    if (!template) {
        return {
            content: [
                { type: "text", text: `Template ${templateId} not found` },
            ],
        };
    }
    const overrides = args.overrides ?? {};
    const config = {
        pattern: template.pattern,
        task: args.task,
        ...template.config,
        repos: args.repos ?? template.config.repos,
        numWorkers: overrides.numWorkers ?? template.config.numWorkers,
        numRounds: overrides.numRounds ?? template.config.numRounds,
        maxAcuLimit: overrides.maxAcuLimit ?? template.config.maxAcuLimit,
    };
    const result = await orchestrator.execute(config);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    template: template.name,
                    summary: result.summary,
                    bestSolution: result.bestSolution,
                    metrics: result.metrics,
                    allSolutions: result.allSolutions,
                }, null, 2),
            },
        ],
    };
}
// ---------------------------------------------------------------------------
// MCP Server Handlers
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOL_DEFINITIONS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args ?? {});
});
// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
async function main() {
    initialize();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MultiAgentDevin] MCP server started");
    console.error("[MultiAgentDevin] Dashboard: http://localhost:3456");
    console.error("[MultiAgentDevin] Tools available: " + TOOL_DEFINITIONS.map((t) => t.name).join(", "));
}
main().catch((error) => {
    console.error("[MultiAgentDevin] Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map