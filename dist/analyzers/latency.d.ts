import { TraceEvent } from "../schema/events.js";
export interface LatencyWarning {
    type: "slow_tool" | "slow_llm";
    name: string;
    duration_ms: number;
    threshold_ms: number;
}
export declare function analyzeLatency(events: TraceEvent[]): LatencyWarning[];
export declare function findSlowestTool(events: TraceEvent[]): {
    name: string;
    duration_ms: number;
} | null;
//# sourceMappingURL=latency.d.ts.map