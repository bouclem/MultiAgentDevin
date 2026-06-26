import type { CollaborationResult, CollaborationSession } from "../types.js";
import { PatternBase } from "./base.js";
export declare class SwarmPattern extends PatternBase {
    private swarm;
    private maxDepth;
    private maxTotalAgents;
    execute(session: CollaborationSession): Promise<CollaborationResult>;
    private extractSwarmSubtasks;
    private checkNeedsExpansion;
    private deriveChildSubtasks;
}
//# sourceMappingURL=swarm.d.ts.map