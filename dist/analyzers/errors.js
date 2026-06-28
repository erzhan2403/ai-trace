"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeErrors = analyzeErrors;
const events_js_1 = require("../schema/events.js");
function analyzeErrors(events) {
    const errorEvents = events.filter((e) => e.type === events_js_1.EventType.TOOL_CALL_ERROR);
    const details = errorEvents.map((e) => {
        const meta = e.metadata;
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
//# sourceMappingURL=errors.js.map