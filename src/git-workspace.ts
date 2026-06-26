// ============================================================================
// MultiAgentDevin — Git Workspace Manager with Binary Tree Branching
// ============================================================================

import type { BranchNode, BranchTree, BranchStatus, BranchingStrategy } from "./types.js";

// ---------------------------------------------------------------------------
// ID Generator
// ---------------------------------------------------------------------------

let branchCounter = 0;

function generateBranchId(): string {
  branchCounter++;
  return `branch-${Date.now().toString(36)}-${branchCounter}`;
}

function sanitizeBranchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// GitWorkspaceManager
// ---------------------------------------------------------------------------

export class GitWorkspaceManager {
  private trees: Map<string, BranchTree> = new Map();

  // --- Tree Creation --------------------------------------------------------

  createTree(
    collaborationId: string,
    rootBranchName?: string,
    strategy?: BranchingStrategy
  ): BranchTree {
    const rootId = generateBranchId();
    const rootName = sanitizeBranchName(rootBranchName ?? "main");

    const root: BranchNode = {
      id: rootId,
      name: rootName,
      parentId: null,
      depth: 0,
      status: "active",
      childrenIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { strategy: strategy ?? "binary-tree" },
    };

    const tree: BranchTree = {
      rootId,
      branches: new Map([[rootId, root]]),
      currentRound: 0,
      maxDepth: 0,
    };

    this.trees.set(collaborationId, tree);
    return tree;
  }

  getTree(collaborationId: string): BranchTree | undefined {
    return this.trees.get(collaborationId);
  }

  // --- Binary Tree Branching ------------------------------------------------

  /**
   * Split a branch into exactly 2 child branches.
   * This implements the binary tree branching strategy:
   *   1 branch → 2 branches → 4 branches → 8 branches → ...
   */
  splitBranch(
    collaborationId: string,
    parentBranchId: string,
    suffixes?: [string, string]
  ): [BranchNode, BranchNode] {
    const tree = this.trees.get(collaborationId);
    if (!tree) throw new Error(`No tree found for collaboration ${collaborationId}`);

    const parent = tree.branches.get(parentBranchId);
    if (!parent) throw new Error(`Branch ${parentBranchId} not found`);

    const [suffixA, suffixB] = suffixes ?? ["a", "b"];
    const depth = parent.depth + 1;

    const childA: BranchNode = {
      id: generateBranchId(),
      name: `${parent.name}-${suffixA}`,
      parentId: parentBranchId,
      depth,
      status: "active",
      childrenIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const childB: BranchNode = {
      id: generateBranchId(),
      name: `${parent.name}-${suffixB}`,
      parentId: parentBranchId,
      depth,
      status: "active",
      childrenIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    parent.childrenIds = [childA.id, childB.id];
    parent.updatedAt = Date.now();

    tree.branches.set(childA.id, childA);
    tree.branches.set(childB.id, childB);

    if (depth > tree.maxDepth) {
      tree.maxDepth = depth;
    }

    return [childA, childB];
  }

  /**
   * Split ALL active leaf branches at the current depth into 2 children each.
   * This creates the exponential branching pattern.
   */
  splitAllLeaves(
    collaborationId: string,
    suffixes?: [string, string]
  ): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) throw new Error(`No tree found for collaboration ${collaborationId}`);

    const leaves = this.getActiveLeaves(collaborationId);
    const newBranches: BranchNode[] = [];

    for (const leaf of leaves) {
      const [childA, childB] = this.splitBranch(
        collaborationId,
        leaf.id,
        suffixes
      );
      newBranches.push(childA, childB);
    }

    tree.currentRound++;
    return newBranches;
  }

  // --- Linear Branching (v1.1.0) --------------------------------------------

  /**
   * Extend a branch by creating a single child branch.
   * This implements the linear branching strategy:
   *   original → step-1 → step-2 → step-3 → ...
   * Each branch builds on the previous one, flowing left-to-right.
   */
  extendBranch(
    collaborationId: string,
    parentBranchId: string,
    suffix?: string
  ): BranchNode {
    const tree = this.trees.get(collaborationId);
    if (!tree) throw new Error(`No tree found for collaboration ${collaborationId}`);

    const parent = tree.branches.get(parentBranchId);
    if (!parent) throw new Error(`Branch ${parentBranchId} not found`);

    const depth = parent.depth + 1;
    const stepSuffix = suffix ?? `step-${depth}`;

    const child: BranchNode = {
      id: generateBranchId(),
      name: `${parent.name}-${stepSuffix}`,
      parentId: parentBranchId,
      depth,
      status: "active",
      childrenIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { strategy: "linear" },
    };

    parent.childrenIds = [child.id];
    parent.updatedAt = Date.now();

    tree.branches.set(child.id, child);

    if (depth > tree.maxDepth) {
      tree.maxDepth = depth;
    }

    tree.currentRound++;
    return child;
  }

  /**
   * Extend the latest active leaf branch in a linear chain.
   * Finds the deepest active leaf and extends from it.
   */
  extendLatestLeaf(
    collaborationId: string,
    suffix?: string
  ): BranchNode | undefined {
    const leaves = this.getActiveLeaves(collaborationId);
    if (leaves.length === 0) return undefined;

    // For linear mode, there should be exactly 1 active leaf.
    // If multiple exist (e.g., after switching from binary tree), pick the deepest.
    const deepest = leaves.reduce((a, b) =>
      a.depth >= b.depth ? a : b
    );

    return this.extendBranch(collaborationId, deepest.id, suffix);
  }

  /**
   * Get the linear chain of branches from root to the current leaf.
   * Returns branches ordered left-to-right (root first, leaf last).
   */
  getLinearChain(collaborationId: string): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];

    // Find the deepest active leaf
    const leaves = this.getActiveLeaves(collaborationId);
    if (leaves.length === 0) return [];

    const deepest = leaves.reduce((a, b) =>
      a.depth >= b.depth ? a : b
    );

    // Walk back to root
    return this.getBranchPath(collaborationId, deepest.id);
  }

  /**
   * Get the branching strategy for a collaboration's tree.
   */
  getBranchingStrategy(collaborationId: string): BranchingStrategy {
    const tree = this.trees.get(collaborationId);
    if (!tree) return "binary-tree";
    const root = tree.branches.get(tree.rootId);
    return (root?.metadata?.strategy as BranchingStrategy) ?? "binary-tree";
  }

  // --- Branch Queries -------------------------------------------------------

  getBranch(collaborationId: string, branchId: string): BranchNode | undefined {
    const tree = this.trees.get(collaborationId);
    return tree?.branches.get(branchId);
  }

  getActiveBranches(collaborationId: string): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];
    return [...tree.branches.values()].filter((b) => b.status === "active");
  }

  getActiveLeaves(collaborationId: string): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];
    return [...tree.branches.values()].filter(
      (b) => b.status === "active" && b.childrenIds.length === 0
    );
  }

  getBranchesAtDepth(collaborationId: string, depth: number): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];
    return [...tree.branches.values()].filter(
      (b) => b.depth === depth && b.status === "active"
    );
  }

  getBranchPath(collaborationId: string, branchId: string): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];

    const path: BranchNode[] = [];
    let current: BranchNode | undefined = tree.branches.get(branchId);

    while (current) {
      path.unshift(current);
      current = current.parentId
        ? tree.branches.get(current.parentId)
        : undefined;
    }

    return path;
  }

  getRoot(collaborationId: string): BranchNode | undefined {
    const tree = this.trees.get(collaborationId);
    if (!tree) return undefined;
    return tree.branches.get(tree.rootId);
  }

  // --- Branch Status Management ---------------------------------------------

  setBranchStatus(
    collaborationId: string,
    branchId: string,
    status: BranchStatus
  ): void {
    const tree = this.trees.get(collaborationId);
    if (!tree) return;

    const branch = tree.branches.get(branchId);
    if (!branch) return;

    branch.status = status;
    branch.updatedAt = Date.now();
  }

  /**
   * Eliminate a branch (mark as eliminated).
   * Returns the branch so the caller can use it for recycling.
   */
  eliminateBranch(collaborationId: string, branchId: string): BranchNode | undefined {
    const tree = this.trees.get(collaborationId);
    if (!tree) return undefined;

    const branch = tree.branches.get(branchId);
    if (!branch) return undefined;

    branch.status = "eliminated";
    branch.updatedAt = Date.now();
    return branch;
  }

  /**
   * Merge a branch into its parent (mark as merged).
   */
  mergeBranch(collaborationId: string, branchId: string): void {
    const tree = this.trees.get(collaborationId);
    if (!tree) return;

    const branch = tree.branches.get(branchId);
    if (!branch) return;

    branch.status = "merged";
    branch.updatedAt = Date.now();
  }

  /**
   * Archive a branch (no longer active, kept for history).
   */
  archiveBranch(collaborationId: string, branchId: string): void {
    this.setBranchStatus(collaborationId, branchId, "archived");
  }

  // --- Agent Assignment -----------------------------------------------------

  assignAgentToBranch(
    collaborationId: string,
    branchId: string,
    agentId: string,
    sessionId?: string
  ): void {
    const tree = this.trees.get(collaborationId);
    if (!tree) return;

    const branch = tree.branches.get(branchId);
    if (!branch) return;

    branch.agentId = agentId;
    branch.sessionId = sessionId;
    branch.updatedAt = Date.now();
  }

  updateBranchCommit(
    collaborationId: string,
    branchId: string,
    commitSha: string,
    commitMessage: string
  ): void {
    const tree = this.trees.get(collaborationId);
    if (!tree) return;

    const branch = tree.branches.get(branchId);
    if (!branch) return;

    branch.commitSha = commitSha;
    branch.commitMessage = commitMessage;
    branch.updatedAt = Date.now();
  }

  // --- Tree Visualization (for dashboard) -----------------------------------

  getTreeAsObject(collaborationId: string): BranchNode | null {
    const tree = this.trees.get(collaborationId);
    if (!tree) return null;

    const root = tree.branches.get(tree.rootId);
    if (!root) return null;

    return this.buildTreeNode(collaborationId, root);
  }

  private buildTreeNode(
    collaborationId: string,
    branch: BranchNode
  ): BranchNode {
    const tree = this.trees.get(collaborationId);
    if (!tree) return branch;

    const result = { ...branch };
    // Note: children are accessible via childrenIds
    // The dashboard will use childrenIds to look up full nodes
    return result;
  }

  getAllBranches(collaborationId: string): BranchNode[] {
    const tree = this.trees.get(collaborationId);
    if (!tree) return [];
    return [...tree.branches.values()];
  }

  // --- Git Instructions for Agents ------------------------------------------

  /**
   * Generate git instructions for an agent to work on a specific branch.
   */
  getGitInstructions(branch: BranchNode, parentBranch?: BranchNode): string {
    const strategy = branch.metadata?.strategy as string | undefined;

    if (!parentBranch) {
      return `You are working on the root branch: ${branch.name}.
This is the ORIGINAL starting point. All work flows from here.
Create your work directly on this branch. Make commits as you progress.`;
    }

    if (strategy === "linear") {
      return `You are working on branch: ${branch.name}
This branch extends from: ${parentBranch.name}

LINEAR BRANCHING — Git instructions:
1. Make sure you are on branch ${parentBranch.name} with the latest work
2. Create a new branch: git checkout -b ${branch.name}
3. Do your work on this branch, building upon what ${parentBranch.name} already has
4. Commit your changes regularly with clear commit messages
5. Your branch is the next step in a left-to-right chain: ${parentBranch.name} → ${branch.name}
6. Each step builds on the previous one — do not start from scratch`;
    }

    return `You are working on branch: ${branch.name}
This branch was split from: ${parentBranch.name}

BINARY TREE BRANCHING — Git instructions:
1. Make sure you are on branch ${parentBranch.name} with the latest work
2. Create a new branch: git checkout -b ${branch.name}
3. Do your work on this branch
4. Commit your changes regularly with clear commit messages
5. Your branch builds upon the work from ${parentBranch.name}`;
  }

  /**
   * Get the "latest good" branch for an eliminated agent to be recycled to.
   * This finds the winning branch at the same depth or the parent branch.
   */
  getLatestGoodBranch(
    collaborationId: string,
    eliminatedBranchId: string
  ): BranchNode | undefined {
    const tree = this.trees.get(collaborationId);
    if (!tree) return undefined;

    const eliminatedBranch = tree.branches.get(eliminatedBranchId);
    if (!eliminatedBranch) return undefined;

    // Find active branches at the same depth
    const sameDepthActive = this.getBranchesAtDepth(
      collaborationId,
      eliminatedBranch.depth
    );

    if (sameDepthActive.length > 0) {
      // Pick the first active branch at the same depth (the "winner")
      return sameDepthActive[0];
    }

    // Fall back to parent branch
    if (eliminatedBranch.parentId) {
      const parent = tree.branches.get(eliminatedBranch.parentId);
      if (parent && parent.status === "active") {
        return parent;
      }
    }

    // Fall back to root
    return this.getRoot(collaborationId);
  }
}
