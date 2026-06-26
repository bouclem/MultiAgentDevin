import type { SessionData, RoundData } from "../types.js";
import { STATUS_COLORS, ROLE_COLORS } from "../types.js";

interface TournamentBracketProps {
  session: SessionData;
}

export function TournamentBracket({ session }: TournamentBracketProps) {
  if (session.pattern !== "tournament") {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <span className="text-4xl">🏆</span>
        <p className="text-gray-500 mt-2">
          Tournament view is only available for tournament pattern sessions.
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Current pattern: {session.pattern}
        </p>
      </div>
    );
  }

  if (session.rounds.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <span className="text-4xl">🏆</span>
        <p className="text-gray-500 mt-2">Tournament hasn't started yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">
          🏆 Tournament Bracket
        </h3>
        <p className="text-xs text-gray-500">
          {session.rounds.length} rounds · Binary tree branching with agent recycling
        </p>
      </div>

      <div className="flex gap-4 overflow-auto pb-4">
        {session.rounds.map((round) => (
          <RoundColumn key={round.index} round={round} session={session} />
        ))}
      </div>
    </div>
  );
}

function RoundColumn({ round, session }: { round: RoundData; session: SessionData }) {
  const agents = round.agentIds
    .map((id) => session.agents.find((a) => a.id === id))
    .filter(Boolean);
  const eliminated = round.eliminatedAgentIds;
  const recycled = round.recycledAgentIds;

  return (
    <div className="flex-shrink-0 w-64">
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-gray-800 bg-gray-850">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">
              Round {round.index}
            </span>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[round.status] ?? "#6b7280" }}
            />
          </div>
        </div>

        {/* Agents */}
        <div className="p-2 space-y-1.5">
          {agents.map((agent) => {
            if (!agent) return null;
            const isEliminated = eliminated.includes(agent.id);
            const isRecycled = recycled.includes(agent.id);

            return (
              <div
                key={agent.id}
                className={`rounded-lg p-2 border ${
                  isEliminated
                    ? "border-red-900/40 bg-red-950/20 opacity-60"
                    : isRecycled
                    ? "border-yellow-900/40 bg-yellow-950/20"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[agent.role] ?? "#64748b" }}
                  />
                  <span className="text-xs font-medium text-gray-300 truncate flex-1">
                    {agent.roleName}
                  </span>
                  {isEliminated && <span className="text-xs">❌</span>}
                  {isRecycled && <span className="text-xs">♻️</span>}
                </div>
                {agent.branchName && (
                  <p className="text-xs text-gray-600 mt-0.5">🌿 {agent.branchName}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        {(eliminated.length > 0 || recycled.length > 0) && (
          <div className="p-2 border-t border-gray-800 text-xs text-gray-500 flex gap-3">
            {eliminated.length > 0 && (
              <span className="text-red-400">❌ {eliminated.length} eliminated</span>
            )}
            {recycled.length > 0 && (
              <span className="text-yellow-400">♻️ {recycled.length} recycled</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
