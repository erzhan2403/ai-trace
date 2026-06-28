# ai-trace

**Local, open-source, vendor-neutral tracing SDK and CLI for AI agents.**

Record every tool call, LLM request, and agent step — locally, without sending data to any cloud.

```
Session: support-agent    Duration: 14.2s
LLM calls:   2            Tokens: 323
Tool calls:  6            Est. cost: $0.0005
Errors:      1            Warnings: 2

⚠ Slow tool: search_database (3521ms)
⚠ Loop detected: check_status called 3× in a row
✗ Tool error: send_sms — SMS gateway timeout
```

---

## Install

```bash
npm install ai-trace
```

Or clone and run locally:

```bash
git clone https://github.com/your-org/ai-trace
cd ai-trace
npm install
```

---

## Quick start

```typescript
import { trace } from "ai-trace";

const session = trace.startSession({ name: "support-agent" });

await session.recordUserInput("Find invoice #123");

await session.recordStep({ description: "Searching invoice database" });

await session.recordToolCall({
  name: "search_invoice",
  input: { invoiceId: "123" },
  output: { status: "found", amount: 250 },
  durationMs: 420,
});

await session.recordLlmCall({
  model: "gpt-4.1-mini",
  input: "Invoice found. Notify client?",
  output: "Yes, send an email.",
  promptTokens: 120,
  completionTokens: 12,
  costUsd: 0.0002,
  durationMs: 980,
});

await session.recordFinalOutput("Invoice #123 found and client notified.");
await session.end();
```

Traces are saved to `./traces/session_YYYY-MM-DD_HHmmss_<name>.jsonl`.

---

## Run the example

```bash
npm run example
# or
npx tsx examples/basic-agent.ts
```

---

## CLI

### Summary

Print a quick overview of a trace session:

```bash
npx tsx src/cli/index.ts summary ./traces/session_xxx.jsonl
```

After building:

```bash
npm run build
./dist/cli/index.js summary ./traces/session_xxx.jsonl
```

### HTML Report

Generate a static HTML report:

```bash
npx tsx src/cli/index.ts report ./traces/session_xxx.jsonl
# Output: ./traces/session_xxx.jsonl.html
```

Open the `.html` file in any browser — no server needed, no external dependencies.

---

## SDK Reference

### `trace.configure(options)`

```typescript
trace.configure({ outputDir: "./my-traces" });
```

### `trace.startSession(config) → Session`

```typescript
const session = trace.startSession({ name: "my-agent" });
```

### `session.recordUserInput(content)`

### `session.recordStep({ description })`

### `session.recordToolCall({ name, input, output?, durationMs?, error? })`

```typescript
// Success
await session.recordToolCall({
  name: "search_docs",
  input: { query: "pricing" },
  output: { results: [...] },
  durationMs: 320,
});

// Error
await session.recordToolCall({
  name: "send_email",
  input: { to: "user@example.com" },
  durationMs: 5000,
  error: { message: "SMTP timeout", type: "TimeoutError" },
});
```

### `session.recordLlmCall({ model, input, output, promptTokens, completionTokens, costUsd, durationMs })`

### `session.recordFinalOutput(content)`

### `session.end()`

Always call `end()` at the end of a session. It writes `SESSION_END` and closes the file.

---

## Analyzers

The doctor warnings check for:

| Warning | Condition |
|---|---|
| Slow tool | Tool call > 3000ms |
| Slow LLM | LLM call > 5000ms |
| Loop | Same tool called ≥ 3× consecutively |
| Tool error | Any `TOOL_CALL_ERROR` event |

---

## Tests

```bash
npm test
```

---

## Roadmap

| Version | Focus |
|---|---|
| v0.1 | SDK + JSONL + CLI summary + HTML report |
| v0.2 | `wrapTool()` helper, `doctor` command, improved timeline |
| v0.3 | SQLite backend, `ai-trace list`, session diff |
| v0.4 | OpenAI + Anthropic collectors |
| v0.5 | MCP stdio proxy, monorepo |
| v1.0 | OpenTelemetry export, web UI, plugin API |

---

## License

MIT
