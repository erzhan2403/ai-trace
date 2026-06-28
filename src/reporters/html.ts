import { EventType, TraceEvent } from "../schema/events.js";
import { buildSummary } from "./console.js";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function truncate(str: string, max = 120): string {
  const s = typeof str === "string" ? str : JSON.stringify(str);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function generateHtmlReport(events: TraceEvent[], sessionFilePath: string): string {
  const s = buildSummary(events);

  const sessionStart = events.find((e) => e.type === EventType.SESSION_START);
  const startTime = sessionStart ? new Date(sessionStart.timestamp).toLocaleString() : "unknown";

  // Timeline rows
  const timelineRows = events
    .filter((e) =>
      [
        EventType.USER_INPUT,
        EventType.AGENT_STEP,
        EventType.LLM_CALL_START,
        EventType.LLM_CALL_END,
        EventType.TOOL_CALL_START,
        EventType.TOOL_CALL_END,
        EventType.TOOL_CALL_ERROR,
        EventType.FINAL_OUTPUT,
      ].includes(e.type)
    )
    .map((e) => {
      const meta = e.metadata as Record<string, unknown>;
      const typeClass = e.type.toLowerCase().replace(/_/g, "-");
      const detail = meta
        ? truncate(
            meta.tool_name?.toString() ??
              meta.description?.toString() ??
              meta.content?.toString() ??
              meta.model?.toString() ??
              ""
          )
        : "";
      const duration = e.duration_ms !== undefined ? formatMs(e.duration_ms) : "";
      return `
        <tr class="event-row ${typeClass}">
          <td class="time">${new Date(e.timestamp).toLocaleTimeString()}</td>
          <td><span class="badge badge-${typeClass}">${escapeHtml(e.type)}</span></td>
          <td>${escapeHtml(detail)}</td>
          <td class="duration">${duration}</td>
        </tr>`;
    })
    .join("");

  // Tool calls table
  const toolCallRows = events
    .filter((e) => e.type === EventType.TOOL_CALL_END || e.type === EventType.TOOL_CALL_ERROR)
    .map((e) => {
      const meta = e.metadata as Record<string, unknown>;
      const isError = e.type === EventType.TOOL_CALL_ERROR;
      const statusBadge = isError
        ? `<span class="badge badge-error">ERROR</span>`
        : `<span class="badge badge-success">OK</span>`;
      const outputPreview = isError
        ? escapeHtml(String(meta.error_message ?? ""))
        : escapeHtml(truncate(JSON.stringify(meta.output ?? "")));

      // Find matching start event for input
      const startEvent = events.find(
        (s) =>
          s.type === EventType.TOOL_CALL_START &&
          (s.metadata as Record<string, unknown>).tool_name === meta.tool_name
      );
      const inputPreview = startEvent
        ? escapeHtml(truncate(JSON.stringify((startEvent.metadata as Record<string, unknown>).input ?? "")))
        : "";

      return `
        <tr>
          <td><strong>${escapeHtml(String(meta.tool_name ?? ""))}</strong></td>
          <td class="mono small">${inputPreview}</td>
          <td class="mono small">${outputPreview}</td>
          <td class="duration">${e.duration_ms !== undefined ? formatMs(e.duration_ms) : ""}</td>
          <td>${statusBadge}</td>
        </tr>`;
    })
    .join("");

  // LLM calls table
  const llmRows = events
    .filter((e) => e.type === EventType.LLM_CALL_END)
    .map((e) => {
      const meta = e.metadata as Record<string, unknown>;
      return `
        <tr>
          <td>${escapeHtml(String(meta.model ?? ""))}</td>
          <td class="mono small">${escapeHtml(truncate(String(meta.input ?? "")))}</td>
          <td class="mono small">${escapeHtml(truncate(String(meta.output ?? "")))}</td>
          <td>${meta.prompt_tokens ?? 0} / ${meta.completion_tokens ?? 0}</td>
          <td>$${Number(meta.cost_usd ?? 0).toFixed(4)}</td>
          <td class="duration">${e.duration_ms !== undefined ? formatMs(e.duration_ms) : ""}</td>
        </tr>`;
    })
    .join("");

  // Warnings section
  const warningItems = [
    ...s.latencyWarnings.map(
      (w) =>
        `<li class="warning">⚠ ${w.type === "slow_tool" ? "Slow tool" : "Slow LLM"}: <strong>${escapeHtml(w.name)}</strong> took ${formatMs(w.duration_ms)} (threshold: ${formatMs(w.threshold_ms)})</li>`
    ),
    ...s.loopWarnings.map(
      (w) =>
        `<li class="warning">⚠ Loop detected: <strong>${escapeHtml(w.tool_name)}</strong> called ${w.consecutive_count}× consecutively</li>`
    ),
    ...s.errors.details.map(
      (e) =>
        `<li class="error-item">✗ Tool error: <strong>${escapeHtml(e.tool_name)}</strong> — ${escapeHtml(e.error_message)}</li>`
    ),
  ].join("");

  const warningsSection =
    warningItems
      ? `<ul class="warnings-list">${warningItems}</ul>`
      : `<p class="ok">✓ No warnings detected</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ai-trace report — ${escapeHtml(s.sessionName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f1117; color: #e1e4e8; font-size: 14px; }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
  h1 { font-size: 22px; font-weight: 700; color: #58a6ff; margin-bottom: 4px; }
  .subtitle { color: #8b949e; font-size: 13px; margin-bottom: 32px; }
  h2 { font-size: 16px; font-weight: 600; color: #c9d1d9; margin: 32px 0 12px; border-bottom: 1px solid #21262d; padding-bottom: 8px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 8px; }
  .card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 16px; }
  .card-label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .card-value { font-size: 24px; font-weight: 700; color: #58a6ff; }
  .card-value.red { color: #f85149; }
  .card-value.green { color: #3fb950; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; border: 1px solid #21262d; }
  th { background: #1c2128; color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }
  td { padding: 9px 12px; border-top: 1px solid #21262d; color: #c9d1d9; vertical-align: top; }
  tr:hover td { background: #1c2128; }
  .time { color: #8b949e; font-size: 12px; white-space: nowrap; }
  .duration { color: #8b949e; font-size: 12px; white-space: nowrap; text-align: right; }
  .mono { font-family: "SF Mono", Consolas, monospace; }
  .small { font-size: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-tool-call-start, .badge-tool_call_start { background: #1f3a5f; color: #58a6ff; }
  .badge-tool-call-end, .badge-tool_call_end { background: #1a3a2a; color: #3fb950; }
  .badge-tool-call-error, .badge-tool_call_error { background: #3a1f1f; color: #f85149; }
  .badge-llm-call-start, .badge-llm_call_start { background: #2d2250; color: #a371f7; }
  .badge-llm-call-end, .badge-llm_call_end { background: #1f2d50; color: #79c0ff; }
  .badge-user-input, .badge-user_input { background: #2d2a1a; color: #e3b341; }
  .badge-agent-step, .badge-agent_step { background: #1e2228; color: #8b949e; }
  .badge-final-output, .badge-final_output { background: #1a3a2a; color: #3fb950; }
  .badge-error { background: #3a1f1f; color: #f85149; }
  .badge-success { background: #1a3a2a; color: #3fb950; }
  .warnings-list { list-style: none; background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 16px; }
  .warnings-list li { padding: 6px 0; border-bottom: 1px solid #21262d; }
  .warnings-list li:last-child { border-bottom: none; }
  .warning { color: #e3b341; }
  .error-item { color: #f85149; }
  .ok { color: #3fb950; padding: 12px; background: #161b22; border: 1px solid #21262d; border-radius: 8px; }
  .footer { margin-top: 40px; color: #484f58; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<div class="container">
  <h1>ai-trace report</h1>
  <p class="subtitle">Session: <strong>${escapeHtml(s.sessionName)}</strong> &nbsp;·&nbsp; ${escapeHtml(startTime)} &nbsp;·&nbsp; ${escapeHtml(sessionFilePath)}</p>

  <div class="cards">
    <div class="card">
      <div class="card-label">Duration</div>
      <div class="card-value">${s.duration !== null ? `${(s.duration / 1000).toFixed(1)}s` : "—"}</div>
    </div>
    <div class="card">
      <div class="card-label">LLM Calls</div>
      <div class="card-value">${s.llmCallCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Tool Calls</div>
      <div class="card-value">${s.toolCallCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Errors</div>
      <div class="card-value ${s.errorCount > 0 ? "red" : "green"}">${s.errorCount}</div>
    </div>
    <div class="card">
      <div class="card-label">Tokens</div>
      <div class="card-value">${s.totalTokens.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="card-label">Est. Cost</div>
      <div class="card-value">$${s.totalCost.toFixed(4)}</div>
    </div>
    <div class="card">
      <div class="card-label">Warnings</div>
      <div class="card-value ${s.warningCount > 0 ? "red" : "green"}">${s.warningCount}</div>
    </div>
  </div>

  <h2>Timeline</h2>
  <table>
    <thead>
      <tr><th>Time</th><th>Event</th><th>Detail</th><th>Duration</th></tr>
    </thead>
    <tbody>${timelineRows}</tbody>
  </table>

  <h2>Tool Calls</h2>
  ${
    toolCallRows
      ? `<table>
    <thead>
      <tr><th>Tool</th><th>Input</th><th>Output</th><th>Duration</th><th>Status</th></tr>
    </thead>
    <tbody>${toolCallRows}</tbody>
  </table>`
      : '<p style="color:#8b949e">No tool calls recorded.</p>'
  }

  <h2>LLM Calls</h2>
  ${
    llmRows
      ? `<table>
    <thead>
      <tr><th>Model</th><th>Input</th><th>Output</th><th>Tokens (P/C)</th><th>Cost</th><th>Duration</th></tr>
    </thead>
    <tbody>${llmRows}</tbody>
  </table>`
      : '<p style="color:#8b949e">No LLM calls recorded.</p>'
  }

  <h2>Doctor Warnings</h2>
  ${warningsSection}

  <div class="footer">Generated by ai-trace v0.1.0</div>
</div>
</body>
</html>`;
}
