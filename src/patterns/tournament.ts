// ============================================================================
// MultiAgentDevin — Tournament Pattern with Agent Recycling
// ============================================================================

import type {
  Agent,
  AgentSolution,
  CollaborationResult,
  CollaborationRound,
  CollaborationSession,
} from "../types.js";
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";

export class TournamentPattern extends PatternBase {
  async execute(session: CollaborationSession): Promise<CollaborationResult> {
    const numRounds = this.config.numRounds ?? 3;
    const initialAgents = this.config.numWorkers ?? 8;
    const recycle = this.config.recycleEliminatedAgents ?? true;

    this.emitter.notify(session.id, "collaboration_started", `Starting tournament: ${initialAgents} agents, ${numRounds} rounds, recycle=${recycle}`, {
      pattern: "tournament",
      numRounds,
      initialAgents,
      recycle,
    });

    // Initialize git tree with root branch
    this.gitWorkspace.createTree(session.id, `tournament-${session.id}`);
    const rootBranch = this.gitWorkspace.getRoot(session.id)!;

    // Round 0: All agents work on the root branch
    this.emitter.log(session.id, `Round 0: ${initialAgents} agents competing on root branch...`);

    let round0: CollaborationRound = {
      index: 0,
      status: "running",
      agentIds: [],
      eliminatedAgentIds: [],
      recycledAgentIds: [],
      branchIds: [rootBranch.id],
      startedAt: Date.now(),
    };

    let activeAgents: Agent[] = [];
    for (let i = 0; i < initialAgents; i++) {
      let prompt = buildAgentPrompt(
        "worker",
        `You are agent ${i + 1} of ${initialAgents} in a tournament. Solve the following task as well as you can. You are competing against other agents — produce the best possible solution.\n\nTASK:\n${session.task}`
      );

      prompt += `\n\n${this.gitWorkspace.getGitInstructions(rootBranch)}`;

      const agent = this.createAgent(
        "worker",
        `Agent ${i + 1}`,
        prompt,
        rootBranch.id,
        rootBranch.name
      );
      this.gitWorkspace.assignAgentToBranch(session.id, rootBranch.id, agent.id, agent.sessionId);
      activeAgents.push(agent);
      session.agents.set(agent.id, agent);
      round0.agentIds.push(agent.id);
    }

    await Promise.all(activeAgents.map((a) => this.createDevinSession(session, a)));
    await this.waitForAgents(session, activeAgents);

    round0.status = "completed";
    round0.completedAt = Date.now();
    session.rounds.push(round0);

    this.emitter.notify(session.id, "round_completed", `Round 0 completed with ${activeAgents.length} agents`, {
      round: 0,
      agentCount: activeAgents.length,
    });

    // Tournament rounds
    for (let round = 1; round <= numRounds; round++) {
      if (activeAgents.length <= 1) {
        this.emitter.log(session.id, `Only ${activeAgents.length} agent(s) remaining. Ending tournament early.`);
        break;
      }

      const roundData: CollaborationRound = {
        index: round,
        status: "running",
        agentIds: [],
        eliminatedAgentIds: [],
        recycledAgentIds: [],
        branchIds: [],
        startedAt: Date.now(),
      };

      this.emitter.notify(session.id, "round_started", `Tournament round ${round}/${numRounds} starting with ${activeAgents.length} agents`, {
        round,
        activeAgents: activeAgents.length,
      });

      // Phase 1: Reviewer scores all active agents
      this.emitter.log(session.id, `Round ${round}: Reviewer scoring ${activeAgents.length} solutions...`);

      const context = this.buildContextFromAgents(activeAgents);
      const reviewerPrompt = buildAgentPrompt(
        "reviewer",
        `You are the judge of a tournament round. Score each of the following ${activeAgents.length} solutions on a scale of 0-100. Then rank them from best to worst. Identify which solutions should be eliminated (the bottom half).\n\nTASK:\n${session.task}\n\nSOLUTIONS:\n${context}\n\nProvide a score for each solution and identify the winners and losers.`
      );

      const reviewer = this.createAgent("reviewer", `Judge (Round ${round})`, reviewerPrompt);
      session.agents.set(reviewer.id, reviewer);
      roundData.agentIds.push(reviewer.id);

      await this.createDevinSession(session, reviewer);
      await this.waitForAgents(session, [reviewer]);

      // Phase 2: Determine winners and losers based on scores
      const scoredAgents = activeAgents.map((a) => ({
        agent: a,
        score: this.extractScore(a) ?? 0,
      }));

      // Also check reviewer's structured output for rankings
      const reviewerOutput = (reviewer.structuredOutput ?? {}) as {
        rankings?: Array<{ agent_id?: string; score?: number; rank?: number }>;
      };

      if (reviewerOutput.rankings && Array.isArray(reviewerOutput.rankings)) {
        for (const ranking of reviewerOutput.rankings) {
          if (ranking.agent_id && ranking.score !== undefined) {
            const found = scoredAgents.find((s) => s.agent.id === ranking.agent_id);
            if (found) {
              found.score = ranking.score;
            }
          }
        }
      }

      scoredAgents.sort((a, b) => b.score - a.score);

      // Top half are winners, bottom half are losers
      const midpoint = Math.ceil(scoredAgents.length / 2);
      const winners = scoredAgents.slice(0, midpoint);
      const losers = scoredAgents.slice(midpoint);

      this.emitter.log(session.id, `Round ${round}: ${winners.length} winners, ${losers.length} losers`);

      // Phase 3: Binary tree branching — split each winning branch into 2
      const newActiveAgents: Agent[] = [];

      for (const winner of winners) {
        const winnerBranch = this.gitWorkspace.getBranch(session.id, winner.agent.branchId ?? "");
        if (!winnerBranch) continue;

        // Split the winning branch into 2 children (binary tree)
        const [childA, childB] = this.gitWorkspace.splitBranch(session.id, winnerBranch.id);
        roundData.branchIds.push(childA.id, childB.id);

        // Winner continues on child A
        let winnerPromptA = buildAgentPrompt(
          "worker",
          `You WON round ${round} with a score of ${winner.score}/100. Continue improving your solution. Build upon your previous work.\n\nTASK:\n${session.task}`,
          this.buildContextFromAgents([winner.agent])
        );
        winnerPromptA += `\n\n${this.gitWorkspace.getGitInstructions(childA, winnerBranch)}`;

        const agentA = this.createAgent(
          "worker",
          `${winner.agent.roleName} → Branch A`,
          winnerPromptA,
          childA.id,
          childA.name,
          winnerBranch.id
        );
        this.gitWorkspace.assignAgentToBranch(session.id, childA.id, agentA.id);
        newActiveAgents.push(agentA);
        session.agents.set(agentA.id, agentA);

        // Child B: either a recycled loser or the winner's alternative approach
        let agentB: Agent;
        if (recycle && losers.length > 0) {
          // Recycle a loser to work on the winning branch
          const loser = losers.shift()!;
          this.gitWorkspace.eliminateBranch(session.id, loser.agent.branchId ?? "");
          roundData.eliminatedAgentIds.push(loser.agent.id);
          roundData.recycledAgentIds.push(loser.agent.id);

          let recycledPrompt = buildAgentPrompt(
            "worker",
            `You were ELIMINATED in round ${round} with a score of ${loser.score}/100. You are now being RECYCLED to work on a winning branch. Study the winning solution and help improve it. You can see the winning agent's work in the branch history.\n\nTASK:\n${session.task}`,
            this.buildContextFromAgents([winner.agent])
          );
          recycledPrompt += `\n\n${this.gitWorkspace.getGitInstructions(childB, winnerBranch)}`;

          agentB = this.createAgent(
            "worker",
            `${loser.agent.roleName} → Recycled to ${childB.name}`,
            recycledPrompt,
            childB.id,
            childB.name,
            winnerBranch.id
          );

          this.emitter.notify(session.id, "agent_recycled", `Agent ${loser.agent.roleName} recycled to branch ${childB.name}`, {
            recycledAgentId: loser.agent.id,
            newBranchId: childB.id,
            fromBranchId: loser.agent.branchId,
          });
        } else {
          // Winner also works on child B (alternative approach)
          let winnerPromptB = buildAgentPrompt(
            "worker",
            `You WON round ${round}. Now try an ALTERNATIVE approach to the same task. Explore a different strategy.\n\nTASK:\n${session.task}`,
            this.buildContextFromAgents([winner.agent])
          );
          winnerPromptB += `\n\n${this.gitWorkspace.getGitInstructions(childB, winnerBranch)}`;

          agentB = this.createAgent(
            "worker",
            `${winner.agent.roleName} → Branch B (alt)`,
            winnerPromptB,
            childB.id,
            childB.name,
            winnerBranch.id
          );
        }

        this.gitWorkspace.assignAgentToBranch(session.id, childB.id, agentB.id);
        newActiveAgents.push(agentB);
        session.agents.set(agentB.id, agentB);
      }

      // If there are remaining losers (not recycled), eliminate them
      for (const loser of losers) {
        if (loser.agent.branchId) {
          this.gitWorkspace.eliminateBranch(session.id, loser.agent.branchId);
          roundData.eliminatedAgentIds.push(loser.agent.id);
        }
      }

      // Launch all new agents in parallel
      await Promise.all(newActiveAgents.map((a) => this.createDevinSession(session, a)));
      await this.waitForAgents(session, newActiveAgents);

      activeAgents = newActiveAgents;

      roundData.status = "completed";
      roundData.completedAt = Date.now();
      session.rounds.push(roundData);

      this.emitter.notify(session.id, "round_completed", `Round ${round} completed: ${winners.length} winners, ${losers.length} eliminated`, {
        round,
        winners: winners.length,
        losers: losers.length,
        recycled: roundData.recycledAgentIds.length,
      });
    }

    // Final: select the best solution
    const finalSolutions = this.extractSolutions(activeAgents);
    const bestAgent = activeAgents.length > 0
      ? activeAgents.reduce((best, current) => {
          const bestScore = this.extractScore(best) ?? 0;
          const currentScore = this.extractScore(current) ?? 0;
          return currentScore > bestScore ? current : best;
        })
      : undefined;

    const result = this.buildResult(
      `Tournament completed in ${session.rounds.length} rounds. Champion: ${bestAgent?.roleName ?? "N/A"} (score: ${bestAgent ? this.extractScore(bestAgent) ?? "N/A" : "N/A"}). ${bestAgent ? this.extractSummary(bestAgent) : ""}`,
      finalSolutions,
      bestAgent
    );

    this.emitter.notify(session.id, "collaboration_completed", "Tournament completed", {
      result: result.summary,
      champion: bestAgent?.roleName,
    });

    return result;
  }
}
