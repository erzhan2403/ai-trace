import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { EventType } from "../src/schema/events.js";
import { JsonlStorage } from "../src/storage/jsonl.js";
import { buildSummary } from "../src/reporters/console.js";
import { analyzeErrors } from "../src/analyzers/errors.js";
import { analyzeLatency } from "../src/analyzers/latency.js";
import { analyzeLoops } from "../src/analyzers/loops.js";
import { trace } from "../src/index.js";

// ── Schema ────────────────────────────────────────────────────────────────────

describe("EventType enum", () => {
  it("has all required event types", () => {
    const required = [
      "SESSION_START", "SESSION_END", "USER_INPUT", "AGENT_STEP",
      "LLM_CALL_START", "LLM_CALL_END",
      "TOOL_CALL_START", "TOOL_CALL_END", "TOOL_CALL_ERROR",
      "FINAL_OUTPUT",
    ];
    for (const t of required) {
      expect(EventType).toHaveProperty(t);
    }
  });
});

// ── Storage ───────────────────────────────────────────────────────────────────

describe("JsonlStorage", () => {
  let tmpDir: string;
  let storage: JsonlStorage;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-trace-test-"));
    storage = new JsonlStorage(tmpDir);
  });

  afterEach(async () => {
    await storage.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates filename with session name", () => {
    const fp = storage.getFilePath("abc", "my-agent");
    expect(fp).toContain("my-agent");
    expect(fp).toContain(".jsonl");
  });

  it("writes and reads events", async () => {
    const fp = path.join(tmpDir, "test.jsonl");
    storage.setFilePath(fp);

    const event = {
      id: "test-id",
      session_id: "sess-1",
      timestamp: new Date().toISOString(),
      type: EventType.USER_INPUT,
      metadata: { content: "hello" },
    };

    await storage.write(event as any);
    await storage.close();

    const events = await storage.readAll(fp);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(EventType.USER_INPUT);
  });

  it("throws when reading non-existent file", async () => {
    await expect(storage.readAll("/no/such/file.jsonl")).rejects.toThrow();
  });
});

// ── Analyzers ─────────────────────────────────────────────────────────────────

describe("analyzeErrors", () => {
  it("returns zero count when no errors", () => {
    const result = analyzeErrors([]);
    expect(result.count).toBe(0);
    expect(result.failedTools).toHaveLength(0);
  });

  it("counts tool errors correctly", () => {
    const events: any[] = [
      {
        id: "1", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_ERROR, duration_ms: 100,
        metadata: { tool_name: "send_email", error_message: "timeout", error_type: "TimeoutError" },
      },
      {
        id: "2", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_ERROR, duration_ms: 100,
        metadata: { tool_name: "send_email", error_message: "timeout", error_type: "TimeoutError" },
      },
    ];
    const result = analyzeErrors(events);
    expect(result.count).toBe(2);
    expect(result.failedTools).toEqual(["send_email"]);
  });
});

describe("analyzeLatency", () => {
  it("warns when tool call exceeds 3000ms", () => {
    const events: any[] = [
      {
        id: "1", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_END, duration_ms: 4000,
        metadata: { tool_name: "slow_tool", output: "x", output_size_bytes: 1 },
      },
    ];
    const warnings = analyzeLatency(events);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("slow_tool");
    expect(warnings[0].name).toBe("slow_tool");
  });

  it("warns when LLM call exceeds 5000ms", () => {
    const events: any[] = [
      {
        id: "1", session_id: "s", timestamp: "", type: EventType.LLM_CALL_END, duration_ms: 6000,
        metadata: { model: "gpt-4", input: "x", output: "y", prompt_tokens: 10, completion_tokens: 5, cost_usd: 0.001 },
      },
    ];
    const warnings = analyzeLatency(events);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("slow_llm");
  });

  it("returns no warnings for fast calls", () => {
    const events: any[] = [
      {
        id: "1", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_END, duration_ms: 500,
        metadata: { tool_name: "fast_tool", output: "x", output_size_bytes: 1 },
      },
    ];
    expect(analyzeLatency(events)).toHaveLength(0);
  });
});

describe("analyzeLoops", () => {
  it("detects 3 consecutive calls to same tool", () => {
    const makeCall = (name: string): any => ({
      id: "x", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_START,
      metadata: { tool_name: name, input: {} },
    });

    const events = [makeCall("check"), makeCall("check"), makeCall("check")];
    const warnings = analyzeLoops(events);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].tool_name).toBe("check");
    expect(warnings[0].consecutive_count).toBe(3);
  });

  it("does not warn for 2 consecutive calls", () => {
    const makeCall = (name: string): any => ({
      id: "x", session_id: "s", timestamp: "", type: EventType.TOOL_CALL_START,
      metadata: { tool_name: name, input: {} },
    });
    expect(analyzeLoops([makeCall("tool"), makeCall("tool")])).toHaveLength(0);
  });
});

// ── SDK integration ───────────────────────────────────────────────────────────

describe("trace SDK", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-trace-sdk-"));
    trace.configure({ outputDir: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a session and writes events to JSONL", async () => {
    const session = trace.startSession({ name: "test-agent" });
    await session.recordUserInput("Hello");
    await session.recordToolCall({
      name: "lookup",
      input: { q: "test" },
      output: { result: "ok" },
      durationMs: 100,
    });
    await session.recordFinalOutput("Done.");
    await session.end();

    const fp = session.getFilePath();
    expect(fs.existsSync(fp)).toBe(true);

    const storage = new JsonlStorage(tmpDir);
    const events = await storage.readAll(fp);
    await storage.close();

    const types = events.map((e) => e.type);
    expect(types).toContain(EventType.SESSION_START);
    expect(types).toContain(EventType.USER_INPUT);
    expect(types).toContain(EventType.TOOL_CALL_START);
    expect(types).toContain(EventType.TOOL_CALL_END);
    expect(types).toContain(EventType.FINAL_OUTPUT);
    expect(types).toContain(EventType.SESSION_END);
  });

  it("buildSummary returns correct counts", async () => {
    const session = trace.startSession({ name: "summary-test" });
    await session.recordToolCall({ name: "t1", input: {}, output: {}, durationMs: 100 });
    await session.recordLlmCall({
      model: "gpt-4.1-mini", input: "q", output: "a",
      promptTokens: 50, completionTokens: 10, costUsd: 0.0001, durationMs: 300,
    });
    await session.end();

    const storage = new JsonlStorage(tmpDir);
    const events = await storage.readAll(session.getFilePath());
    await storage.close();

    const summary = buildSummary(events);
    expect(summary.toolCallCount).toBe(1);
    expect(summary.llmCallCount).toBe(1);
    expect(summary.totalTokens).toBe(60);
  });
});
