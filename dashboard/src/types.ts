// Dashboard shared types

export interface AgentData {
  id: string;
  role: string;
  roleName: string;
  status: string;
  branchId?: string;
  branchName?: string;
  sessionId?: string;
  acusConsumed?: number;
}

export interface BranchData {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  status: string;
  agentId?: string;
  childrenIds: string[];
  commitSha?: string;
}

export interface RoundData {
  index: number;
  status: string;
  agentIds: string[];
  eliminatedAgentIds: string[];
  recycledAgentIds: string[];
}

export interface SessionData {
  id: string;
  pattern: string;
  task: string;
  status: string;
  currentRound: number;
  totalRounds: number;
  agents: AgentData[];
  branches: BranchData[];
  rounds: RoundData[];
  createdAt: number;
  updatedAt: number;
}

export interface DashboardEvent {
  type: string;
  timestamp: number;
  collaborationId: string;
  data: Record<string, unknown>;
  message?: string;
}

export const ROLE_COLORS: Record<string, string> = {
  coordinator: "#6366f1",
  worker: "#3b82f6",
  reviewer: "#f59e0b",
  security: "#ef4444",
  performance: "#10b981",
  architecture: "#8b5cf6",
  testing: "#06b6d4",
  devops: "#f97316",
  custom: "#64748b",
  // AI specialist roles (v1.1.0)
  researcher: "#a78bfa",
  "inference-optimizer": "#22d3ee",
  "training-optimizer": "#34d399",
  "data-scientist": "#60a5fa",
  "ml-engineer": "#c084fc",
  "prompt-engineer": "#fbbf24",
  "api-designer": "#f472b6",
  "database-optimizer": "#2dd4bf",
  "frontend-specialist": "#818cf8",
  "backend-specialist": "#fb923c",
  "mobile-specialist": "#94a3b8",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  running: "#3b82f6",
  working: "#3b82f6",
  created: "#6366f1",
  finished: "#10b981",
  completed: "#10b981",
  failed: "#ef4444",
  errored: "#ef4444",
  expired: "#ef4444",
  blocked: "#f59e0b",
  eliminated: "#ef4444",
  active: "#10b981",
  merged: "#8b5cf6",
  archived: "#6b7280",
  sleeping: "#6b7280",
  cancelled: "#6b7280",
};

export const PATTERN_ICONS: Record<string, string> = {
  parallel: "🔀",
  debate: "🗣️",
  pipeline: "🔗",
  iterative: "🔄",
  tournament: "🏆",
  swarm: "🐝",
};
