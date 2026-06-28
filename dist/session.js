"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const uuid_1 = require("uuid");
const events_js_1 = require("./schema/events.js");
class Session {
    constructor(config, storage, filePath) {
        this.sessionId = (0, uuid_1.v4)();
        this.name = config.name;
        this.storage = storage;
        this.startTime = Date.now();
        this.filePath = filePath;
    }
    getFilePath() {
        return this.filePath;
    }
    async writeSessionStart() {
        const event = {
            id: (0, uuid_1.v4)(),
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            type: events_js_1.EventType.SESSION_START,
            metadata: { name: this.name },
        };
        await this.storage.write(event);
    }
    makeBase(type, parentId) {
        return {
            id: (0, uuid_1.v4)(),
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            type,
            ...(parentId ? { parent_id: parentId } : {}),
        };
    }
    async recordUserInput(content) {
        const event = {
            ...this.makeBase(events_js_1.EventType.USER_INPUT),
            metadata: { content },
        };
        await this.storage.write(event);
    }
    async recordStep(options) {
        const event = {
            ...this.makeBase(events_js_1.EventType.AGENT_STEP),
            metadata: { description: options.description, ...options.metadata },
        };
        await this.storage.write(event);
    }
    async recordToolCall(options) {
        const startId = (0, uuid_1.v4)();
        const startEvent = {
            id: startId,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            type: events_js_1.EventType.TOOL_CALL_START,
            metadata: { tool_name: options.name, input: options.input },
        };
        await this.storage.write(startEvent);
        if (options.error) {
            const errorEvent = {
                ...this.makeBase(events_js_1.EventType.TOOL_CALL_ERROR, startId),
                duration_ms: options.durationMs ?? 0,
                metadata: {
                    tool_name: options.name,
                    error_message: options.error.message,
                    error_type: options.error.type,
                },
            };
            await this.storage.write(errorEvent);
            return;
        }
        const outputStr = JSON.stringify(options.output ?? "");
        const endEvent = {
            ...this.makeBase(events_js_1.EventType.TOOL_CALL_END, startId),
            duration_ms: options.durationMs ?? 0,
            metadata: {
                tool_name: options.name,
                output: options.output,
                output_size_bytes: Buffer.byteLength(outputStr, "utf8"),
            },
        };
        await this.storage.write(endEvent);
    }
    async recordLlmCall(options) {
        const startId = (0, uuid_1.v4)();
        const startEvent = {
            id: startId,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            type: events_js_1.EventType.LLM_CALL_START,
            metadata: { model: options.model, input: options.input },
        };
        await this.storage.write(startEvent);
        const endEvent = {
            ...this.makeBase(events_js_1.EventType.LLM_CALL_END, startId),
            duration_ms: options.durationMs,
            metadata: {
                model: options.model,
                input: options.input,
                output: options.output,
                prompt_tokens: options.promptTokens,
                completion_tokens: options.completionTokens,
                cost_usd: options.costUsd,
            },
        };
        await this.storage.write(endEvent);
    }
    async recordFinalOutput(content) {
        const event = {
            ...this.makeBase(events_js_1.EventType.FINAL_OUTPUT),
            metadata: { content },
        };
        await this.storage.write(event);
    }
    async end() {
        const duration = Date.now() - this.startTime;
        const event = {
            ...this.makeBase(events_js_1.EventType.SESSION_END),
            duration_ms: duration,
        };
        await this.storage.write(event);
        await this.storage.close();
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map