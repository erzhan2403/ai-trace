export declare enum EventType {
    SESSION_START = "SESSION_START",
    SESSION_END = "SESSION_END",
    USER_INPUT = "USER_INPUT",
    AGENT_STEP = "AGENT_STEP",
    LLM_CALL_START = "LLM_CALL_START",
    LLM_CALL_END = "LLM_CALL_END",
    TOOL_CALL_START = "TOOL_CALL_START",
    TOOL_CALL_END = "TOOL_CALL_END",
    TOOL_CALL_ERROR = "TOOL_CALL_ERROR",
    FINAL_OUTPUT = "FINAL_OUTPUT"
}
export interface BaseEvent {
    id: string;
    session_id: string;
    timestamp: string;
    type: EventType;
    parent_id?: string;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
}
export interface SessionStartEvent extends BaseEvent {
    type: EventType.SESSION_START;
    metadata: {
        name: string;
    };
}
export interface SessionEndEvent extends BaseEvent {
    type: EventType.SESSION_END;
    duration_ms: number;
}
export interface UserInputEvent extends BaseEvent {
    type: EventType.USER_INPUT;
    metadata: {
        content: string;
    };
}
export interface AgentStepEvent extends BaseEvent {
    type: EventType.AGENT_STEP;
    metadata: {
        description: string;
    };
}
export interface LlmCallStartEvent extends BaseEvent {
    type: EventType.LLM_CALL_START;
    metadata: {
        model: string;
        input: string;
    };
}
export interface LlmCallEndEvent extends BaseEvent {
    type: EventType.LLM_CALL_END;
    duration_ms: number;
    metadata: {
        model: string;
        input: string;
        output: string;
        prompt_tokens: number;
        completion_tokens: number;
        cost_usd: number;
    };
}
export interface ToolCallStartEvent extends BaseEvent {
    type: EventType.TOOL_CALL_START;
    metadata: {
        tool_name: string;
        input: unknown;
    };
}
export interface ToolCallEndEvent extends BaseEvent {
    type: EventType.TOOL_CALL_END;
    duration_ms: number;
    metadata: {
        tool_name: string;
        output: unknown;
        output_size_bytes: number;
    };
}
export interface ToolCallErrorEvent extends BaseEvent {
    type: EventType.TOOL_CALL_ERROR;
    duration_ms: number;
    metadata: {
        tool_name: string;
        error_message: string;
        error_type: string;
    };
}
export interface FinalOutputEvent extends BaseEvent {
    type: EventType.FINAL_OUTPUT;
    metadata: {
        content: string;
    };
}
export type TraceEvent = SessionStartEvent | SessionEndEvent | UserInputEvent | AgentStepEvent | LlmCallStartEvent | LlmCallEndEvent | ToolCallStartEvent | ToolCallEndEvent | ToolCallErrorEvent | FinalOutputEvent;
//# sourceMappingURL=events.d.ts.map