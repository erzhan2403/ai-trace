"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLatency = analyzeLatency;
exports.findSlowestTool = findSlowestTool;
const events_js_1 = require("../schema/events.js");
const TOOL_THRESHOLD_MS = 3000;
const LLM_THRESHOLD_MS = 5000;
function analyzeLatency(events) {
    const warnings = [];
    for (const event of events) {
        if (event.type === events_js_1.EventType.TOOL_CALL_END && event.duration_ms !== undefined) {
            if (event.duration_ms > TOOL_THRESHOLD_MS) {
                warnings.push({
                    type: "slow_tool",
                    name: event.metadata.tool_name,
                    duration_ms: event.duration_ms,
                    threshold_ms: TOOL_THRESHOLD_MS,
                });
            }
        }
        if (event.type === events_js_1.EventType.LLM_CALL_END && event.duration_ms !== undefined) {
            if (event.duration_ms > LLM_THRESHOLD_MS) {
                const meta = event.metadata;
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
function findSlowestTool(events) {
    let slowest = null;
    for (const event of events) {
        if (event.type === events_js_1.EventType.TOOL_CALL_END && event.duration_ms !== undefined) {
            const meta = event.metadata;
            if (!slowest || event.duration_ms > slowest.duration_ms) {
                slowest = { name: meta.tool_name, duration_ms: event.duration_ms };
            }
        }
    }
    return slowest;
}
//# sourceMappingURL=latency.js.map