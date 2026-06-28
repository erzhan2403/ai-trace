import fs from "fs";
import path from "path";
import { TraceEvent } from "../schema/events.js";
import { StorageBackend } from "./base.js";

export class JsonlStorage implements StorageBackend {
  private outputDir: string;
  private writeStream: fs.WriteStream | null = null;
  private currentFilePath: string | null = null;

  constructor(outputDir: string = "./traces") {
    this.outputDir = outputDir;
  }

  getFilePath(sessionId: string, sessionName: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHmmss
    const safeName = sessionName.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(
      this.outputDir,
      `session_${datePart}_${timePart}_${safeName}.jsonl`
    );
  }

  private ensureStream(filePath: string): void {
    if (this.currentFilePath !== filePath) {
      this.closeStream();
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      this.writeStream = fs.createWriteStream(filePath, { flags: "a" });
      this.currentFilePath = filePath;
    }
  }

  async write(event: TraceEvent): Promise<void> {
    if (!this.currentFilePath) {
      throw new Error("Storage not initialized. Call setFilePath first.");
    }
    this.ensureStream(this.currentFilePath);
    return new Promise((resolve, reject) => {
      this.writeStream!.write(JSON.stringify(event) + "\n", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setFilePath(filePath: string): void {
    this.currentFilePath = filePath;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    this.writeStream = fs.createWriteStream(filePath, { flags: "a" });
  }

  async readAll(filePath: string): Promise<TraceEvent[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Trace file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    return lines.map((line) => JSON.parse(line) as TraceEvent);
  }

  private closeStream(): void {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.writeStream) {
        this.writeStream.end(() => {
          this.writeStream = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
