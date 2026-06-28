#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const summary_js_1 = require("./commands/summary.js");
const report_js_1 = require("./commands/report.js");
const program = new commander_1.Command();
program
    .name("ai-trace")
    .description("Local, open-source, vendor-neutral tracing for AI agents")
    .version("0.1.0");
program
    .command("summary <trace-file>")
    .description("Print a summary of a trace session")
    .action(async (file) => {
    try {
        await (0, summary_js_1.summaryCommand)(file);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
});
program
    .command("report <trace-file>")
    .description("Generate a static HTML report from a trace session")
    .action(async (file) => {
    try {
        await (0, report_js_1.reportCommand)(file);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map