import { Session, SessionConfig } from "./session.js";
export { Session } from "./session.js";
export { EventType } from "./schema/events.js";
export type { TraceEvent } from "./schema/events.js";
export type { SessionConfig } from "./session.js";
declare class Tracer {
    private outputDir;
    configure(options: {
        outputDir?: string;
    }): void;
    startSession(config: SessionConfig): Session;
}
export declare const trace: Tracer;
//# sourceMappingURL=index.d.ts.map