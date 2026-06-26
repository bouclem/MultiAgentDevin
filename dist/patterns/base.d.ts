import type { Agent, AgentRole, CollaborationConfig, CollaborationResult, CollaborationSession, AgentSolution } from "../types.js";
import type { DevinClient } from "../devin-client.js";
import type { GitWorkspaceManager } from "../git-workspace.js";
import type { CollaborationEventEmitter } from "../dashboard/events.js";
export declare abstract class PatternBase {
    protected client: DevinClient;
    protected gitWorkspace: GitWorkspaceManager;
    protected emitter: CollaborationEventEmitter;
    protected config: CollaborationConfig;
    constructor(client: DevinClient, gitWorkspace: GitWorkspaceManager, emitter: CollaborationEventEmitter, config: CollaborationConfig);
    abstract execute(session: CollaborationSession): Promise<CollaborationResult>;
    protected createAgent(role: AgentRole, roleName: string, prompt: string, branchId?: string, branchName?: string, parentBranchId?: string): Agent;
    protected createDevinSession(session: CollaborationSession, agent: Agent): Promise<Agent>;
    protected waitForAgents(session: CollaborationSession, agents: Agent[]): Promise<void>;
    protected extractSolutions(agents: Agent[]): AgentSolution[];
    protected extractScore(agent: Agent): number | undefined;
    protected extractSummary(agent: Agent): string;
    protected buildResult(summary: string, solutions: AgentSolution[], bestAgent?: Agent): CollaborationResult;
    protected setupBinaryTreeBranches(session: CollaborationSession, numAgents: number): {
        agents: Array<{
            branchId: string;
            branchName: string;
            parentBranchId?: string;
        }>;
    };
    protected buildContextFromAgents(agents: Agent[]): string;
}
//# sourceMappingURL=base.d.ts.map