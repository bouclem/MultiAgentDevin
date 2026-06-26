// ============================================================================
// MultiAgentDevin — Debate/Consensus Pattern
// ============================================================================

import type {
  Agent,
  AgentRole,
  CollaborationResult,
  CollaborationSession,
} from "../types.js";
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";

export class DebatePattern extends PatternBase {
  async execute(session: CollaborationSession): Promise<CollaborationResult> {
    const roles = this.config.specialistRoles?.length
      ? this.config.specialistRoles
      : (["security", "performance", "architecture"] as AgentRole[]);
    const numAgents = this.config.numWorkers ?? roles.length;

    this.emitter.notify(session.id, "collaboration_started", `Starting debate with ${numAgents} specialist agents`, {
      pattern: "debate",
      roles: roles.map((r) => String(r)),
    });

    // Phase 1: All agents solve the same problem independently
    this.emitter.log(session.id, `Phase 1: ${numAgents} agents solving independently...`);

    const branchAssignments = this.config.useBinaryTreeBranching
      ? this.setupBinaryTreeBranches(session, numAgents)
      : null;

    const solvers: Agent[] = [];
    for (let i = 0; i < numAgents; i++) {
      const role = roles[i % roles.length];
      const roleDef = role === "custom" ? { name: "Custom Specialist" } : undefined;
      const roleName = roleDef?.name ?? this.getRoleName(role);

      let prompt = buildAgentPrompt(
        role,
        `Solve the following task from your area of expertise. Provide a complete solution.\n\nTASK:\n${session.task}`,
        undefined,
        this.config.customRolePrompts?.[role]
      );

      const branchInfo = branchAssignments?.agents[i];
      if (branchInfo) {
        const branch = this.gitWorkspace.getBranch(session.id, branchInfo.branchId);
        const parentBranch = branchInfo.parentBranchId
          ? this.gitWorkspace.getBranch(session.id, branchInfo.parentBranchId)
          : undefined;
        if (branch) {
          prompt += `\n\n${this.gitWorkspace.getGitInstructions(branch, parentBranch)}`;
        }
      }

      const agent = this.createAgent(
        role,
        roleName,
        prompt,
        branchInfo?.branchId,
        branchInfo?.branchName,
        branchInfo?.parentBranchId
      );

      if (branchInfo) {
        this.gitWorkspace.assignAgentToBranch(session.id, branchInfo.branchId, agent.id);
      }

      solvers.push(agent);
      session.agents.set(agent.id, agent);
    }

    await Promise.all(solvers.map((a) => this.createDevinSession(session, a)));
    await this.waitForAgents(session, solvers);

    // Phase 2: Reviewer compares and picks best
    this.emitter.log(session.id, "Phase 2: Reviewer comparing solutions...");
    const context = this.buildContextFromAgents(solvers);
    const reviewerPrompt = buildAgentPrompt(
      "reviewer",
      `Multiple specialist agents have independently solved the same task. Compare their solutions and determine the best approach.\n\nORIGINAL TASK:\n${session.task}\n\nSOLUTIONS TO COMPARE:\n${context}\n\nEvaluate each solution on correctness, quality, security, and completeness. Select the best solution or create a hybrid that combines the strongest elements. Provide a final score (0-100) and explain your reasoning.`
    );

    const reviewer = this.createAgent("reviewer", "Reviewer", reviewerPrompt);
    session.agents.set(reviewer.id, reviewer);

    await this.createDevinSession(session, reviewer);
    await this.waitForAgents(session, [reviewer]);

    const solutions = this.extractSolutions([...solvers, reviewer]);
    const result = this.buildResult(
      `Debate completed: ${solvers.length} specialists + 1 reviewer. ${this.extractSummary(reviewer)}`,
      solutions,
      reviewer
    );

    this.emitter.notify(session.id, "collaboration_completed", "Debate/consensus completed", {
      result: result.summary,
    });

    return result;
  }

  private getRoleName(role: AgentRole): string {
    const names: Record<string, string> = {
      security: "Security Expert",
      performance: "Performance Optimizer",
      architecture: "Architecture Designer",
      testing: "Test Engineer",
      devops: "DevOps Specialist",
      worker: "Worker",
      reviewer: "Reviewer",
      coordinator: "Coordinator",
      custom: "Custom Specialist",
    };
    return names[role] ?? "Specialist";
  }
}
