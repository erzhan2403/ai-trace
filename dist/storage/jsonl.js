"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonlStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class JsonlStorage {
    constructor(outputDir = "./traces") {
        this.writeStream = null;
        this.currentFilePath = null;
        this.outputDir = outputDir;
    }
    getFilePath(sessionId, sessionName) {
        const now = new Date();
        const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const timePart = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHmmss
        const safeName = sessionName.replace(/[^a-zA-Z0-9_-]/g, "_");
        return path_1.default.join(this.outputDir, `session_${datePart}_${timePart}_${safeName}.jsonl`);
    }
    ensureStream(filePath) {
        if (this.currentFilePath !== filePath) {
            this.closeStream();
            if (!fs_1.default.existsSync(this.outputDir)) {
                fs_1.default.mkdirSync(this.outputDir, { recursive: true });
            }
            this.writeStream = fs_1.default.createWriteStream(filePath, { flags: "a" });
            this.currentFilePath = filePath;
        }
    }
    async write(event) {
        if (!this.currentFilePath) {
            throw new Error("Storage not initialized. Call setFilePath first.");
        }
        this.ensureStream(this.currentFilePath);
        return new Promise((resolve, reject) => {
            this.writeStream.write(JSON.stringify(event) + "\n", (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    setFilePath(filePath) {
        this.currentFilePath = filePath;
        if (!fs_1.default.existsSync(this.outputDir)) {
            fs_1.default.mkdirSync(this.outputDir, { recursive: true });
        }
        this.writeStream = fs_1.default.createWriteStream(filePath, { flags: "a" });
    }
    async readAll(filePath) {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`Trace file not found: ${filePath}`);
        }
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        const lines = content.split("\n").filter((l) => l.trim());
        return lines.map((line) => JSON.parse(line));
    }
    closeStream() {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
        }
    }
    async close() {
        return new Promise((resolve) => {
            if (this.writeStream) {
                this.writeStream.end(() => {
                    this.writeStream = null;
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.JsonlStorage = JsonlStorage;
//# sourceMappingURL=jsonl.js.map