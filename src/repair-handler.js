// ===== src/repair-handler.js =====
// Description: Repair handler with a ceiling of 1 attempt.
// Detects violations in model output and allows up to 1 repair.
// Interfaces:
//   Provides: RepairHandler, MAX_REPAIRS
//   Consumes: validateOutput from globalThis.PE (output-validator.js)
// Interactions:
//   - Used by orchestration (Phase 2) to apply controlled repair.
//   - All strings in English; no Portuguese hardcoded.

const MAX_REPAIRS = 1;

class RepairHandler {
    constructor() {
        this.repairCount = 0;
        this.violations = [];
    }

    // Validates the model output and returns whether it is acceptable or needs repair.
    // If it needs repair and attempts are still available, records the violations.
    validate(originalText, enhancedText, lang) {
        const result = globalThis.PE.validateOutput(originalText, enhancedText, lang);
        this.violations = result.violations;
        return result.valid;
    }

    // Returns whether repair attempts are still available.
    canRepair() {
        return this.repairCount < MAX_REPAIRS;
    }

    // Increments the repair counter. Returns true if the repair was recorded.
    recordRepair() {
        if (this.canRepair()) {
            this.repairCount++;
            return true;
        }
        return false;
    }

    // Returns the list of detected violations.
    getViolations() {
        return this.violations;
    }

    // Returns the number of repairs already performed.
    getRepairCount() {
        return this.repairCount;
    }

    // Resets the handler state.
    reset() {
        this.repairCount = 0;
        this.violations = [];
    }
}

globalThis.PE.RepairHandler = RepairHandler;
globalThis.PE.MAX_REPAIRS = MAX_REPAIRS;