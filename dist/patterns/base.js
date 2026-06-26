// ============================================================================
// MultiAgentDevin — Pattern Base Class
// ============================================================================
import { STRUCTURED_OUTPUT_SCHEMA } from "../roles.js";
// ---------------------------------------------------------------------------
// PatternBase
// ---------------------------------------------------------------------------
export class PatternBase {
    client;
    gitWorkspace;
    emitter;
    config;
    constructor(client, gitWorkspace, emitter, config) {
        this.client = client;
        this.gitWorkspace = gitWorkspace;
        this.emitter = emitter;
        this.config = config;
    }
    // --- Agent Creation -------------------------------------------------------
    createAgent(role, roleName, prompt, branchId, branchName, parentBranchId) {
        const id = `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return {
            id,
            role,
            roleName,
            prompt,
            playbookId: this.config.playbookId,
            tags: [`multi-agent-devin`, role],
            maxAcuLimit: this.config.maxAcuLimit ?? 20,
            repos: this.config.repos,
            status: "created",
            branchId,
            branchName,
            parentBranchId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }
    // --- Session Creation -----------------------------------------------------
    async createDevinSession(session, agent) {
        const tags = [
            `collab-${session.id}`,
            `pattern-${session.pattern}`,
            agent.role,
            ...(agent.tags ?? []),
        ];
        const response = await this.client.createSession({
            prompt: agent.prompt,
            playbook_id: agent.playbookId,
            tags,
            max_acu_limit: agent.maxAcuLimit,
            repos: agent.repos,
            structured_output_required: true,
            structured_output_schema: STRUCTURED_OUTPUT_SCHEMA,
            title: `[${session.pattern}] ${agent.roleName} — ${session.id}`,
            bypass_approval: true,
        });
        agent.sessionId = response.session_id;
        agent.sessionUrl = response.url;
        agent.status = "working";
        agent.updatedAt = Date.now();
        this.emitter.notify(session.id, "agent_created", `Agent ${agent.roleName} created (session: ${response.session_id})`, {
            agentId: agent.id,
            sessionId: response.session_id,
            role: agent.role,
        });
        return agent;
    }
    // --- Waiting --------------------------------------------------------------
    async waitForAgents(session, agents) {
        const sessionIds = agents
            .filter((a) => a.sessionId)
            .map((a) => a.sessionId);
        if (sessionIds.length === 0)
            return;
        this.emitter.log(session.id, `Waiting for ${sessionIds.length} agent(s) to complete...`);
        const results = await this.client.waitForSessions(sessionIds, {
            timeoutMs: 600_000,
            onPoll: (id, status) => {
                const agent = agents.find((a) => a.sessionId === id);
                if (agent && agent.status !== status) {
                    agent.status = status;
                    agent.updatedAt = Date.now();
                    this.emitter.notify(session.id, "agent_status_changed", `Agent ${agent.roleName} status: ${status}`, {
                        agentId: agent.id,
                        status,
                    });
                }
            },
        });
        // Update agents with final results
        for (const agent of agents) {
            if (!agent.sessionId)
                continue;
            const result = results.get(agent.sessionId);
            if (!result)
                continue;
            agent.status = result.status;
            agent.structuredOutput = result.structured_output ?? undefined;
            agent.messages = result.messages ?? undefined;
            agent.acusConsumed = result.acus_consumed;
            agent.updatedAt = Date.now();
            if (result.pull_request) {
                agent.prUrl = result.pull_request.url;
            }
        }
    }
    // --- Solution Extraction --------------------------------------------------
    extractSolutions(agents) {
        return agents
            .filter((a) => a.sessionId)
            .map((a) => ({
            agentId: a.id,
            sessionId: a.sessionId,
            branchId: a.branchId,
            score: this.extractScore(a),
            summary: this.extractSummary(a),
            structuredOutput: a.structuredOutput,
            prUrl: a.prUrl,
        }));
    }
    extractScore(agent) {
        if (!agent.structuredOutput)
            return undefined;
        const score = agent.structuredOutput.score;
        return typeof score === "number" ? score : undefined;
    }
    extractSummary(agent) {
        if (agent.structuredOutput) {
            const summary = agent.structuredOutput.summary;
            if (typeof summary === "string")
                return summary;
        }
        return `Agent ${agent.roleName} completed (session: ${agent.sessionId})`;
    }
    // --- Result Building ------------------------------------------------------
    buildResult(summary, solutions, bestAgent) {
        const sorted = [...solutions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        const best = sorted[0];
        return {
            summary,
            bestSolution: best?.summary,
            bestSessionId: best?.sessionId,
            bestBranchId: best?.branchId,
            allSolutions: sorted,
            metrics: {
                totalAgents: solutions.length,
                averageScore: solutions.length > 0
                    ? solutions.reduce((sum, s) => sum + (s.score ?? 0), 0) / solutions.length
                    : 0,
                bestScore: best?.score ?? 0,
            },
        };
    }
    // --- Git Branch Helpers ---------------------------------------------------
    setupBinaryTreeBranches(session, numAgents) {
        // For binary tree: start with root, split as needed
        const root = this.gitWorkspace.getRoot(session.id);
        if (!root) {
            this.gitWorkspace.createTree(session.id, `collab-${session.id}`);
        }
        const assignments = [];
        if (numAgents <= 1) {
            const rootBranch = this.gitWorkspace.getRoot(session.id);
            assignments.push({
                branchId: rootBranch.id,
                branchName: rootBranch.name,
            });
            return { agents: assignments };
        }
        // Split root into 2, then keep splitting until we have enough branches
        const rootBranch = this.gitWorkspace.getRoot(session.id);
        let currentLeaves = [rootBranch];
        while (currentLeaves.length < numAgents) {
            const newLeaves = [];
            for (const leaf of currentLeaves) {
                if (currentLeaves.length + newLeaves.length >= numAgents) {
                    newLeaves.push(leaf);
                    continue;
                }
                const [childA, childB] = this.gitWorkspace.splitBranch(session.id, leaf.id);
                newLeaves.push(childA, childB);
            }
            currentLeaves = newLeaves;
        }
        for (const leaf of currentLeaves.slice(0, numAgents)) {
            const parent = leaf.parentId
                ? this.gitWorkspace.getBranch(session.id, leaf.parentId)
                : undefined;
            assignments.push({
                branchId: leaf.id,
                branchName: leaf.name,
                parentBranchId: leaf.parentId ?? undefined,
            });
        }
        return { agents: assignments };
    }
    // --- Context Building -----------------------------------------------------
    buildContextFromAgents(agents) {
        const contexts = [];
        for (const agent of agents) {
            const summary = this.extractSummary(agent);
            const score = this.extractScore(agent);
            const branch = agent.branchName ? ` (branch: ${agent.branchName})` : "";
            const scoreStr = score !== undefined ? ` [score: ${score}/100]` : "";
            contexts.push(`### ${agent.roleName}${branch}${scoreStr}\n${summary}`);
            if (agent.structuredOutput) {
                const output = agent.structuredOutput;
                if (output.files_changed?.length) {
                    contexts.push(`Files changed: ${output.files_changed.join(", ")}`);
                }
                if (output.issues_found?.length) {
                    contexts.push(`Issues: ${output.issues_found.map((i) => `[${i.severity}] ${i.description}`).join("; ")}`);
                }
                if (output.recommendations?.length) {
                    contexts.push(`Recommendations: ${output.recommendations.join("; ")}`);
                }
            }
        }
        return contexts.join("\n\n---\n\n");
    }
}
//# sourceMappingURL=base.js.map