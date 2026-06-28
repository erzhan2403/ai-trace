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
    error?: {
        message: string;
        type: string;
    };
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
export declare class Session {
    readonly sessionId: string;
    readonly name: string;
    private storage;
    private startTime;
    private filePath;
    constructor(config: SessionConfig, storage: StorageBackend, filePath: string);
    getFilePath(): string;
    writeSessionStart(): Promise<void>;
    private makeBase;
    recordUserInput(content: string): Promise<void>;
    recordStep(options: {
        description: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    recordToolCall(options: RecordToolCallOptions): Promise<void>;
    recordLlmCall(options: RecordLlmCallOptions): Promise<void>;
    recordFinalOutput(content: string): Promise<void>;
    end(): Promise<void>;
}
//# sourceMappingURL=session.d.ts.map