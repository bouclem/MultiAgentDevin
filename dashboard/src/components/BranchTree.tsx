import type { SessionData, BranchData } from "../types.js";
import { STATUS_COLORS, ROLE_COLORS } from "../types.js";

interface BranchTreeProps {
  session: SessionData;
}

export function BranchTree({ session }: BranchTreeProps) {
  const branches = session.branches;
  const rootBranches = branches.filter((b) => b.parentId === null);

  if (branches.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <span className="text-4xl">🌳</span>
        <p className="text-gray-500 mt-2">No branches yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">
        Binary Tree Branch Structure ({branches.length} branches)
      </h3>
      <div className="overflow-auto">
        <div className="inline-flex flex-col gap-4 min-w-full">
          {rootBranches.map((root) => (
            <BranchNode key={root.id} branch={root} allBranches={branches} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BranchNode({
  branch,
  allBranches,
  session,
}: {
  branch: BranchData;
  allBranches: BranchData[];
  session: SessionData;
}) {
  const children = allBranches.filter((b) => b.parentId === branch.id);
  const agent = session.agents.find((a) => a.id === branch.agentId);
  const statusColor = STATUS_COLORS[branch.status] ?? "#6b7280";

  return (
    <div className="flex flex-col items-center">
      {/* Branch node */}
      <div
        className="rounded-lg px-4 py-2 border-2 min-w-[180px] text-center"
        style={{
          borderColor: statusColor + "60",
          backgroundColor: statusColor + "10",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-medium text-gray-300">{branch.name}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Depth {branch.depth} · {branch.status}
        </div>
        {agent && (
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[agent.role] ?? "#64748b" }}
            />
            <span className="text-xs text-gray-400">{agent.roleName}</span>
          </div>
        )}
        {branch.commitSha && (
          <div className="text-xs text-gray-600 mt-1">
            {branch.commitSha.slice(0, 7)}
          </div>
        )}
      </div>

      {/* Children */}
      {children.length > 0 && (
        <>
          {/* Connector line */}
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex gap-4 items-start">
            {children.map((child) => (
              <BranchNode
                key={child.id}
                branch={child}
                allBranches={allBranches}
                session={session}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
