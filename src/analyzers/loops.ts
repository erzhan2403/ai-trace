import { EventType, TraceEvent } from "../schema/events.js";

export interface LoopWarning {
  tool_name: string;
  consecutive_count: number;
}

const LOOP_THRESHOLD = 3;

export function analyzeLoops(events: TraceEvent[]): LoopWarning[] {
  const warnings: LoopWarning[] = [];
  const toolCalls = events.filter((e) => e.type === EventType.TOOL_CALL_START);

  let i = 0;
  while (i < toolCalls.length) {
    const meta = toolCalls[i].metadata as { tool_name: string };
    const currentTool = meta.tool_name;
    let count = 1;

    while (
      i + count < toolCalls.length &&
      (toolCalls[i + count].metadata as { tool_name: string }).tool_name === currentTool
    ) {
      count++;
    }

    if (count >= LOOP_THRESHOLD) {
      warnings.push({ tool_name: currentTool, consecutive_count: count });
    }

    i += count;
  }

  return warnings;
}
