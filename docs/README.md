# MultiAgentDevin

> Multi-agent collaboration plugin for [Devin](https://devin.ai) by Cognition, using the Model Context Protocol (MCP).

Inspired by [Thom Wolf's experiment](https://x.com/Thom_Wolf/status/2070134136304517284) where 100+ agents collaborated for a week to achieve a 5x improvement in vLLM inference speed for Gemma 4.

## What It Does

MultiAgentDevin wraps the Devin API to provide high-level multi-agent collaboration patterns. Any MCP-compatible client (Devin itself, Claude, Windsurf, etc.) can use it to orchestrate teams of Devin agents that work together on complex tasks.

## Features

### 6 Collaboration Patterns

| Pattern | Description |
|---|---|
| **Parallel Decomposition** | Coordinator breaks task → N workers solve in parallel → reviewer merges |
| **Debate/Consensus** | N specialists solve independently → reviewer picks best |
| **Pipeline** | Sequential handoff (e.g., architecture → code → test → security) |
| **Iterative Refinement** | Worker → reviewer → improve loop until quality threshold |
| **Tournament** | Agents compete in elimination rounds with binary tree branching |
| **Self-organizing Swarm** | Agents dynamically spawn sub-agents based on task complexity |

### Git Branching Strategies

**Binary Tree** (default) — exponential splitting:

```
Round 0: main (1 branch)
Round 1: main → branch-A, branch-B (2 branches)
Round 2: each splits → 4 branches
Round 3: each splits → 8 branches
```

**Linear** — left-to-right chain from original:

```
Step 0: original (1 branch)
Step 1: original → step-1 (1 branch)
Step 2: step-1 → step-2 (1 branch)
Step 3: step-2 → step-3 (1 branch)
```

Set `branchingStrategy: "binary-tree"` or `branchingStrategy: "linear"` in any tool.

### Tournament with Agent Recycling

Eliminated agents are **not removed** — they're **reassigned** to work on winning branches. This converges all compute toward the best solutions, similar to a genetic algorithm.

### Specialist Roles (20 total)

**Core Roles:**
- **Coordinator** — Task decomposition and result merging
- **Worker** — Code implementation
- **Reviewer** — Code review and scoring
- **Security Expert** — Vulnerability analysis
- **Performance Optimizer** — Profiling and optimization
- **Architecture Designer** — System design
- **Test Engineer** — Test coverage and edge cases
- **DevOps Specialist** — CI/CD and infrastructure

**AI Specialist Roles** (with mandatory benchmarking):
- **AI Researcher** — Literature review, technology evaluation
- **Inference Optimization Expert** — vLLM, TensorRT-LLM, quantization, KV cache
- **Training Optimization Expert** — DDP, FSDP, DeepSpeed, mixed precision
- **Data Scientist** — EDA, statistical modeling, feature engineering
- **ML Engineer** — MLOps, model deployment, pipeline design
- **Prompt Engineer** — Prompt design, few-shot, chain-of-thought
- **API Designer** — REST/GraphQL, OpenAPI specs
- **Database Optimization Expert** — Query optimization, indexing, schema design
- **Frontend Specialist** — React/Vue/Svelte, accessibility, Core Web Vitals
- **Backend Specialist** — Microservices, message queues, caching
- **Mobile Specialist** — iOS/Android, React Native, Flutter

**Custom** — User-defined roles with custom prompts

### Mandatory Benchmarking for AI Specialists

All AI specialist roles **must** run benchmarks before and after their work. Results are included in structured output:
```json
{
  "benchmark": {
    "benchmark_type": "inference_optimization",
    "before": { "tokens_per_second": 120, "latency_ms_p50": 85 },
    "after": { "tokens_per_second": 340, "latency_ms_p50": 28 },
    "improvement_percent": { "tokens_per_second": 183, "latency_ms_p50": 67 }
  }
}
```

### Pattern Templates

Save and replay successful collaboration configurations.

### Real-time Web Dashboard

Visualize agent collaboration at `http://localhost:3456`:
- Overview with agent stats and round progress
- Binary tree branch visualization
- **Node Graph** — left-to-right DAG flowing from original branch
- Tournament bracket with elimination/recycling indicators
- Live event feed

### Multi-Source Authentication (v1.1.0)

The plugin automatically resolves the API key from the MCP client — no `.env` required. See [Authentication Methods](#authentication-methods-in-priority-order) below for details.

Supports both v1 (`apk_` prefix) and v3 (`cog_` prefix) API keys with automatic detection.
Enterprise accounts can set `DEVIN_ORG_ID` for the `X-Org-Id` header.

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd MultiAgentDevin

# Install dependencies
npm install

# Build
npm run build
```

That's it — no `.env` file needed. The API key is provided by the MCP client at runtime (see [MCP Configuration](#mcp-configuration) below).

Get your Devin API key from [app.devin.ai/settings/api-keys](https://app.devin.ai/settings/api-keys).

### Authentication Methods (in priority order)

The plugin resolves the API key automatically from the first available source:

1. **MCP client env** (primary) — the MCP client passes `DEVIN_API_KEY` from `mcp_config.json` `env` block. **This is how it works in production — no `.env` needed.**
2. **File-based** — `~/.devin/api_key` (for users who prefer not to put keys in config files)
3. **Devin Desktop config** — auto-scanned from `~/.codeium/windsurf/mcp_config.json`
4. **`.env` file** (fallback, optional) — only useful for standalone `node dist/index.js` testing without an MCP client

> **You do NOT need a `.env` file.** The MCP client handles authentication automatically.

## MCP Configuration

### Devin Desktop (ex-Windsurf)

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "multi-agent-devin": {
      "command": "node",
      "args": ["/path/to/MultiAgentDevin/dist/index.js"],
      "env": {
        "DEVIN_API_KEY": "cog_your_key",
        "DEVIN_ORG_ID": "your_org_id"
      }
    }
  }
}
```

Or use config interpolation to avoid hardcoding secrets:

```json
{
  "mcpServers": {
    "multi-agent-devin": {
      "command": "node",
      "args": ["/path/to/MultiAgentDevin/dist/index.js"],
      "env": {
        "DEVIN_API_KEY": "${file:~/.devin/api_key}"
      }
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "multi-agent-devin": {
      "command": "node",
      "args": ["/path/to/MultiAgentDevin/dist/index.js"],
      "env": {
        "DEVIN_API_KEY": "apk_user_your_key"
      }
    }
  }
}
```

### Devin MCP

Add MultiAgentDevin as an MCP server in your Devin organization settings.

## MCP Tools

| Tool | Description |
|---|---|
| `multi_agent_collaborate` | Main orchestration tool with pattern selector |
| `create_agent_team` | Create a team with specific specialist roles |
| `agent_debate` | Multiple agents solve the same problem independently |
| `parallel_code_review` | Multiple specialist reviewers from different angles |
| `iterative_improve` | Write → critique → improve loop |
| `tournament` | Elimination tournament with agent recycling |
| `swarm_solve` | Self-organizing swarm with dynamic sub-agent spawning |
| `get_team_status` | Check status of all agents in a collaboration |
| `save_pattern_template` | Save a collaboration as reusable template |
| `run_pattern_template` | Execute a saved template |

## Usage Examples

### Tournament (8 agents, 3 rounds, binary tree)

```
Use the tournament tool with:
- task: "Optimize the database query performance in our API"
- numAgents: 8
- numRounds: 3
- recycleEliminatedAgents: true
- branchingStrategy: "binary-tree"
```

### Linear Branching Pipeline (left-to-right)

```
Use multi_agent_collaborate with:
- task: "Iteratively optimize vLLM inference for Gemma 4"
- pattern: "pipeline"
- specialistRoles: ["researcher", "inference-optimizer", "training-optimizer"]
- branchingStrategy: "linear"
- enableBenchmarking: true
```

### Parallel Code Review

```
Use parallel_code_review with:
- task: "Review PR #249 for security, performance, and architecture"
- specialistRoles: ["security", "performance", "architecture"]
```

### Self-organizing Swarm

```
Use swarm_solve with:
- task: "Debug and fix the intermittent 500 errors in production"
- initialAgents: 3
- maxDepth: 3
```

## Dashboard Development

```bash
# Install dashboard dependencies
cd dashboard
npm install

# Run dashboard dev server (proxies to MCP server)
npm run dev

# Build dashboard for production
npm run build
```

## Architecture

```
MCP Client (Devin Desktop/Claude/Devin)
    ↓ (MCP protocol)
MultiAgentDevin MCP Server (src/index.ts)
    ├── Auth Manager (src/auth.ts) — multi-source key resolution
    ├── Devin API Client (src/devin-client.ts) — v1 & v3 API
    ├── Orchestrator (src/orchestrator.ts)
    │   ├── Parallel Pattern
    │   ├── Debate Pattern
    │   ├── Pipeline Pattern
    │   ├── Iterative Pattern
    │   ├── Tournament Pattern
    │   └── Swarm Pattern
    ├── Git Workspace Manager (src/git-workspace.ts)
    │   ├── Binary Tree Branching (1→2→4→8)
    │   └── Linear Branching (1→1→1→1, left-to-right)
    ├── Roles (src/roles.ts) — 20 specialist roles with benchmarking
    ├── Template Manager (src/templates.ts)
    └── Dashboard Server (src/dashboard/)
        ├── WebSocket (real-time events)
        └── HTTP API (session data)
    ↓ (Devin REST API v1/v3)
Multiple Devin Sessions (parallel)
```

## Tech Stack

- **TypeScript + Node.js** — MCP server
- **Devin REST API v1 & v3** — Agent session management
- **React + TailwindCSS + Vite** — Web dashboard
- **WebSocket** — Real-time dashboard updates
- **Zod** — Schema validation

## License

MIT
