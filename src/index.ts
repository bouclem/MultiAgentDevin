#!/usr/bin/env node
// ============================================================================
// MultiAgentDevin — MCP Server Entry Point
// ============================================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./tools/definitions.js";
import { createDevinClient } from "./devin-client.js";
import { Orchestrator } from "./orchestrator.js";
import { TemplateManager } from "./templates.js";
import { DashboardServer } from "./dashboard/server.js";
import { globalEmitter } from "./dashboard/events.js";
import type { CollaborationConfig, AgentRole } from "./types.js";

// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: "multi-agent-devin",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ---------------------------------------------------------------------------
// Initialize Components
// ---------------------------------------------------------------------------

let orchestrator: Orchestrator;
let templateManager: TemplateManager;
let dashboardServer: DashboardServer | null = null;

function initialize(): void {
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

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      content: [
        { type: "text", text: `Error: ${msg}` },
      ],
    };
  }
}

// --- multi_agent_collaborate ------------------------------------------------

async function handleMultiAgentCollaborate(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: args.pattern as CollaborationConfig["pattern"],
    task: args.task as string,
    numWorkers: args.numWorkers as number | undefined,
    numRounds: args.numRounds as number | undefined,
    specialistRoles: args.specialistRoles as AgentRole[] | undefined,
    repos: args.repos as string[] | undefined,
    playbookId: args.playbookId as string | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
    useBinaryTreeBranching: args.useBinaryTreeBranching as boolean | undefined,
    branchingStrategy: args.branchingStrategy as CollaborationConfig["branchingStrategy"],
    recycleEliminatedAgents: args.recycleEliminatedAgents as boolean | undefined,
    qualityThreshold: args.qualityThreshold as number | undefined,
    enableBenchmarking: args.enableBenchmarking as boolean | undefined,
    customRolePrompts: args.customRolePrompts as Record<string, string> | undefined,
    dashboardEnabled: true,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
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
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- create_agent_team ------------------------------------------------------

async function handleCreateAgentTeam(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const roles = args.roles as Array<{ role: AgentRole; customPrompt?: string }>;
  const task = args.task as string;

  const config: CollaborationConfig = {
    pattern: "parallel",
    task,
    specialistRoles: roles.map((r) => r.role),
    customRolePrompts: Object.fromEntries(
      roles
        .filter((r) => r.customPrompt)
        .map((r) => [r.role, r.customPrompt!])
    ),
    repos: args.repos as string[] | undefined,
    playbookId: args.playbookId as string | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
    useBinaryTreeBranching: true,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            bestSolution: result.bestSolution,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- agent_debate -----------------------------------------------------------

async function handleAgentDebate(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: "debate",
    task: args.task as string,
    specialistRoles: args.roles as AgentRole[] | undefined,
    repos: args.repos as string[] | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
    useBinaryTreeBranching: args.useBinaryTreeBranching as boolean | undefined,
    branchingStrategy: args.branchingStrategy as CollaborationConfig["branchingStrategy"],
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            bestSolution: result.bestSolution,
            bestSessionId: result.bestSessionId,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- parallel_code_review ---------------------------------------------------

async function handleParallelCodeReview(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: "debate",
    task: args.task as string,
    specialistRoles:
      (args.specialistRoles as AgentRole[]) ?? [
        "security",
        "performance",
        "architecture",
        "testing",
        "devops",
      ],
    repos: args.repos as string[] | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
    useBinaryTreeBranching: false,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            allSolutions: result.allSolutions,
            metrics: result.metrics,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- iterative_improve ------------------------------------------------------

async function handleIterativeImprove(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: "iterative",
    task: args.task as string,
    numRounds: args.maxRounds as number | undefined,
    qualityThreshold: args.qualityThreshold as number | undefined,
    repos: args.repos as string[] | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
    useBinaryTreeBranching: args.useBinaryTreeBranching as boolean | undefined,
    branchingStrategy: args.branchingStrategy as CollaborationConfig["branchingStrategy"],
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            bestSolution: result.bestSolution,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- tournament -------------------------------------------------------------

async function handleTournament(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: "tournament",
    task: args.task as string,
    numWorkers: args.numAgents as number | undefined,
    numRounds: args.numRounds as number | undefined,
    recycleEliminatedAgents: args.recycleEliminatedAgents as boolean | undefined,
    useBinaryTreeBranching: args.useBinaryTreeBranching as boolean | undefined,
    branchingStrategy: args.branchingStrategy as CollaborationConfig["branchingStrategy"],
    repos: args.repos as string[] | undefined,
    maxAcuLimit: args.maxAcuLimit as number | undefined,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            bestSolution: result.bestSolution,
            bestSessionId: result.bestSessionId,
            bestBranchId: result.bestBranchId,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- swarm_solve ------------------------------------------------------------

async function handleSwarmSolve(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config: CollaborationConfig = {
    pattern: "swarm",
    task: args.task as string,
    numWorkers: args.initialAgents as number | undefined,
    numRounds: args.maxDepth as number | undefined,
    maxAcuLimit: args.maxTotalAgents as number | undefined,
    useBinaryTreeBranching: args.useBinaryTreeBranching as boolean | undefined,
    branchingStrategy: args.branchingStrategy as CollaborationConfig["branchingStrategy"],
    recycleEliminatedAgents: args.recycleEliminatedAgents as boolean | undefined,
    repos: args.repos as string[] | undefined,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: result.summary,
            bestSolution: result.bestSolution,
            bestSessionId: result.bestSessionId,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- get_team_status --------------------------------------------------------

async function handleGetTeamStatus(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const collaborationId = args.collaborationId as string;
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

async function handleSavePatternTemplate(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const template = templateManager.saveTemplate(
    args.name as string,
    args.description as string,
    args.pattern as CollaborationConfig["pattern"],
    (args.config as CollaborationConfig) ?? {}
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            id: template.id,
            name: template.name,
            description: template.description,
            pattern: template.pattern,
            config: template.config,
          },
          null,
          2
        ),
      },
    ],
  };
}

// --- run_pattern_template ---------------------------------------------------

async function handleRunPatternTemplate(
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const templateId = args.templateId as string;
  const template = templateManager.getTemplate(templateId);

  if (!template) {
    return {
      content: [
        { type: "text", text: `Template ${templateId} not found` },
      ],
    };
  }

  const overrides = (args.overrides as Record<string, unknown>) ?? {};
  const config: CollaborationConfig = {
    pattern: template.pattern,
    task: args.task as string,
    ...template.config,
    repos: (args.repos as string[]) ?? template.config.repos,
    numWorkers: (overrides.numWorkers as number) ?? template.config.numWorkers,
    numRounds: (overrides.numRounds as number) ?? template.config.numRounds,
    maxAcuLimit: (overrides.maxAcuLimit as number) ?? template.config.maxAcuLimit,
  };

  const result = await orchestrator.execute(config);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            template: template.name,
            summary: result.summary,
            bestSolution: result.bestSolution,
            metrics: result.metrics,
            allSolutions: result.allSolutions,
          },
          null,
          2
        ),
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
      inputSchema: tool.inputSchema as {
        type: "object";
        properties?: Record<string, unknown>;
      },
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

async function main(): Promise<void> {
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
