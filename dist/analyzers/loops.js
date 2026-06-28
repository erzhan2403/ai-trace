"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLoops = analyzeLoops;
const events_js_1 = require("../schema/events.js");
const LOOP_THRESHOLD = 3;
function analyzeLoops(events) {
    const warnings = [];
    const toolCalls = events.filter((e) => e.type === events_js_1.EventType.TOOL_CALL_START);
    let i = 0;
    while (i < toolCalls.length) {
        const meta = toolCalls[i].metadata;
        const currentTool = meta.tool_name;
        let count = 1;
        while (i + count < toolCalls.length &&
            toolCalls[i + count].metadata.tool_name === currentTool) {
            count++;
        }
        if (count >= LOOP_THRESHOLD) {
            warnings.push({ tool_name: currentTool, consecutive_count: count });
        }
        i += count;
    }
    return warnings;
}
//# sourceMappingURL=loops.js.map