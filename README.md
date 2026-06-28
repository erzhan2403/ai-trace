# ai-trace

**Local, open-source, vendor-neutral tracing for AI agents.**

ai-trace records every tool call, LLM request, and agent step — stored locally as JSONL, viewable as a static HTML report. No cloud. No account. No data leaves your machine.

```
═══════════════════════════════════════
  ai-trace summary
═══════════════════════════════════════
  Session:  support-agent
  Duration: 4.6s

  LLM calls:   2            Tokens:      261
  Tool calls:  6            Est. cost:   $0.0005
  Errors:      1            Slowest tool: search_database (3506ms)

  Warnings & Issues
  ─────────────────
  ⚠ Slow tool: search_database (3506ms > 3000ms)
  ⚠ Loop detected: check_status called 3× in a row
  ✗ Tool error: send_sms — SMS gateway timeout
═══════════════════════════════════════
```

---

## Why ai-trace?

When building AI agents, things go wrong in non-obvious ways:

- A tool silently times out and the agent retries 5 times
- An LLM call takes 8 seconds with no visibility into why
- The agent loops on the same tool call indefinitely
- Token costs are invisible until the invoice arrives

Existing tools either require a cloud account, lock you into a specific framework, or only work with one LLM provider. ai-trace is a simple, local, framework-agnostic solution: instrument your agent with a few lines, get a full trace.

---

## Install

```bash
npm install @yerzhan_ai/ai-trace
```

Requires Node.js 18+.

---

## Quick start

```typescript
import { trace } from "@yerzhan_ai/ai-trace";

const session = await trace.startSession({ name: "support-agent" });

await session.recordUserInput("Find invoice #123 and notify the client.");

await session.recordStep({ description: "Searching invoice database" });

await session.recordToolCall({
  name: "search_invoice",
  input: { invoiceId: "123" },
  output: { status: "found", amount: 250 },
  durationMs: 420,
});

await session.recordLlmCall({
  model: "gpt-4.1-mini",
  input: "Invoice found. Should I notify the client?",
  output: "Yes, send a notification email.",
  promptTokens: 120,
  completionTokens: 18,
  costUsd: 0.0003,
  durationMs: 980,
});

await session.recordFinalOutput("Invoice #123 found. Client notified.");
await session.end();
```

Traces are saved to `./traces/session_YYYY-MM-DD_HHmmss_<name>.jsonl`.

---

## CLI

### Summary

```bash
npx ai-trace summary ./traces/session_xxx.jsonl
```

Prints session stats, warnings, and errors to the terminal in seconds.

### HTML Report

```bash
npx ai-trace report ./traces/session_xxx.jsonl
```

Generates a self-contained HTML file next to the trace. Open it in any browser — no server needed, no external dependencies.

The report includes:

- Summary cards (duration, LLM calls, tool calls, errors, tokens, cost)
- Full event timeline
- Tool calls table with input/output previews and latency
- LLM calls table with token usage and cost
- Doctor warnings (slow tools, loops, errors)

---

## SDK reference

### `trace.configure(options)`

```typescript
trace.configure({ outputDir: "./my-traces" });
```

Call once before `startSession`. Default output dir is `./traces`.

### `trace.startSession(config) → Session`

```typescript
const session = await trace.startSession({ name: "my-agent" });
```

### `session.recordUserInput(content)`

### `session.recordStep({ description })`

### `session.recordToolCall(options)`

```typescript
// Success
await session.recordToolCall({
  name: "search_docs",
  input: { query: "pricing" },
  output: { results: ["doc1", "doc2"] },
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

### `session.recordLlmCall(options)`

```typescript
await session.recordLlmCall({
  model: "gpt-4.1-mini",
  input: "Summarize the results.",
  output: "The invoice was found.",
  promptTokens: 95,
  completionTokens: 12,
  costUsd: 0.0002,
  durationMs: 750,
});
```

### `session.recordFinalOutput(content)`

### `session.end()`

Always call `end()` — it writes the final `SESSION_END` event and closes the file.

---

## Doctor warnings

The analyzer checks for:

| Warning | Condition |
|---|---|
| Slow tool | Tool call duration > 3,000ms |
| Slow LLM | LLM call duration > 5,000ms |
| Loop | Same tool called 3+ times consecutively |
| Tool error | Any failed tool call |

---

## Run the example

```bash
git clone https://github.com/erzhan2403/ai-trace
cd ai-trace
npm install
npm run example
npx tsx src/cli/index.ts summary traces/*.jsonl
npx tsx src/cli/index.ts report traces/*.jsonl
```

---

## Development

```bash
npm install
npm run build     # compile TypeScript
npm test          # run tests (vitest)
npm run example   # run the demo agent
```

---

## Roadmap

| Version | Focus |
|---|---|
| **v0.1** | SDK + JSONL storage + CLI summary + HTML report ✅ |
| v0.2 | `wrapTool()` helper, `doctor` command, improved timeline |
| v0.3 | SQLite backend, `ai-trace list`, session diff |
| v0.4 | OpenAI + Anthropic built-in collectors |
| v0.5 | MCP stdio proxy, monorepo |
| v1.0 | OpenTelemetry export, local web UI, plugin API |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
