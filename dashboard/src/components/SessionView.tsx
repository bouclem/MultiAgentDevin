import type { SessionData, DashboardEvent } from "../types.js";
import { ROLE_COLORS, STATUS_COLORS } from "../types.js";

interface SessionViewProps {
  session: SessionData;
  events: DashboardEvent[];
}

export function SessionView({ session, events }: SessionViewProps) {
  const activeAgents = session.agents.filter((a) =>
    ["working", "created", "running"].includes(a.status)
  );
  const completedAgents = session.agents.filter((a) =>
    ["finished", "completed"].includes(a.status)
  );
  const failedAgents = session.agents.filter((a) =>
    ["failed", "errored", "expired", "eliminated"].includes(a.status)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Agents" value={session.agents.length} color="#6366f1" />
        <StatCard label="Active" value={activeAgents.length} color="#3b82f6" />
        <StatCard label="Completed" value={completedAgents.length} color="#10b981" />
        <StatCard label="Failed/Eliminated" value={failedAgents.length} color="#ef4444" />
      </div>

      {/* Task */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Task</h3>
        <p className="text-sm text-gray-300">{session.task}</p>
      </div>

      {/* Rounds Progress */}
      {session.rounds.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Rounds ({session.totalRounds})
          </h3>
          <div className="flex gap-2">
            {session.rounds.map((round) => (
              <div
                key={round.index}
                className="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-400">
                    Round {round.index}
                  </span>
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[round.status] ?? "#6b7280",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {round.agentIds.length} agents
                  {round.eliminatedAgentIds.length > 0 && (
                    <span className="text-red-400">
                      {" "}· {round.eliminatedAgentIds.length} eliminated
                    </span>
                  )}
                  {round.recycledAgentIds.length > 0 && (
                    <span className="text-yellow-400">
                      {" "}· {round.recycledAgentIds.length} recycled
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
          Agents
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {session.agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS[agent.role] ?? "#64748b" }}
                />
                <span className="text-sm font-medium text-gray-300">
                  {agent.roleName}
                </span>
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: (STATUS_COLORS[agent.status] ?? "#6b7280") + "20",
                    color: STATUS_COLORS[agent.status] ?? "#6b7280",
                  }}
                >
                  {agent.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {agent.branchName && (
                  <p>🌿 {agent.branchName}</p>
                )}
                {agent.sessionId && (
                  <p>🔗 <a
                    href={`https://devin.ai/sessions/${agent.sessionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    {agent.sessionId.slice(0, 20)}...
                  </a></p>
                )}
                {agent.acusConsumed !== undefined && (
                  <p>⚡ {agent.acusConsumed} ACUs</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
          Recent Events
        </h3>
        <div className="space-y-1 max-h-48 overflow-auto">
          {events.slice(-10).reverse().map((event, i) => (
            <div key={i} className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-gray-600">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="flex-1">{event.message}</span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-xs text-gray-600">No events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
