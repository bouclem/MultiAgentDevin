// ============================================================================
// MultiAgentDevin — Self-Organizing Swarm Pattern
// ============================================================================

import type {
  Agent,
  AgentRole,
  CollaborationResult,
  CollaborationRound,
  CollaborationSession,
} from "../types.js";
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";

// ---------------------------------------------------------------------------
// SwarmAgent — tracks spawn depth and parent
// ---------------------------------------------------------------------------

interface SwarmAgent {
  agent: Agent;
  depth: number;
  parentId: string | null;
  subtask: string;
  childIds: string[];
  status: "pending" | "working" | "completed" | "failed" | "spawned_children";
}

// ---------------------------------------------------------------------------
// SwarmPattern
// ---------------------------------------------------------------------------

export class SwarmPattern extends PatternBase {
  private swarm: Map<string, SwarmAgent> = new Map();
  private maxDepth: number = 3;
  private maxTotalAgents: number = 20;

  async execute(session: CollaborationSession): Promise<CollaborationResult> {
    const initialAgents = this.config.numWorkers ?? 3;
    this.maxDepth = this.config.numRounds ?? 3;
    this.maxTotalAgents = this.config.maxAcuLimit
      ? Math.min(this.config.maxAcuLimit * 2, 30)
      : 20;

    this.emitter.notify(session.id, "collaboration_started", `Starting self-organizing swarm with ${initialAgents} initial agents (max depth: ${this.maxDepth}, max agents: ${this.maxTotalAgents})`, {
      pattern: "swarm",
      initialAgents,
      maxDepth: this.maxDepth,
      maxTotalAgents: this.maxTotalAgents,
    });

    // Initialize git tree
    this.gitWorkspace.createTree(session.id, `swarm-${session.id}`);
    const rootBranch = this.gitWorkspace.getRoot(session.id)!;

    // Phase 1: Coordinator analyzes task and creates initial subtasks
    this.emitter.log(session.id, "Phase 1: Coordinator analyzing task and creating initial subtasks...");

    const coordinatorPrompt = buildAgentPrompt(
      "coordinator",
      `Analyze the following task and break it into ${initialAgents} initial subtasks. For each subtask, indicate whether it is "simple" (can be solved by one agent) or "complex" (may need further decomposition).\n\nTASK:\n${session.task}\n\nProvide the subtasks in your structured output as an array of objects with "subtask", "complexity" ("simple" or "complex"), and "suggested_role" fields.`
    );

    const coordinator = this.createAgent("coordinator", "Swarm Coordinator", coordinatorPrompt);
    session.agents.set(coordinator.id, coordinator);

    await this.createDevinSession(session, coordinator);
    await this.waitForAgents(session, [coordinator]);

    // Extract initial subtasks
    const subtasks = this.extractSwarmSubtasks(coordinator, initialAgents);
    this.emitter.log(session.id, `Coordinator created ${subtasks.length} initial subtasks`);

    // Phase 2: Spawn initial agents
    const round0: CollaborationRound = {
      index: 0,
      status: "running",
      agentIds: [],
      eliminatedAgentIds: [],
      recycledAgentIds: [],
      branchIds: [rootBranch.id],
      startedAt: Date.now(),
    };

    const branchAssignments = this.config.useBinaryTreeBranching
      ? this.setupBinaryTreeBranches(session, subtasks.length)
      : null;

    const initialSwarmAgents: SwarmAgent[] = [];
    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      const branchInfo = branchAssignments?.agents[i];

      let prompt = buildAgentPrompt(subtask.role, `Solve this subtask:\n${subtask.description}`);

      let branchId = rootBranch.id;
      let branchName = rootBranch.name;
      if (branchInfo) {
        const branch = this.gitWorkspace.getBranch(session.id, branchInfo.branchId);
        const parentBranch = branchInfo.parentBranchId
          ? this.gitWorkspace.getBranch(session.id, branchInfo.parentBranchId)
          : undefined;
        if (branch) {
          prompt += `\n\n${this.gitWorkspace.getGitInstructions(branch, parentBranch)}`;
          branchId = branchInfo.branchId;
          branchName = branchInfo.branchName;
        }
      }

      const agent = this.createAgent(
        subtask.role,
        `Swarm Agent ${i + 1}`,
        prompt,
        branchId,
        branchName
      );
      this.gitWorkspace.assignAgentToBranch(session.id, branchId, agent.id);
      session.agents.set(agent.id, agent);
      round0.agentIds.push(agent.id);
      round0.branchIds.push(branchId);

      const swarmAgent: SwarmAgent = {
        agent,
        depth: 0,
        parentId: null,
        subtask: subtask.description,
        childIds: [],
        status: "working",
      };
      this.swarm.set(agent.id, swarmAgent);
      initialSwarmAgents.push(swarmAgent);
    }

    // Launch initial agents
    await Promise.all(
      initialSwarmAgents.map((sa) => this.createDevinSession(session, sa.agent))
    );
    await this.waitForAgents(session, initialSwarmAgents.map((sa) => sa.agent));

    round0.status = "completed";
    round0.completedAt = Date.now();
    session.rounds.push(round0);

    // Phase 3: Self-organizing expansion
    this.emitter.log(session.id, "Phase 3: Self-organizing expansion...");

    let currentDepth = 0;
    while (currentDepth < this.maxDepth) {
      currentDepth++;
      const roundData: CollaborationRound = {
        index: currentDepth,
        status: "running",
        agentIds: [],
        eliminatedAgentIds: [],
        recycledAgentIds: [],
        branchIds: [],
        startedAt: Date.now(),
      };

      // Find completed agents that haven't spawned children yet
      const completedAgents = [...this.swarm.values()].filter(
        (sa) => sa.status === "working" && sa.agent.status === "finished"
      );

      if (completedAgents.length === 0) {
        this.emitter.log(session.id, `No agents to expand at depth ${currentDepth}. Ending swarm expansion.`);
        roundData.status = "completed";
        roundData.completedAt = Date.now();
        session.rounds.push(roundData);
        break;
      }

      // For each completed agent, check if it needs to spawn sub-agents
      const newSwarmAgents: SwarmAgent[] = [];

      for (const parentSA of completedAgents) {
        parentSA.status = "spawned_children";

        // Check if the agent's output suggests further decomposition is needed
        const needsExpansion = this.checkNeedsExpansion(parentSA.agent);
        const totalAgents = this.swarm.size + newSwarmAgents.length;

        if (needsExpansion && totalAgents < this.maxTotalAgents && parentSA.depth < this.maxDepth - 1) {
          // Spawn 2 child agents (binary tree)
          const parentBranch = this.gitWorkspace.getBranch(session.id, parentSA.agent.branchId ?? "");
          if (!parentBranch) continue;

          const [childA, childB] = this.gitWorkspace.splitBranch(session.id, parentBranch.id);
          roundData.branchIds.push(childA.id, childB.id);

          // Determine subtasks for children based on parent's output
          const childSubtasks = this.deriveChildSubtasks(parentSA);

          for (let j = 0; j < 2; j++) {
            const subtask = childSubtasks[j] ?? `Refine and expand the work from ${parentSA.agent.roleName}`;
            const childBranch = j === 0 ? childA : childB;

            let prompt = buildAgentPrompt(
              "worker",
              `You are a dynamically spawned sub-agent. Your parent agent identified that more work is needed.\n\nPARENT CONTEXT:\n${this.buildContextFromAgents([parentSA.agent])}\n\nYOUR SUBTASK:\n${subtask}`
            );
            prompt += `\n\n${this.gitWorkspace.getGitInstructions(childBranch, parentBranch)}`;

            const childAgent = this.createAgent(
              "worker",
              `${parentSA.agent.roleName} → Sub ${j + 1}`,
              prompt,
              childBranch.id,
              childBranch.name,
              parentBranch.id
            );
            this.gitWorkspace.assignAgentToBranch(session.id, childBranch.id, childAgent.id);
            session.agents.set(childAgent.id, childAgent);
            roundData.agentIds.push(childAgent.id);
            roundData.branchIds.push(childBranch.id);

            parentSA.childIds.push(childAgent.id);

            const childSA: SwarmAgent = {
              agent: childAgent,
              depth: parentSA.depth + 1,
              parentId: parentSA.agent.id,
              subtask,
              childIds: [],
              status: "working",
            };
            this.swarm.set(childAgent.id, childSA);
            newSwarmAgents.push(childSA);

            this.emitter.notify(session.id, "branch_created", `Swarm spawned sub-agent on branch ${childBranch.name}`, {
              agentId: childAgent.id,
              parentId: parentSA.agent.id,
              branchId: childBranch.id,
              depth: childSA.depth,
            });
          }
        } else if (this.config.recycleEliminatedAgents && totalAgents < this.maxTotalAgents) {
          // No expansion needed — mark as completed
          parentSA.status = "completed";
        } else {
          parentSA.status = "completed";
        }
      }

      if (newSwarmAgents.length > 0) {
        this.emitter.log(session.id, `Depth ${currentDepth}: Spawned ${newSwarmAgents.length} sub-agents. Total: ${this.swarm.size}`);
        await Promise.all(
          newSwarmAgents.map((sa) => this.createDevinSession(session, sa.agent))
        );
        await this.waitForAgents(session, newSwarmAgents.map((sa) => sa.agent));
      }

      roundData.status = "completed";
      roundData.completedAt = Date.now();
      session.rounds.push(roundData);

      this.emitter.notify(session.id, "round_completed", `Swarm depth ${currentDepth} completed`, {
        round: currentDepth,
        totalAgents: this.swarm.size,
        newAgents: newSwarmAgents.length,
      });
    }

    // Phase 4: Final aggregation
    this.emitter.log(session.id, "Phase 4: Final aggregation by coordinator...");

    const allCompletedAgents = [...this.swarm.values()]
      .filter((sa) => sa.agent.status === "finished")
      .map((sa) => sa.agent);

    const context = this.buildContextFromAgents(allCompletedAgents);
    const aggregatorPrompt = buildAgentPrompt(
      "coordinator",
      `The swarm has completed. Aggregate all agent outputs into a final unified solution.\n\nORIGINAL TASK:\n${session.task}\n\nALL AGENT SOLUTIONS (${allCompletedAgents.length} agents):\n${context}\n\nProduce a final merged solution that combines the best work from all agents.`
    );

    const aggregator = this.createAgent("coordinator", "Swarm Aggregator", aggregatorPrompt);
    session.agents.set(aggregator.id, aggregator);

    await this.createDevinSession(session, aggregator);
    await this.waitForAgents(session, [aggregator]);

    const solutions = this.extractSolutions([...session.agents.values()]);
    const result = this.buildResult(
      `Swarm completed: ${this.swarm.size} agents across ${session.rounds.length} depth levels. ${this.extractSummary(aggregator)}`,
      solutions,
      aggregator
    );

    this.emitter.notify(session.id, "collaboration_completed", "Self-organizing swarm completed", {
      result: result.summary,
      totalAgents: this.swarm.size,
      maxDepth: currentDepth,
    });

    return result;
  }

  // --- Swarm Helpers --------------------------------------------------------

  private extractSwarmSubtasks(
    coordinator: Agent,
    count: number
  ): Array<{ description: string; role: AgentRole; complexity: string }> {
    if (!coordinator.structuredOutput) {
      return Array.from({ length: count }, (_, i) => ({
        description: `Subtask ${i + 1}: Complete part of the task`,
        role: "worker" as AgentRole,
        complexity: "simple",
      }));
    }

    const output = coordinator.structuredOutput as {
      subtasks?: Array<{
        subtask?: string;
        description?: string;
        complexity?: string;
        suggested_role?: string;
      }>;
    };

    if (output.subtasks && Array.isArray(output.subtasks)) {
      return output.subtasks.slice(0, count).map((s) => ({
        description: s.subtask ?? s.description ?? "Complete the assigned subtask",
        role: (s.suggested_role as AgentRole) ?? "worker",
        complexity: s.complexity ?? "simple",
      }));
    }

    return Array.from({ length: count }, (_, i) => ({
      description: `Subtask ${i + 1}`,
      role: "worker" as AgentRole,
      complexity: "simple",
    }));
  }

  private checkNeedsExpansion(agent: Agent): boolean {
    if (!agent.structuredOutput) return false;

    const output = agent.structuredOutput as {
      status?: string;
      needs_further_work?: boolean;
      remaining_subtasks?: string[];
      recommendations?: string[];
    };

    if (output.needs_further_work === true) return true;
    if (output.remaining_subtasks && output.remaining_subtasks.length > 0) return true;
    if (output.status === "blocked") return true;

    return false;
  }

  private deriveChildSubtasks(parentSA: SwarmAgent): string[] {
    if (!parentSA.agent.structuredOutput) {
      return [
        `Refine and improve: ${parentSA.subtask}`,
        `Alternative approach for: ${parentSA.subtask}`,
      ];
    }

    const output = parentSA.agent.structuredOutput as {
      remaining_subtasks?: string[];
      recommendations?: string[];
    };

    const subtasks: string[] = [];

    if (output.remaining_subtasks && output.remaining_subtasks.length >= 2) {
      subtasks.push(...output.remaining_subtasks.slice(0, 2));
    } else if (output.remaining_subtasks && output.remaining_subtasks.length === 1) {
      subtasks.push(output.remaining_subtasks[0]);
      subtasks.push(`Alternative approach for: ${parentSA.subtask}`);
    } else {
      subtasks.push(`Refine and improve: ${parentSA.subtask}`);
      subtasks.push(`Address recommendations from parent: ${output.recommendations?.join("; ") ?? "improve quality"}`);
    }

    return subtasks;
  }
}
