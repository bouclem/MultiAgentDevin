import type { DashboardEvent } from "../types.js";

interface EventFeedProps {
  events: DashboardEvent[];
}

const EVENT_ICONS: Record<string, string> = {
  session_created: "🟢",
  session_updated: "🔄",
  agent_created: "🤖",
  agent_status_changed: "📡",
  round_started: "▶️",
  round_completed: "✅",
  branch_created: "🌿",
  branch_updated: "🔄",
  branch_eliminated: "❌",
  message_sent: "💬",
  collaboration_started: "🚀",
  collaboration_completed: "🎉",
  collaboration_failed: "💥",
  agent_recycled: "♻️",
  log: "📝",
};

export function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300">
          Event Feed ({events.length})
        </h3>
      </div>
      <div className="max-h-[calc(100vh-200px)] overflow-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">
            No events yet. Events will appear here in real-time.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {[...events].reverse().map((event, i) => (
              <div key={i} className="p-3 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">
                    {EVENT_ICONS[event.type] ?? "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
