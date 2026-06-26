# CHANGELOG

## v1.1.0 — 2026-06-26

### Added

- **Multi-source authentication** (no more .env-only):
  - MCP client env interpolation (`${env:VAR_NAME}`, `${file:~/path}`)
  - File-based key (`~/.devin/api_key` or `DEVIN_API_KEY_FILE`)
  - Devin Desktop (ex-Windsurf) native config auto-detection (`~/.codeium/windsurf/mcp_config.json`)
  - Can reuse the Devin MCP server's `Authorization` header key
  - `.env` still works as fallback (backward compatible)

- **Devin API v3 support**:
  - Auto-detects API version from key prefix (`cog_` → v3, `apk_` → v1)
  - v3 uses `/v3/organizations/{orgId}/sessions` endpoints
  - `X-Org-Id` header for enterprise accounts
  - New `AuthManager` class (`src/auth.ts`) handles all resolution

- **11 new AI specialist roles** (20 total):
  - AI Researcher — literature review, technology evaluation
  - Inference Optimization Expert — vLLM, TensorRT-LLM, quantization, KV cache
  - Training Optimization Expert — DDP, FSDP, DeepSpeed, mixed precision
  - Data Scientist — EDA, statistical modeling, feature engineering
  - ML Engineer — MLOps, model deployment, pipeline design
  - Prompt Engineer — prompt design, few-shot, chain-of-thought
  - API Designer — REST/GraphQL, OpenAPI specs
  - Database Optimization Expert — query optimization, indexing, schema design
  - Frontend Specialist — React/Vue/Svelte, accessibility, Core Web Vitals
  - Backend Specialist — microservices, message queues, caching
  - Mobile Specialist — iOS/Android, React Native, Flutter

- **Mandatory benchmarking for AI specialist roles**:
  - All AI specialists must run before/after benchmarks
  - Structured output includes `benchmark` object with metrics, before/after values, improvement percentages
  - `requiresBenchmarking()` helper and `BENCHMARK_REQUIRED_ROLES` list
  - `enableBenchmarking` config option (default true)
  - Benchmark types: `BenchmarkResult`, `BenchmarkMetric`, `AgentBenchmark`

- **Linear branching strategy** (alternative to binary tree):
  - `branchingStrategy: "linear"` — starts from 1 "original" branch, extends left-to-right (1→1→1→1)
  - `extendBranch()` and `extendLatestLeaf()` methods in `GitWorkspaceManager`
  - `getLinearChain()` returns ordered root-to-leaf chain
  - `getBranchingStrategy()` detects strategy from tree metadata
  - Git instructions adapted for linear vs binary-tree mode

- **Left-to-right Node Graph dashboard view**:
  - New `NodeGraph.tsx` component with SVG-based DAG visualization
  - Nodes flow left-to-right from the original root branch
  - Shows branch names, agent roles, status indicators, commit SHAs
  - Curved edges with eliminated branches dashed/faded
  - Root branch marked with gold indicator
  - Accessible via "Node Graph" tab in dashboard header

- **Updated tool schemas**: All MCP tools now accept `branchingStrategy` and `enableBenchmarking`

### Changed

- `createDevinClient()` now uses `AuthManager.resolve()` instead of direct env var access
- Server version bumped to 1.1.0
- `.env.example` updated with multi-source auth documentation and new options
- `CollaborationConfig` type extended with `branchingStrategy` and `enableBenchmarking` fields
- `AgentRole` type extended with 11 new AI specialist roles
- `STRUCTURED_OUTPUT_SCHEMA` extended with `benchmark` field
- `buildAgentPrompt()` adds benchmarking reminder for AI specialist roles

## v1.0.0 — 2026-06-26

### Added

- **6 collaboration patterns**:
  - Parallel Decomposition (coordinator → workers → reviewer)
  - Debate/Consensus (specialists solve independently → reviewer picks best)
  - Pipeline (sequential handoff with context)
  - Iterative Refinement (write → critique → improve loop with quality threshold)
  - Tournament (elimination rounds with binary tree branching and agent recycling)
  - Self-organizing Swarm (dynamic sub-agent spawning based on task complexity)

- **10 MCP tools**:
  - `multi_agent_collaborate` — Main orchestration with pattern selector
  - `create_agent_team` — Create team with specialist roles
  - `agent_debate` — Multiple agents solve same problem
  - `parallel_code_review` — Multiple specialist reviewers
  - `iterative_improve` — Write → critique → improve loop
  - `tournament` — Elimination tournament with agent recycling
  - `swarm_solve` — Self-organizing swarm
  - `get_team_status` — Check all agents in a collaboration
  - `save_pattern_template` — Save collaboration as reusable template
  - `run_pattern_template` — Execute a saved template

- **Binary tree Git branching**: 1 → 2 → 4 → 8 branches, each building on parent's work

- **Tournament agent recycling**: Eliminated agents reassigned to winning branches (not removed)

- **9 specialist roles**: Coordinator, Worker, Reviewer, Security Expert, Performance Optimizer, Architecture Designer, Test Engineer, DevOps Specialist, Custom

- **Pattern templates**: Save and replay collaboration configurations, with 6 preset templates included

- **Real-time web dashboard** (React + TailwindCSS):
  - Overview view with agent stats and round progress
  - Binary tree branch visualization
  - Tournament bracket with elimination/recycling indicators
  - Live event feed via WebSocket

- **Devin API client** with session creation, messaging, polling, and structured output support

- **6 preset templates**: Parallel Migration, Code Review Panel, Tournament Optimization, Swarm Debugging, Iterative Refinement, Full Pipeline
