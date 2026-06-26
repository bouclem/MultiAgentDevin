import { useMemo } from "react";
import type { BranchData, AgentData } from "../types";
import { ROLE_COLORS, STATUS_COLORS } from "../types";

interface NodeGraphProps {
  branches: BranchData[];
  agents: AgentData[];
}

interface GraphNode {
  branch: BranchData;
  agent?: AgentData;
  x: number;
  y: number;
  isRoot: boolean;
  isLeaf: boolean;
}

export function NodeGraph({ branches, agents }: NodeGraphProps) {
  const { nodes, edges, maxDepth } = useMemo(() => {
    if (branches.length === 0) {
      return { nodes: [] as GraphNode[], edges: [] as { from: string; to: string }[], maxDepth: 0 };
    }

    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Find root (parentId === null)
    const root = branches.find((b) => b.parentId === null);
    if (!root) {
      return { nodes: [] as GraphNode[], edges: [] as { from: string; to: string }[], maxDepth: 0 };
    }

    // Build adjacency list for traversal
    const childrenMap = new Map<string, string[]>();
    for (const b of branches) {
      if (b.parentId) {
        const siblings = childrenMap.get(b.parentId) ?? [];
        siblings.push(b.id);
        childrenMap.set(b.parentId, siblings);
      }
    }

    // BFS to assign x (depth) and y (vertical position) positions
    const positions = new Map<string, { x: number; y: number }>();
    const queue: { id: string; depth: number }[] = [{ id: root.id, depth: 0 }];
    const visited = new Set<string>();
    let maxDepthFound = 0;
    let leafIndex = 0;

    // First pass: assign depths
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const branch = branchMap.get(id);
      if (!branch) continue;

      if (depth > maxDepthFound) maxDepthFound = depth;

      const children = childrenMap.get(id) ?? [];
      for (const childId of children) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    }

    // Second pass: assign y positions to leaves, then propagate up
    const leaves = branches.filter(
      (b) => (childrenMap.get(b.id)?.length ?? 0) === 0
    );

    // Assign y positions to leaves first
    leaves.forEach((leaf, i) => {
      positions.set(leaf.id, { x: leaf.depth, y: i });
    });

    // Assign positions to non-leaves (center them over their children)
    const nodeYPositions = new Map<string, number>();
    for (const leaf of leaves) {
      nodeYPositions.set(leaf.id, leafIndex++);
    }

    // Process non-leaf nodes from deepest to shallowest
    const nonLeaves = branches
      .filter((b) => (childrenMap.get(b.id)?.length ?? 0) > 0)
      .sort((a, b) => b.depth - a.depth);

    for (const node of nonLeaves) {
      const children = childrenMap.get(node.id) ?? [];
      const childYs = children
        .map((cid) => positions.get(cid)?.y)
        .filter((y) => y !== undefined) as number[];
      if (childYs.length > 0) {
        const avgY = childYs.reduce((a, b) => a + b, 0) / childYs.length;
        positions.set(node.id, { x: node.depth, y: avgY });
      } else {
        positions.set(node.id, { x: node.depth, y: leafIndex++ });
      }
    }

    // Build nodes
    const nodeList: GraphNode[] = branches.map((b) => ({
      branch: b,
      agent: b.agentId ? agentMap.get(b.agentId) : undefined,
      x: positions.get(b.id)?.x ?? b.depth,
      y: positions.get(b.id)?.y ?? 0,
      isRoot: b.parentId === null,
      isLeaf: (childrenMap.get(b.id)?.length ?? 0) === 0,
    }));

    // Build edges
    const edgeList: { from: string; to: string }[] = [];
    for (const b of branches) {
      if (b.parentId) {
        edgeList.push({ from: b.parentId, to: b.id });
      }
    }

    return { nodes: nodeList, edges: edgeList, maxDepth: maxDepthFound };
  }, [branches, agents]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No branches yet. Start a collaboration to see the node graph.</p>
      </div>
    );
  }

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 80;
  const X_SPACING = 280;
  const Y_SPACING = 120;
  const PADDING = 40;

  const totalWidth = (maxDepth + 1) * X_SPACING + PADDING * 2;
  const maxNodesAtDepth = Math.max(
    ...Array.from({ length: maxDepth + 1 }, (_, depth) =>
      nodes.filter((n) => n.x === depth).length
    )
  );
  const totalHeight = Math.max(maxNodesAtDepth, 1) * Y_SPACING + PADDING * 2;

  const getX = (x: number) => PADDING + x * X_SPACING;
  const getY = (y: number) => PADDING + y * Y_SPACING;

  return (
    <div className="w-full h-full overflow-auto bg-gray-950 rounded-lg p-4">
      <div className="mb-3 flex items-center gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Eliminated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500" /> Merged
        </span>
        <span className="text-gray-600 ml-auto">
          Flows left → right from original branch
        </span>
      </div>

      <svg
        width={totalWidth}
        height={totalHeight}
        className="block"
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const fromNode = nodes.find((n) => n.branch.id === edge.from);
          const toNode = nodes.find((n) => n.branch.id === edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = getX(fromNode.x) + NODE_WIDTH;
          const y1 = getY(fromNode.y) + NODE_HEIGHT / 2;
          const x2 = getX(toNode.x);
          const y2 = getY(toNode.y) + NODE_HEIGHT / 2;

          const midX = (x1 + x2) / 2;
          const isEliminated = toNode.branch.status === "eliminated";

          return (
            <path
              key={`edge-${i}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={isEliminated ? "#ef4444" : "#3b82f6"}
              strokeWidth={2}
              strokeOpacity={isEliminated ? 0.4 : 0.6}
              strokeDasharray={isEliminated ? "4 4" : undefined}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const x = getX(node.x);
          const y = getY(node.y);
          const statusColor =
            STATUS_COLORS[node.branch.status] ?? "#6b7280";
          const roleColor = node.agent
            ? ROLE_COLORS[node.agent.role] ?? "#64748b"
            : "#6b7280";

          return (
            <g key={`node-${node.branch.id}`}>
              {/* Node background */}
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                fill="#1e293b"
                stroke={statusColor}
                strokeWidth={node.isRoot ? 3 : 2}
                strokeDasharray={
                  node.branch.status === "eliminated" ? "4 4" : undefined
                }
                opacity={node.branch.status === "eliminated" ? 0.5 : 1}
              />

              {/* Root indicator */}
              {node.isRoot && (
                <circle
                  cx={x + 12}
                  cy={y + 12}
                  r={5}
                  fill="#fbbf24"
                />
              )}

              {/* Branch name */}
              <text
                x={x + NODE_WIDTH / 2}
                y={y + 20}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={12}
                fontWeight="bold"
                className="truncate"
              >
                {node.branch.name.length > 22
                  ? node.branch.name.slice(0, 22) + "..."
                  : node.branch.name}
              </text>

              {/* Depth label */}
              <text
                x={x + 8}
                y={y + NODE_HEIGHT - 8}
                fill="#64748b"
                fontSize={10}
              >
                depth: {node.branch.depth}
              </text>

              {/* Agent role badge */}
              {node.agent && (
                <>
                  <rect
                    x={x + 8}
                    y={y + 30}
                    width={NODE_WIDTH - 16}
                    height={20}
                    rx={4}
                    fill={roleColor}
                    fillOpacity={0.2}
                    stroke={roleColor}
                    strokeWidth={1}
                  />
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={y + 44}
                    textAnchor="middle"
                    fill={roleColor}
                    fontSize={10}
                    fontWeight="600"
                  >
                    {node.agent.roleName}
                  </text>
                </>
              )}

              {/* Status indicator */}
              <circle
                cx={x + NODE_WIDTH - 12}
                cy={y + 12}
                r={5}
                fill={statusColor}
              />

              {/* Commit SHA */}
              {node.branch.commitSha && (
                <text
                  x={x + NODE_WIDTH - 8}
                  y={y + NODE_HEIGHT - 8}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize={9}
                >
                  {node.branch.commitSha.slice(0, 7)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
