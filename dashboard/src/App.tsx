import { useState, useEffect, useCallback } from "react";
import type { DashboardEvent, SessionData } from "./types.js";
import { Sidebar } from "./components/Sidebar.js";
import { SessionView } from "./components/SessionView.js";
import { EventFeed } from "./components/EventFeed.js";
import { BranchTree } from "./components/BranchTree.js";
import { TournamentBracket } from "./components/TournamentBracket.js";
import { NodeGraph } from "./components/NodeGraph.js";
import { Header } from "./components/Header.js";

export default function App() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "branches" | "graph" | "tournament" | "events">("overview");

  // --- WebSocket connection ---
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 3s
      setTimeout(() => window.location.reload(), 3000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === "initial") {
        setEvents(data.data as DashboardEvent[]);
      } else if (data.type === "event") {
        setEvents((prev) => [...prev.slice(-199), data.data as DashboardEvent]);
      } else if (data.type === "session_updated") {
        const updated = data.data as SessionData;
        setSessions((prev) => {
          const idx = prev.findIndex((s) => s.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      }
    };

    return () => ws.close();
  }, []);

  // --- Fetch initial sessions ---
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data);
    } catch {
      // Server might not be running yet
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
  const sessionEvents = selectedSessionId
    ? events.filter((e) => e.collaborationId === selectedSessionId)
    : events;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        selectedId={selectedSessionId}
        onSelect={setSelectedSessionId}
        wsConnected={wsConnected}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          session={selectedSession}
          wsConnected={wsConnected}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <div className="flex-1 overflow-auto p-6">
          {!selectedSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-gray-400 mb-2">
                  MultiAgentDevin Dashboard
                </h2>
                <p className="text-gray-500">
                  Select a collaboration session from the sidebar, or start one via MCP.
                </p>
                <div className="mt-6 text-sm text-gray-600">
                  <p>WebSocket: {wsConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
                  <p className="mt-1">Sessions: {sessions.length}</p>
                  <p className="mt-1">Events: {events.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeView === "overview" && (
                <SessionView session={selectedSession} events={sessionEvents} />
              )}
              {activeView === "branches" && (
                <BranchTree session={selectedSession} />
              )}
              {activeView === "graph" && (
                <NodeGraph
                  branches={selectedSession.branches}
                  agents={selectedSession.agents}
                />
              )}
              {activeView === "tournament" && (
                <TournamentBracket session={selectedSession} />
              )}
              {activeView === "events" && (
                <EventFeed events={sessionEvents} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
