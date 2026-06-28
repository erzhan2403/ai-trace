import { TraceEvent } from "../schema/events.js";
export interface StorageBackend {
    write(event: TraceEvent): Promise<void>;
    readAll(filePath: string): Promise<TraceEvent[]>;
    getFilePath(sessionId: string, sessionName: string): string;
    close(): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map