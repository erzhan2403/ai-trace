import { Session, SessionConfig } from "./session.js";
import { JsonlStorage } from "./storage/jsonl.js";

export { Session } from "./session.js";
export { EventType } from "./schema/events.js";
export type { TraceEvent } from "./schema/events.js";
export type { SessionConfig } from "./session.js";

class Tracer {
  private outputDir: string = "./traces";

  configure(options: { outputDir?: string }): void {
    if (options.outputDir) this.outputDir = options.outputDir;
  }

  startSession(config: SessionConfig): Session {
    const storage = new JsonlStorage(this.outputDir);
    const filePath = storage.getFilePath(config.name, config.name);
    storage.setFilePath(filePath);
    const session = new Session(config, storage, filePath);
    // Queue SESSION_START — will complete before first await in user code
    session.writeSessionStart();
    return session;
  }
}

export const trace = new Tracer();
