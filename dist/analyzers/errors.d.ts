import { TraceEvent } from "../schema/events.js";
export interface ErrorSummary {
    count: number;
    failedTools: string[];
    details: Array<{
        tool_name: string;
        error_message: string;
        error_type: string;
    }>;
}
export declare function analyzeErrors(events: TraceEvent[]): ErrorSummary;
//# sourceMappingURL=errors.d.ts.map