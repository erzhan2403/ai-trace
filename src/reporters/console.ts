import chalk from "chalk";
import { EventType, TraceEvent } from "../schema/events.js";
import { analyzeErrors } from "../analyzers/errors.js";
import { analyzeLatency, findSlowestTool } from "../analyzers/latency.js";
import { analyzeLoops } from "../analyzers/loops.js";

export function buildSummary(events: TraceEvent[]) {
  const sessionStart = events.find((e) => e.type === EventType.SESSION_START);
  const sessionEnd = events.find((e) => e.type === EventType.SESSION_END);

  const sessionName = sessionStart
    ? (sessionStart.metadata as { name: string }).name
    : "unknown";

  const duration = sessionEnd?.duration_ms ?? null;

  const llmCalls = events.filter((e) => e.type === EventType.LLM_CALL_END);
  const toolCalls = events.filter((e) => e.type === EventType.TOOL_CALL_END);

  const totalTokens = llmCalls.reduce((sum, e) => {
    const meta = e.metadata as { prompt_tokens: number; completion_tokens: number };
    return sum + (meta.prompt_tokens ?? 0) + (meta.completion_tokens ?? 0);
  }, 0);

  const totalCost = llmCalls.reduce((sum, e) => {
    const meta = e.metadata as { cost_usd: number };
    return sum + (meta.cost_usd ?? 0);
  }, 0);

  const errors = analyzeErrors(events);
  const latencyWarnings = analyzeLatency(events);
  const loopWarnings = analyzeLoops(events);
  const slowest = findSlowestTool(events);

  const warningCount = latencyWarnings.length + loopWarnings.length;

  return {
    sessionName,
    duration,
    llmCallCount: llmCalls.length,
    toolCallCount: toolCalls.length,
    errorCount: errors.count,
    totalTokens,
    totalCost,
    slowest,
    warningCount,
    errors,
    latencyWarnings,
    loopWarnings,
  };
}

export function printSummary(events: TraceEvent[], filePath: string): void {
  const s = buildSummary(events);

  console.log("\n" + chalk.bold.cyan("═══════════════════════════════════════"));
  console.log(chalk.bold.cyan("  ai-trace summary"));
  console.log(chalk.bold.cyan("═══════════════════════════════════════"));
  console.log(chalk.gray(`  File: ${filePath}`));
  console.log();

  console.log(chalk.bold("  Session:  ") + chalk.white(s.sessionName));
  console.log(
    chalk.bold("  Duration: ") +
      chalk.white(s.duration !== null ? `${(s.duration / 1000).toFixed(1)}s` : "unknown")
  );
  console.log();

  console.log(chalk.bold("  LLM calls:   ") + chalk.blue(s.llmCallCount));
  console.log(chalk.bold("  Tool calls:  ") + chalk.blue(s.toolCallCount));
  console.log(
    chalk.bold("  Errors:      ") +
      (s.errorCount > 0 ? chalk.red(s.errorCount) : chalk.green(s.errorCount))
  );
  console.log(chalk.bold("  Tokens:      ") + chalk.blue(s.totalTokens.toLocaleString()));
  console.log(
    chalk.bold("  Est. cost:   ") + chalk.blue(`$${s.totalCost.toFixed(4)}`)
  );

  if (s.slowest) {
    console.log(
      chalk.bold("  Slowest tool:") +
        chalk.yellow(` ${s.slowest.name} (${s.slowest.duration_ms}ms)`)
    );
  }

  console.log();

  if (s.warningCount > 0 || s.errorCount > 0) {
    console.log(chalk.bold.yellow("  Warnings & Issues"));
    console.log(chalk.gray("  ─────────────────"));

    for (const w of s.latencyWarnings) {
      const label = w.type === "slow_tool" ? "Slow tool" : "Slow LLM";
      console.log(chalk.yellow(`  ⚠ ${label}: ${w.name} (${w.duration_ms}ms > ${w.threshold_ms}ms)`));
    }

    for (const w of s.loopWarnings) {
      console.log(
        chalk.yellow(`  ⚠ Loop detected: ${w.tool_name} called ${w.consecutive_count}x in a row`)
      );
    }

    for (const e of s.errors.details) {
      console.log(chalk.red(`  ✗ Tool error: ${e.tool_name} — ${e.error_message}`));
    }
    console.log();
  } else {
    console.log(chalk.green("  ✓ No warnings detected"));
    console.log();
  }

  console.log(chalk.bold.cyan("═══════════════════════════════════════\n"));
}
