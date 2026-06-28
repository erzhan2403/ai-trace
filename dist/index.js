"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = exports.EventType = exports.Session = void 0;
const session_js_1 = require("./session.js");
const jsonl_js_1 = require("./storage/jsonl.js");
var session_js_2 = require("./session.js");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return session_js_2.Session; } });
var events_js_1 = require("./schema/events.js");
Object.defineProperty(exports, "EventType", { enumerable: true, get: function () { return events_js_1.EventType; } });
class Tracer {
    constructor() {
        this.outputDir = "./traces";
    }
    configure(options) {
        if (options.outputDir)
            this.outputDir = options.outputDir;
    }
    startSession(config) {
        const storage = new jsonl_js_1.JsonlStorage(this.outputDir);
        const filePath = storage.getFilePath(config.name, config.name);
        storage.setFilePath(filePath);
        const session = new session_js_1.Session(config, storage, filePath);
        // Queue SESSION_START — will complete before first await in user code
        session.writeSessionStart();
        return session;
    }
}
exports.trace = new Tracer();
//# sourceMappingURL=index.js.map