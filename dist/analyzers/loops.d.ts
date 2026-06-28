import { TraceEvent } from "../schema/events.js";
export interface LoopWarning {
    tool_name: string;
    consecutive_count: number;
}
export declare function analyzeLoops(events: TraceEvent[]): LoopWarning[];
//# sourceMappingURL=loops.d.ts.map