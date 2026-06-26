import type { BranchNode, BranchTree, BranchStatus, BranchingStrategy } from "./types.js";
export declare class GitWorkspaceManager {
    private trees;
    createTree(collaborationId: string, rootBranchName?: string, strategy?: BranchingStrategy): BranchTree;
    getTree(collaborationId: string): BranchTree | undefined;
    /**
     * Split a branch into exactly 2 child branches.
     * This implements the binary tree branching strategy:
     *   1 branch → 2 branches → 4 branches → 8 branches → ...
     */
    splitBranch(collaborationId: string, parentBranchId: string, suffixes?: [string, string]): [BranchNode, BranchNode];
    /**
     * Split ALL active leaf branches at the current depth into 2 children each.
     * This creates the exponential branching pattern.
     */
    splitAllLeaves(collaborationId: string, suffixes?: [string, string]): BranchNode[];
    /**
     * Extend a branch by creating a single child branch.
     * This implements the linear branching strategy:
     *   original → step-1 → step-2 → step-3 → ...
     * Each branch builds on the previous one, flowing left-to-right.
     */
    extendBranch(collaborationId: string, parentBranchId: string, suffix?: string): BranchNode;
    /**
     * Extend the latest active leaf branch in a linear chain.
     * Finds the deepest active leaf and extends from it.
     */
    extendLatestLeaf(collaborationId: string, suffix?: string): BranchNode | undefined;
    /**
     * Get the linear chain of branches from root to the current leaf.
     * Returns branches ordered left-to-right (root first, leaf last).
     */
    getLinearChain(collaborationId: string): BranchNode[];
    /**
     * Get the branching strategy for a collaboration's tree.
     */
    getBranchingStrategy(collaborationId: string): BranchingStrategy;
    getBranch(collaborationId: string, branchId: string): BranchNode | undefined;
    getActiveBranches(collaborationId: string): BranchNode[];
    getActiveLeaves(collaborationId: string): BranchNode[];
    getBranchesAtDepth(collaborationId: string, depth: number): BranchNode[];
    getBranchPath(collaborationId: string, branchId: string): BranchNode[];
    getRoot(collaborationId: string): BranchNode | undefined;
    setBranchStatus(collaborationId: string, branchId: string, status: BranchStatus): void;
    /**
     * Eliminate a branch (mark as eliminated).
     * Returns the branch so the caller can use it for recycling.
     */
    eliminateBranch(collaborationId: string, branchId: string): BranchNode | undefined;
    /**
     * Merge a branch into its parent (mark as merged).
     */
    mergeBranch(collaborationId: string, branchId: string): void;
    /**
     * Archive a branch (no longer active, kept for history).
     */
    archiveBranch(collaborationId: string, branchId: string): void;
    assignAgentToBranch(collaborationId: string, branchId: string, agentId: string, sessionId?: string): void;
    updateBranchCommit(collaborationId: string, branchId: string, commitSha: string, commitMessage: string): void;
    getTreeAsObject(collaborationId: string): BranchNode | null;
    private buildTreeNode;
    getAllBranches(collaborationId: string): BranchNode[];
    /**
     * Generate git instructions for an agent to work on a specific branch.
     */
    getGitInstructions(branch: BranchNode, parentBranch?: BranchNode): string;
    /**
     * Get the "latest good" branch for an eliminated agent to be recycled to.
     * This finds the winning branch at the same depth or the parent branch.
     */
    getLatestGoodBranch(collaborationId: string, eliminatedBranchId: string): BranchNode | undefined;
}
//# sourceMappingURL=git-workspace.d.ts.map