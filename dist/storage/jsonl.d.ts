import { TraceEvent } from "../schema/events.js";
import { StorageBackend } from "./base.js";
export declare class JsonlStorage implements StorageBackend {
    private outputDir;
    private writeStream;
    private currentFilePath;
    constructor(outputDir?: string);
    getFilePath(sessionId: string, sessionName: string): string;
    private ensureStream;
    write(event: TraceEvent): Promise<void>;
    setFilePath(filePath: string): void;
    readAll(filePath: string): Promise<TraceEvent[]>;
    private closeStream;
    close(): Promise<void>;
}
//# sourceMappingURL=jsonl.d.ts.map