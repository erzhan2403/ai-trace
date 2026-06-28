import { v4 as uuidv4 } from "uuid";
import { EventType, TraceEvent } from "./schema/events.js";
import { StorageBackend } from "./storage/base.js";

export interface SessionConfig {
  name: string;
  outputDir?: string;
}

export interface RecordToolCallOptions {
  name: string;
  input: unknown;
  output?: unknown;
  durationMs?: number;
  error?: { message: string; type: string };
}

export interface RecordLlmCallOptions {
  model: string;
  input: string;
  output: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  durationMs: number;
}

export class Session {
  readonly sessionId: string;
  readonly name: string;
  private storage: StorageBackend;
  private startTime: number;
  private filePath: string;

  constructor(config: SessionConfig, storage: StorageBackend, filePath: string) {
    this.sessionId = uuidv4();
    this.name = config.name;
    this.storage = storage;
    this.startTime = Date.now();
    this.filePath = filePath;
  }

  getFilePath(): string {
    return this.filePath;
  }

  async writeSessionStart(): Promise<void> {
    const event: TraceEvent = {
      id: uuidv4(),
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      type: EventType.SESSION_START,
      metadata: { name: this.name },
    } as TraceEvent;
    await this.storage.write(event);
  }

  private makeBase(type: EventType, parentId?: string) {
    return {
      id: uuidv4(),
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      type,
      ...(parentId ? { parent_id: parentId } : {}),
    };
  }

  async recordUserInput(content: string): Promise<void> {
    const event: TraceEvent = {
      ...this.makeBase(EventType.USER_INPUT),
      metadata: { content },
    } as TraceEvent;
    await this.storage.write(event);
  }

  async recordStep(options: { description: string; metadata?: Record<string, unknown> }): Promise<void> {
    const event: TraceEvent = {
      ...this.makeBase(EventType.AGENT_STEP),
      metadata: { description: options.description, ...options.metadata },
    } as TraceEvent;
    await this.storage.write(event);
  }

  async recordToolCall(options: RecordToolCallOptions): Promise<void> {
    const startId = uuidv4();
    const startEvent: TraceEvent = {
      id: startId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      type: EventType.TOOL_CALL_START,
      metadata: { tool_name: options.name, input: options.input },
    } as TraceEvent;
    await this.storage.write(startEvent);

    if (options.error) {
      const errorEvent: TraceEvent = {
        ...this.makeBase(EventType.TOOL_CALL_ERROR, startId),
        duration_ms: options.durationMs ?? 0,
        metadata: {
          tool_name: options.name,
          error_message: options.error.message,
          error_type: options.error.type,
        },
      } as TraceEvent;
      await this.storage.write(errorEvent);
      return;
    }

    const outputStr = JSON.stringify(options.output ?? "");
    const endEvent: TraceEvent = {
      ...this.makeBase(EventType.TOOL_CALL_END, startId),
      duration_ms: options.durationMs ?? 0,
      metadata: {
        tool_name: options.name,
        output: options.output,
        output_size_bytes: Buffer.byteLength(outputStr, "utf8"),
      },
    } as TraceEvent;
    await this.storage.write(endEvent);
  }

  async recordLlmCall(options: RecordLlmCallOptions): Promise<void> {
    const startId = uuidv4();
    const startEvent: TraceEvent = {
      id: startId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      type: EventType.LLM_CALL_START,
      metadata: { model: options.model, input: options.input },
    } as TraceEvent;
    await this.storage.write(startEvent);

    const endEvent: TraceEvent = {
      ...this.makeBase(EventType.LLM_CALL_END, startId),
      duration_ms: options.durationMs,
      metadata: {
        model: options.model,
        input: options.input,
        output: options.output,
        prompt_tokens: options.promptTokens,
        completion_tokens: options.completionTokens,
        cost_usd: options.costUsd,
      },
    } as TraceEvent;
    await this.storage.write(endEvent);
  }

  async recordFinalOutput(content: string): Promise<void> {
    const event: TraceEvent = {
      ...this.makeBase(EventType.FINAL_OUTPUT),
      metadata: { content },
    } as TraceEvent;
    await this.storage.write(event);
  }

  async end(): Promise<void> {
    const duration = Date.now() - this.startTime;
    const event: TraceEvent = {
      ...this.makeBase(EventType.SESSION_END),
      duration_ms: duration,
    } as TraceEvent;
    await this.storage.write(event);
    await this.storage.close();
  }
}
