import type { CollaborationResult, CollaborationSession } from "../types.js";
import { PatternBase } from "./base.js";
export declare class PipelinePattern extends PatternBase {
    execute(session: CollaborationSession): Promise<CollaborationResult>;
    private getRoleName;
}
//# sourceMappingURL=pipeline.d.ts.map