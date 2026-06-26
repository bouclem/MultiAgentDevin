import type { SessionData } from "../types.js";
import { PATTERN_ICONS, STATUS_COLORS } from "../types.js";

interface SidebarProps {
  sessions: SessionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  wsConnected: boolean;
}

export function Sidebar({ sessions, selectedId, onSelect, wsConnected }: SidebarProps) {
  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="text-sm font-bold text-gray-200">MultiAgentDevin</h1>
            <p className="text-xs text-gray-500">Multi-Agent Collaboration</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-gray-500">
            {wsConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
            Sessions ({sessions.length})
          </p>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 py-4">
              No active sessions. Start a collaboration via MCP.
            </p>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelect(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedId === session.id
                      ? "bg-indigo-600/20 border border-indigo-600/40"
                      : "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {PATTERN_ICONS[session.pattern] ?? "📋"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">
                        {session.task.slice(0, 50)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[session.status] ?? "#6b7280" }}
                        />
                        <span className="text-xs text-gray-500">
                          {session.pattern} · {session.agents.length} agents
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-xs text-gray-600">
        Inspired by{" "}
        <a
          href="https://x.com/Thom_Wolf/status/2070134136304517284"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline"
        >
          Thom Wolf's 100+ agent experiment
        </a>
      </div>
    </div>
  );
}
