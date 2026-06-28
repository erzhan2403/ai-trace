import { TraceEvent } from "../schema/events.js";
export declare function buildSummary(events: TraceEvent[]): {
    sessionName: string;
    duration: number | null;
    llmCallCount: number;
    toolCallCount: number;
    errorCount: number;
    totalTokens: number;
    totalCost: number;
    slowest: {
        name: string;
        duration_ms: number;
    } | null;
    warningCount: number;
    errors: import("../analyzers/errors.js").ErrorSummary;
    latencyWarnings: import("../analyzers/latency.js").LatencyWarning[];
    loopWarnings: import("../analyzers/loops.js").LoopWarning[];
};
export declare function printSummary(events: TraceEvent[], filePath: string): void;
//# sourceMappingURL=console.d.ts.map