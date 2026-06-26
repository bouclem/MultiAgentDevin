// ============================================================================
// MultiAgentDevin — Iterative Refinement Pattern
// ============================================================================

import type {
  Agent,
  CollaborationResult,
  CollaborationSession,
  CollaborationRound,
} from "../types.js";
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";

export class IterativePattern extends PatternBase {
  async execute(session: CollaborationSession): Promise<CollaborationResult> {
    const maxRounds = this.config.numRounds ?? 3;
    const qualityThreshold = this.config.qualityThreshold ?? 85;

    this.emitter.notify(session.id, "collaboration_started", `Starting iterative refinement (max ${maxRounds} rounds, threshold ${qualityThreshold})`, {
      pattern: "iterative",
      maxRounds,
      qualityThreshold,
    });

    // Initialize git tree
    this.gitWorkspace.createTree(session.id, `iterative-${session.id}`);
    const rootBranch = this.gitWorkspace.getRoot(session.id)!;

    let worker: Agent | null = null;
    let reviewer: Agent | null = null;
    let lastScore = 0;
    let lastContext = "";

    for (let round = 0; round < maxRounds; round++) {
      const roundData: CollaborationRound = {
        index: round,
        status: "running",
        agentIds: [],
        eliminatedAgentIds: [],
        recycledAgentIds: [],
        branchIds: [],
        startedAt: Date.now(),
      };

      this.emitter.notify(session.id, "round_started", `Round ${round + 1}/${maxRounds} started`, {
        round,
      });

      // Worker phase
      let workerPrompt: string;
      if (round === 0) {
        workerPrompt = buildAgentPrompt(
          "worker",
          `Implement the following task completely. Write production-ready code.\n\nTASK:\n${session.task}`
        );
      } else {
        workerPrompt = buildAgentPrompt(
          "worker",
          `Improve your previous solution based on the reviewer's feedback. Address all issues identified.\n\nTASK:\n${session.task}`,
          lastContext
        );
      }

      // Binary tree branching: split current branch for each round
      let branchId = rootBranch.id;
      let branchName = rootBranch.name;
      if (this.config.useBinaryTreeBranching && round > 0) {
        const currentLeaves = this.gitWorkspace.getActiveLeaves(session.id);
        if (currentLeaves.length > 0) {
          const [childA] = this.gitWorkspace.splitBranch(session.id, currentLeaves[0].id);
          branchId = childA.id;
          branchName = childA.name;
        }
      }

      workerPrompt += `\n\n${this.gitWorkspace.getGitInstructions(
        this.gitWorkspace.getBranch(session.id, branchId)!,
        round > 0 ? this.gitWorkspace.getBranch(session.id, rootBranch.id) : undefined
      )}`;

      worker = this.createAgent("worker", `Worker (Round ${round + 1})`, workerPrompt, branchId, branchName);
      this.gitWorkspace.assignAgentToBranch(session.id, branchId, worker.id);
      session.agents.set(worker.id, worker);
      roundData.agentIds.push(worker.id);
      roundData.branchIds.push(branchId);

      await this.createDevinSession(session, worker);
      await this.waitForAgents(session, [worker]);

      // Reviewer phase
      const workerContext = this.buildContextFromAgents([worker]);
      const reviewerPrompt = buildAgentPrompt(
        "reviewer",
        `Review the following code solution. Score it 0-100 and provide specific, actionable feedback for improvement.\n\nTASK:\n${session.task}\n\nSOLUTION TO REVIEW:\n${workerContext}\n\nIf the score is below ${qualityThreshold}, list specific improvements needed. If the score is ${qualityThreshold} or above, indicate that the solution meets the quality threshold.`
      );

      reviewer = this.createAgent("reviewer", `Reviewer (Round ${round + 1})`, reviewerPrompt);
      session.agents.set(reviewer.id, reviewer);
      roundData.agentIds.push(reviewer.id);

      await this.createDevinSession(session, reviewer);
      await this.waitForAgents(session, [reviewer]);

      lastScore = this.extractScore(reviewer) ?? 0;
      lastContext = this.buildContextFromAgents([reviewer]);

      roundData.status = "completed";
      roundData.completedAt = Date.now();
      roundData.summary = `Score: ${lastScore}/100`;
      session.rounds.push(roundData);

      this.emitter.notify(session.id, "round_completed", `Round ${round + 1} completed — score: ${lastScore}/100`, {
        round,
        score: lastScore,
      });

      // Check quality threshold
      if (lastScore >= qualityThreshold) {
        this.emitter.log(session.id, `Quality threshold (${qualityThreshold}) reached with score ${lastScore}. Stopping.`);
        break;
      }
    }

    session.currentRoundIndex = session.rounds.length - 1;

    const solutions = this.extractSolutions([...session.agents.values()]);
    const finalAgent = reviewer ?? worker;
    const result = this.buildResult(
      `Iterative refinement completed in ${session.rounds.length} rounds. Final score: ${lastScore}/100. ${finalAgent ? this.extractSummary(finalAgent) : "No output"}`,
      solutions,
      finalAgent ?? undefined
    );

    this.emitter.notify(session.id, "collaboration_completed", "Iterative refinement completed", {
      result: result.summary,
      finalScore: lastScore,
    });

    return result;
  }
}
