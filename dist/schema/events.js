"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["SESSION_START"] = "SESSION_START";
    EventType["SESSION_END"] = "SESSION_END";
    EventType["USER_INPUT"] = "USER_INPUT";
    EventType["AGENT_STEP"] = "AGENT_STEP";
    EventType["LLM_CALL_START"] = "LLM_CALL_START";
    EventType["LLM_CALL_END"] = "LLM_CALL_END";
    EventType["TOOL_CALL_START"] = "TOOL_CALL_START";
    EventType["TOOL_CALL_END"] = "TOOL_CALL_END";
    EventType["TOOL_CALL_ERROR"] = "TOOL_CALL_ERROR";
    EventType["FINAL_OUTPUT"] = "FINAL_OUTPUT";
})(EventType || (exports.EventType = EventType = {}));
//# sourceMappingURL=events.js.map