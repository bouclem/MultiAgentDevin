// ============================================================================
// MultiAgentDevin — Shared Types
// ============================================================================

// --- Enums & Constants ------------------------------------------------------

export type CollaborationPattern =
  | "parallel"
  | "debate"
  | "pipeline"
  | "iterative"
  | "tournament"
  | "swarm";

export type AgentRole =
  | "coordinator"
  | "worker"
  | "reviewer"
  | "security"
  | "performance"
  | "architecture"
  | "testing"
  | "devops"
  // AI specialist roles (v1.1.0)
  | "researcher"
  | "inference-optimizer"
  | "training-optimizer"
  | "data-scientist"
  | "ml-engineer"
  | "prompt-engineer"
  | "api-designer"
  | "database-optimizer"
  | "frontend-specialist"
  | "backend-specialist"
  | "mobile-specialist"
  | "custom";

export type SessionStatus =
  | "created"
  | "working"
  | "blocked"
  | "expired"
  | "finished"
  | "suspend_requested"
  | "suspend_requested_frontend"
  | "resume_requested"
  | "resume_requested_frontend"
  | "resumed"
  | "sleeping"
  | "errored";

export type BranchStatus = "active" | "eliminated" | "merged" | "archived";

export type BranchingStrategy = "binary-tree" | "linear";

// --- Agent ------------------------------------------------------------------

export interface AgentConfig {
  id: string;
  role: AgentRole;
  roleName: string;
  prompt: string;
  playbookId?: string;
  tags?: string[];
  maxAcuLimit?: number;
  repos?: string[];
}

export interface Agent extends AgentConfig {
  sessionId?: string;
  sessionUrl?: string;
  status: SessionStatus;
  branchId?: string;
  branchName?: string;
  parentBranchId?: string;
  structuredOutput?: Record<string, unknown>;
  messages?: SessionMessage[];
  acusConsumed?: number;
  createdAt: number;
  updatedAt: number;
}

// --- Git Branch Tree --------------------------------------------------------

export interface BranchNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  status: BranchStatus;
  agentId?: string;
  sessionId?: string;
  childrenIds: string[];
  commitSha?: string;
  commitMessage?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface BranchTree {
  rootId: string;
  branches: Map<string, BranchNode>;
  currentRound: number;
  maxDepth: number;
}

// --- Collaboration Session --------------------------------------------------

export interface CollaborationSession {
  id: string;
  pattern: CollaborationPattern;
  task: string;
  agents: Map<string, Agent>;
  branchTree: BranchTree;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  rounds: CollaborationRound[];
  currentRoundIndex: number;
  config: CollaborationConfig;
  result?: CollaborationResult;
  createdAt: number;
  updatedAt: number;
}

export interface CollaborationRound {
  index: number;
  status: "pending" | "running" | "completed" | "failed";
  agentIds: string[];
  eliminatedAgentIds: string[];
  recycledAgentIds: string[];
  branchIds: string[];
  startedAt?: number;
  completedAt?: number;
  summary?: string;
}

export interface CollaborationResult {
  summary: string;
  bestSolution?: string;
  bestSessionId?: string;
  bestBranchId?: string;
  allSolutions: AgentSolution[];
  metrics?: Record<string, number>;
}

export interface AgentSolution {
  agentId: string;
  sessionId?: string;
  branchId?: string;
  score?: number;
  summary: string;
  structuredOutput?: Record<string, unknown>;
  prUrl?: string;
}

// --- Configuration ----------------------------------------------------------

export interface CollaborationConfig {
  pattern: CollaborationPattern;
  task: string;
  numWorkers?: number;
  numRounds?: number;
  specialistRoles?: AgentRole[];
  repos?: string[];
  playbookId?: string;
  maxAcuLimit?: number;
  useBinaryTreeBranching?: boolean;
  branchingStrategy?: BranchingStrategy;
  recycleEliminatedAgents?: boolean;
  qualityThreshold?: number;
  pollIntervalMs?: number;
  customRolePrompts?: Record<string, string>;
  dashboardEnabled?: boolean;
  enableBenchmarking?: boolean;
}

// --- Pattern Template -------------------------------------------------------

export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  pattern: CollaborationPattern;
  config: Omit<CollaborationConfig, "task" | "pattern">;
  createdAt: number;
  updatedAt: number;
}

// --- Devin API Types --------------------------------------------------------

export interface DevinSessionResponse {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages?: SessionMessage[];
  playbook_id?: string;
  pull_request?: { url: string };
  snapshot_id?: string;
  structured_output?: Record<string, unknown> | null;
  tags?: string[];
  title?: string;
  url?: string;
  acus_consumed?: number;
  org_id?: string;
  child_session_ids?: string[];
  parent_session_id?: string;
}

export interface SessionMessage {
  type: "user_message" | "devin_message" | "plan" | "command";
  content: string;
  timestamp?: string;
  attachments?: string[];
}

export interface CreateSessionParams {
  prompt: string;
  playbook_id?: string;
  tags?: string[];
  max_acu_limit?: number;
  repos?: string[];
  structured_output_required?: boolean;
  structured_output_schema?: Record<string, unknown>;
  title?: string;
  idempotent?: boolean;
  bypass_approval?: boolean;
}

// --- Dashboard Events -------------------------------------------------------

export type DashboardEventType =
  | "session_created"
  | "session_updated"
  | "agent_created"
  | "agent_status_changed"
  | "round_started"
  | "round_completed"
  | "branch_created"
  | "branch_updated"
  | "branch_eliminated"
  | "message_sent"
  | "collaboration_started"
  | "collaboration_completed"
  | "collaboration_failed"
  | "agent_recycled"
  | "log";

export interface DashboardEvent {
  type: DashboardEventType;
  timestamp: number;
  collaborationId: string;
  data: Record<string, unknown>;
  message?: string;
}

// --- Benchmark Types (v1.1.0) -----------------------------------------------

export interface BenchmarkResult {
  agentId: string;
  role: AgentRole;
  benchmarkType: string;
  metrics: BenchmarkMetric[];
  beforeValues?: Record<string, number>;
  afterValues?: Record<string, number>;
  improvementPercent?: Record<string, number>;
  timestamp: number;
}

export interface BenchmarkMetric {
  name: string;
  value: number;
  unit: string;
  description?: string;
  higherIsBetter?: boolean;
}

export interface AgentBenchmark {
  agentId: string;
  role: AgentRole;
  benchmarks: BenchmarkResult[];
}
