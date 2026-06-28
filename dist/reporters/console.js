"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSummary = buildSummary;
exports.printSummary = printSummary;
const chalk_1 = __importDefault(require("chalk"));
const events_js_1 = require("../schema/events.js");
const errors_js_1 = require("../analyzers/errors.js");
const latency_js_1 = require("../analyzers/latency.js");
const loops_js_1 = require("../analyzers/loops.js");
function buildSummary(events) {
    const sessionStart = events.find((e) => e.type === events_js_1.EventType.SESSION_START);
    const sessionEnd = events.find((e) => e.type === events_js_1.EventType.SESSION_END);
    const sessionName = sessionStart
        ? sessionStart.metadata.name
        : "unknown";
    const duration = sessionEnd?.duration_ms ?? null;
    const llmCalls = events.filter((e) => e.type === events_js_1.EventType.LLM_CALL_END);
    const toolCalls = events.filter((e) => e.type === events_js_1.EventType.TOOL_CALL_END);
    const totalTokens = llmCalls.reduce((sum, e) => {
        const meta = e.metadata;
        return sum + (meta.prompt_tokens ?? 0) + (meta.completion_tokens ?? 0);
    }, 0);
    const totalCost = llmCalls.reduce((sum, e) => {
        const meta = e.metadata;
        return sum + (meta.cost_usd ?? 0);
    }, 0);
    const errors = (0, errors_js_1.analyzeErrors)(events);
    const latencyWarnings = (0, latency_js_1.analyzeLatency)(events);
    const loopWarnings = (0, loops_js_1.analyzeLoops)(events);
    const slowest = (0, latency_js_1.findSlowestTool)(events);
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
function printSummary(events, filePath) {
    const s = buildSummary(events);
    console.log("\n" + chalk_1.default.bold.cyan("═══════════════════════════════════════"));
    console.log(chalk_1.default.bold.cyan("  ai-trace summary"));
    console.log(chalk_1.default.bold.cyan("═══════════════════════════════════════"));
    console.log(chalk_1.default.gray(`  File: ${filePath}`));
    console.log();
    console.log(chalk_1.default.bold("  Session:  ") + chalk_1.default.white(s.sessionName));
    console.log(chalk_1.default.bold("  Duration: ") +
        chalk_1.default.white(s.duration !== null ? `${(s.duration / 1000).toFixed(1)}s` : "unknown"));
    console.log();
    console.log(chalk_1.default.bold("  LLM calls:   ") + chalk_1.default.blue(s.llmCallCount));
    console.log(chalk_1.default.bold("  Tool calls:  ") + chalk_1.default.blue(s.toolCallCount));
    console.log(chalk_1.default.bold("  Errors:      ") +
        (s.errorCount > 0 ? chalk_1.default.red(s.errorCount) : chalk_1.default.green(s.errorCount)));
    console.log(chalk_1.default.bold("  Tokens:      ") + chalk_1.default.blue(s.totalTokens.toLocaleString()));
    console.log(chalk_1.default.bold("  Est. cost:   ") + chalk_1.default.blue(`$${s.totalCost.toFixed(4)}`));
    if (s.slowest) {
        console.log(chalk_1.default.bold("  Slowest tool:") +
            chalk_1.default.yellow(` ${s.slowest.name} (${s.slowest.duration_ms}ms)`));
    }
    console.log();
    if (s.warningCount > 0 || s.errorCount > 0) {
        console.log(chalk_1.default.bold.yellow("  Warnings & Issues"));
        console.log(chalk_1.default.gray("  ─────────────────"));
        for (const w of s.latencyWarnings) {
            const label = w.type === "slow_tool" ? "Slow tool" : "Slow LLM";
            console.log(chalk_1.default.yellow(`  ⚠ ${label}: ${w.name} (${w.duration_ms}ms > ${w.threshold_ms}ms)`));
        }
        for (const w of s.loopWarnings) {
            console.log(chalk_1.default.yellow(`  ⚠ Loop detected: ${w.tool_name} called ${w.consecutive_count}x in a row`));
        }
        for (const e of s.errors.details) {
            console.log(chalk_1.default.red(`  ✗ Tool error: ${e.tool_name} — ${e.error_message}`));
        }
        console.log();
    }
    else {
        console.log(chalk_1.default.green("  ✓ No warnings detected"));
        console.log();
    }
    console.log(chalk_1.default.bold.cyan("═══════════════════════════════════════\n"));
}
//# sourceMappingURL=console.js.map