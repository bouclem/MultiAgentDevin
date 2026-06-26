import type { CollaborationResult, CollaborationSession } from "../types.js";
import { PatternBase } from "./base.js";
export declare class ParallelPattern extends PatternBase {
    execute(session: CollaborationSession): Promise<CollaborationResult>;
    private extractSubtasks;
}
//# sourceMappingURL=parallel.d.ts.map