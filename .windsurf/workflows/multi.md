---
description: Start a multi-agent collaboration using the MultiAgentDevin plugin
---

# Multi-Agent Collaboration

Start a multi-agent collaboration using one of the available patterns.

## Step 1: Determine the pattern

Ask the user which collaboration pattern they want to use:

1. **Parallel** — Coordinator splits task, workers solve in parallel, reviewer merges
2. **Debate** — Multiple specialists solve independently, reviewer picks best
3. **Pipeline** — Sequential handoff (architecture → code → test → security)
4. **Iterative** — Write → critique → improve loop until quality threshold
5. **Tournament** — Agents compete in elimination rounds with binary tree branching
6. **Swarm** — Self-organizing swarm that dynamically spawns sub-agents

If the user doesn't specify, recommend a pattern based on the task.

## Step 2: Gather parameters

Collect the following from the user (use defaults if not specified):

- **task** (required) — The task description
- **branchingStrategy** — "binary-tree" (default) or "linear" (left-to-right chain)
- **specialistRoles** — Which AI specialist roles to use (e.g., researcher, inference-optimizer, etc.)
- **enableBenchmarking** — true (default) — AI specialists run before/after benchmarks
- **numAgents / numWorkers / numRounds** — Depending on pattern
- **repos** — Repository URLs if needed

## Step 3: Call the MCP tool

Use the appropriate MCP tool based on the pattern:

- Parallel → `multi_agent_collaborate` with pattern: "parallel"
- Debate → `agent_debate`
- Pipeline → `multi_agent_collaborate` with pattern: "pipeline"
- Iterative → `iterative_improve`
- Tournament → `tournament`
- Swarm → `swarm_solve`

## Step 4: Monitor

After starting the collaboration:
- Use `get_team_status` to check progress
- Direct the user to the dashboard at http://localhost:3456 for real-time visualization
- Report the final results when complete
