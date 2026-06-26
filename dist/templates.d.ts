import type { PatternTemplate, CollaborationConfig, CollaborationPattern } from "./types.js";
export declare class TemplateManager {
    private templates;
    private storagePath;
    constructor(storagePath?: string);
    saveTemplate(name: string, description: string, pattern: CollaborationPattern, config: Omit<CollaborationConfig, "task" | "pattern">): PatternTemplate;
    getTemplate(id: string): PatternTemplate | undefined;
    listTemplates(): PatternTemplate[];
    deleteTemplate(id: string): boolean;
    updateTemplate(id: string, updates: Partial<Pick<PatternTemplate, "name" | "description" | "config">>): PatternTemplate | undefined;
    initializePresets(): void;
}
//# sourceMappingURL=templates.d.ts.map