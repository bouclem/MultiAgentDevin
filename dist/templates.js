// ============================================================================
// MultiAgentDevin — Pattern Template Storage
// ============================================================================
// ---------------------------------------------------------------------------
// Template Manager
// ---------------------------------------------------------------------------
export class TemplateManager {
    templates = new Map();
    storagePath = null;
    constructor(storagePath) {
        this.storagePath = storagePath ?? null;
    }
    saveTemplate(name, description, pattern, config) {
        const id = `template-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const template = {
            id,
            name,
            description,
            pattern,
            config,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.templates.set(id, template);
        return template;
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    listTemplates() {
        return [...this.templates.values()];
    }
    deleteTemplate(id) {
        return this.templates.delete(id);
    }
    updateTemplate(id, updates) {
        const template = this.templates.get(id);
        if (!template)
            return undefined;
        if (updates.name)
            template.name = updates.name;
        if (updates.description)
            template.description = updates.description;
        if (updates.config)
            template.config = updates.config;
        template.updatedAt = Date.now();
        this.templates.set(id, template);
        return template;
    }
    // --- Preset Templates -----------------------------------------------------
    initializePresets() {
        const presets = [
            {
                name: "Parallel Migration",
                description: "Break a large migration into parallel subtasks with a coordinator",
                pattern: "parallel",
                config: {
                    numWorkers: 4,
                    specialistRoles: ["worker", "reviewer"],
                    useBinaryTreeBranching: true,
                    recycleEliminatedAgents: false,
                    maxAcuLimit: 20,
                },
            },
            {
                name: "Code Review Panel",
                description: "Multiple specialist reviewers analyze code from different angles",
                pattern: "debate",
                config: {
                    numWorkers: 3,
                    specialistRoles: ["security", "performance", "architecture"],
                    useBinaryTreeBranching: false,
                    recycleEliminatedAgents: false,
                    maxAcuLimit: 10,
                },
            },
            {
                name: "Tournament Optimization",
                description: "Agents compete in elimination rounds, eliminated agents recycled to winning branches",
                pattern: "tournament",
                config: {
                    numRounds: 3,
                    numWorkers: 8,
                    specialistRoles: ["worker", "reviewer"],
                    useBinaryTreeBranching: true,
                    recycleEliminatedAgents: true,
                    maxAcuLimit: 15,
                },
            },
            {
                name: "Swarm Debugging",
                description: "Self-organizing swarm that dynamically spawns agents for complex debugging",
                pattern: "swarm",
                config: {
                    numWorkers: 3,
                    specialistRoles: ["worker", "testing"],
                    useBinaryTreeBranching: true,
                    recycleEliminatedAgents: true,
                    maxAcuLimit: 15,
                },
            },
            {
                name: "Iterative Refinement",
                description: "Write code, get reviewed, improve — repeat until quality threshold",
                pattern: "iterative",
                config: {
                    numRounds: 3,
                    specialistRoles: ["worker", "reviewer"],
                    useBinaryTreeBranching: false,
                    recycleEliminatedAgents: false,
                    qualityThreshold: 85,
                    maxAcuLimit: 20,
                },
            },
            {
                name: "Full Pipeline",
                description: "Sequential pipeline: architecture → implementation → testing → security review",
                pattern: "pipeline",
                config: {
                    specialistRoles: ["architecture", "worker", "testing", "security"],
                    useBinaryTreeBranching: false,
                    recycleEliminatedAgents: false,
                    maxAcuLimit: 25,
                },
            },
        ];
        for (const preset of presets) {
            this.saveTemplate(preset.name, preset.description, preset.pattern, preset.config);
        }
    }
}
//# sourceMappingURL=templates.js.map