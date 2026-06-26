import type { CollaborationResult, CollaborationSession } from "../types.js";
import { PatternBase } from "./base.js";
export declare class DebatePattern extends PatternBase {
    execute(session: CollaborationSession): Promise<CollaborationResult>;
    private getRoleName;
}
//# sourceMappingURL=debate.d.ts.map