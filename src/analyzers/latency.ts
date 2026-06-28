import { EventType, TraceEvent } from "../schema/events.js";

export interface LatencyWarning {
  type: "slow_tool" | "slow_llm";
  name: string;
  duration_ms: number;
  threshold_ms: number;
}

const TOOL_THRESHOLD_MS = 3000;
const LLM_THRESHOLD_MS = 5000;

export function analyzeLatency(events: TraceEvent[]): LatencyWarning[] {
  const warnings: LatencyWarning[] = [];

  for (const event of events) {
    if (event.type === EventType.TOOL_CALL_END && event.duration_ms !== undefined) {
      if (event.duration_ms > TOOL_THRESHOLD_MS) {
        warnings.push({
          type: "slow_tool",
          name: (event.metadata as { tool_name: string }).tool_name,
          duration_ms: event.duration_ms,
          threshold_ms: TOOL_THRESHOLD_MS,
        });
      }
    }

    if (event.type === EventType.LLM_CALL_END && event.duration_ms !== undefined) {
      if (event.duration_ms > LLM_THRESHOLD_MS) {
        const meta = event.metadata as { model: string };
        warnings.push({
          type: "slow_llm",
          name: meta.model,
          duration_ms: event.duration_ms,
          threshold_ms: LLM_THRESHOLD_MS,
        });
      }
    }
  }

  return warnings;
}

export function findSlowestTool(events: TraceEvent[]): { name: string; duration_ms: number } | null {
  let slowest: { name: string; duration_ms: number } | null = null;

  for (const event of events) {
    if (event.type === EventType.TOOL_CALL_END && event.duration_ms !== undefined) {
      const meta = event.metadata as { tool_name: string };
      if (!slowest || event.duration_ms > slowest.duration_ms) {
        slowest = { name: meta.tool_name, duration_ms: event.duration_ms };
      }
    }
  }

  return slowest;
}
