import { EventType, TraceEvent } from "../schema/events.js";

export interface ErrorSummary {
  count: number;
  failedTools: string[];
  details: Array<{ tool_name: string; error_message: string; error_type: string }>;
}

export function analyzeErrors(events: TraceEvent[]): ErrorSummary {
  const errorEvents = events.filter((e) => e.type === EventType.TOOL_CALL_ERROR);
  const details = errorEvents.map((e) => {
    const meta = e.metadata as { tool_name: string; error_message: string; error_type: string };
    return {
      tool_name: meta.tool_name,
      error_message: meta.error_message,
      error_type: meta.error_type,
    };
  });

  const failedTools = [...new Set(details.map((d) => d.tool_name))];

  return {
    count: errorEvents.length,
    failedTools,
    details,
  };
}
