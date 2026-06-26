// ============================================================================
// MultiAgentDevin — Pipeline Pattern
// ============================================================================
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";
export class PipelinePattern extends PatternBase {
    async execute(session) {
        const roles = this.config.specialistRoles?.length
            ? this.config.specialistRoles
            : ["architecture", "worker", "testing", "security"];
        this.emitter.notify(session.id, "collaboration_started", `Starting pipeline with ${roles.length} stages`, {
            pattern: "pipeline",
            stages: roles.map((r) => String(r)),
        });
        // Initialize git tree
        this.gitWorkspace.createTree(session.id, `pipeline-${session.id}`);
        const rootBranch = this.gitWorkspace.getRoot(session.id);
        const agents = [];
        let context = "";
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const roleName = this.getRoleName(role);
            const stageNum = i + 1;
            this.emitter.log(session.id, `Stage ${stageNum}/${roles.length}: ${roleName}...`);
            let prompt;
            if (i === 0) {
                prompt = buildAgentPrompt(role, `You are stage ${stageNum} of a ${roles.length}-stage pipeline. Complete the following task from your expertise area.\n\nTASK:\n${session.task}`, undefined, this.config.customRolePrompts?.[role]);
            }
            else {
                prompt = buildAgentPrompt(role, `You are stage ${stageNum} of a ${roles.length}-stage pipeline. The previous stages have produced work that you should build upon.\n\nTASK:\n${session.task}`, context, this.config.customRolePrompts?.[role]);
            }
            // Assign to root branch for sequential pipeline
            let branchId = rootBranch.id;
            let branchName = rootBranch.name;
            if (this.config.useBinaryTreeBranching && i > 0) {
                // Split the current branch for the next stage
                const currentLeaves = this.gitWorkspace.getActiveLeaves(session.id);
                if (currentLeaves.length > 0) {
                    const [childA] = this.gitWorkspace.splitBranch(session.id, currentLeaves[0].id);
                    branchId = childA.id;
                    branchName = childA.name;
                }
            }
            prompt += `\n\n${this.gitWorkspace.getGitInstructions(this.gitWorkspace.getBranch(session.id, branchId), this.gitWorkspace.getBranch(session.id, rootBranch.id))}`;
            const agent = this.createAgent(role, roleName, prompt, branchId, branchName);
            this.gitWorkspace.assignAgentToBranch(session.id, branchId, agent.id);
            agents.push(agent);
            session.agents.set(agent.id, agent);
            await this.createDevinSession(session, agent);
            await this.waitForAgents(session, [agent]);
            // Build context for next stage
            context = this.buildContextFromAgents([agent]);
            this.emitter.log(session.id, `Stage ${stageNum} completed: ${this.extractSummary(agent)}`);
        }
        const solutions = this.extractSolutions(agents);
        const lastAgent = agents[agents.length - 1];
        const result = this.buildResult(`Pipeline completed: ${roles.length} stages. Final output: ${this.extractSummary(lastAgent)}`, solutions, lastAgent);
        this.emitter.notify(session.id, "collaboration_completed", "Pipeline completed", {
            result: result.summary,
        });
        return result;
    }
    getRoleName(role) {
        const names = {
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
//# sourceMappingURL=pipeline.js.map