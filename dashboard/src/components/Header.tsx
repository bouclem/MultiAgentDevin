import type { SessionData } from "../types.js";
import { PATTERN_ICONS, STATUS_COLORS } from "../types.js";

interface HeaderProps {
  session: SessionData | null;
  wsConnected: boolean;
  activeView: "overview" | "branches" | "graph" | "tournament" | "events";
  onViewChange: (view: "overview" | "branches" | "graph" | "tournament" | "events") => void;
}

export function Header({ session, wsConnected, activeView, onViewChange }: HeaderProps) {
  if (!session) {
    return (
      <div className="h-14 border-b border-gray-800 flex items-center px-6">
        <h2 className="text-sm font-semibold text-gray-400">Dashboard</h2>
      </div>
    );
  }

  const views = [
    { id: "overview" as const, label: "Overview", icon: "📊" },
    { id: "branches" as const, label: "Branch Tree", icon: "🌳" },
    { id: "graph" as const, label: "Node Graph", icon: "🔗" },
    { id: "tournament" as const, label: "Tournament", icon: "🏆" },
    { id: "events" as const, label: "Events", icon: "📡" },
  ];

  return (
    <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-xl">{PATTERN_ICONS[session.pattern] ?? "📋"}</span>
        <div>
          <h2 className="text-sm font-semibold text-gray-200">
            {session.pattern.charAt(0).toUpperCase() + session.pattern.slice(1)}
          </h2>
          <p className="text-xs text-gray-500 truncate max-w-md">
            {session.task.slice(0, 80)}
          </p>
        </div>
        <span
          className="ml-2 px-2 py-0.5 text-xs rounded-full"
          style={{
            backgroundColor: (STATUS_COLORS[session.status] ?? "#6b7280") + "20",
            color: STATUS_COLORS[session.status] ?? "#6b7280",
          }}
        >
          {session.status}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeView === view.id
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/40"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
            }`}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
