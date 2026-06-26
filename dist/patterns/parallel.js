// ============================================================================
// MultiAgentDevin — Parallel Decomposition Pattern
// ============================================================================
import { PatternBase } from "./base.js";
import { buildAgentPrompt } from "../roles.js";
export class ParallelPattern extends PatternBase {
    async execute(session) {
        const numWorkers = this.config.numWorkers ?? 3;
        this.emitter.notify(session.id, "collaboration_started", `Starting parallel decomposition with ${numWorkers} workers`, {
            pattern: "parallel",
            numWorkers,
        });
        // Phase 1: Coordinator breaks down the task
        this.emitter.log(session.id, "Phase 1: Coordinator breaking down task...");
        const coordinatorPrompt = buildAgentPrompt("coordinator", `Break down the following task into exactly ${numWorkers} independent subtasks. Each subtask should be completable by a single agent without dependencies on other subtasks.\n\nTASK:\n${session.task}`);
        const coordinator = this.createAgent("coordinator", "Coordinator", coordinatorPrompt);
        session.agents.set(coordinator.id, coordinator);
        await this.createDevinSession(session, coordinator);
        await this.waitForAgents(session, [coordinator]);
        // Extract subtasks from coordinator's output
        const subtasks = this.extractSubtasks(coordinator, numWorkers);
        this.emitter.log(session.id, `Coordinator produced ${subtasks.length} subtasks`);
        // Phase 2: Workers solve subtasks in parallel
        this.emitter.log(session.id, "Phase 2: Workers solving subtasks in parallel...");
        const branchAssignments = this.config.useBinaryTreeBranching
            ? this.setupBinaryTreeBranches(session, subtasks.length)
            : null;
        const workers = [];
        for (let i = 0; i < subtasks.length; i++) {
            const subtask = subtasks[i];
            const branchInfo = branchAssignments?.agents[i];
            let prompt = buildAgentPrompt("worker", subtask, undefined, this.config.customRolePrompts?.worker);
            if (branchInfo) {
                const branch = this.gitWorkspace.getBranch(session.id, branchInfo.branchId);
                const parentBranch = branchInfo.parentBranchId
                    ? this.gitWorkspace.getBranch(session.id, branchInfo.parentBranchId)
                    : undefined;
                if (branch) {
                    prompt += `\n\n${this.gitWorkspace.getGitInstructions(branch, parentBranch)}`;
                }
            }
            const worker = this.createAgent("worker", `Worker ${i + 1}`, prompt, branchInfo?.branchId, branchInfo?.branchName, branchInfo?.parentBranchId);
            if (branchInfo) {
                this.gitWorkspace.assignAgentToBranch(session.id, branchInfo.branchId, worker.id);
            }
            workers.push(worker);
            session.agents.set(worker.id, worker);
        }
        // Create all sessions in parallel
        await Promise.all(workers.map((w) => this.createDevinSession(session, w)));
        await this.waitForAgents(session, workers);
        // Phase 3: Reviewer merges results
        this.emitter.log(session.id, "Phase 3: Reviewer merging results...");
        const context = this.buildContextFromAgents(workers);
        const reviewerPrompt = buildAgentPrompt("reviewer", `Review the following solutions from ${workers.length} worker agents and produce a unified, merged solution.\n\nORIGINAL TASK:\n${session.task}\n\nWORKER SOLUTIONS:\n${context}\n\nProduce a final merged solution that combines the best parts of each worker's output. Resolve any conflicts.`);
        const reviewer = this.createAgent("reviewer", "Reviewer", reviewerPrompt);
        session.agents.set(reviewer.id, reviewer);
        await this.createDevinSession(session, reviewer);
        await this.waitForAgents(session, [reviewer]);
        const solutions = this.extractSolutions([...workers, reviewer]);
        const result = this.buildResult(`Parallel decomposition completed: ${workers.length} workers + 1 reviewer. ${this.extractSummary(reviewer)}`, solutions, reviewer);
        this.emitter.notify(session.id, "collaboration_completed", "Parallel decomposition completed", {
            result: result.summary,
        });
        return result;
    }
    extractSubtasks(coordinator, numWorkers) {
        if (!coordinator.structuredOutput) {
            // If no structured output, split the task into generic subtasks
            return [session_task_fallback(coordinator.prompt, numWorkers)];
        }
        const output = coordinator.structuredOutput;
        if (output.subtasks && Array.isArray(output.subtasks) && output.subtasks.length > 0) {
            return output.subtasks;
        }
        // Fallback: use the summary and split
        if (output.summary) {
            return [output.summary];
        }
        return [coordinator.prompt];
    }
}
function session_task_fallback(prompt, numWorkers) {
    return `Execute the following task (worker in a ${numWorkers}-worker parallel decomposition):\n${prompt}`;
}
//# sourceMappingURL=parallel.js.map