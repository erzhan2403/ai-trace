#!/usr/bin/env node
import { Command } from "commander";
import { summaryCommand } from "./commands/summary.js";
import { reportCommand } from "./commands/report.js";

const program = new Command();

program
  .name("ai-trace")
  .description("Local, open-source, vendor-neutral tracing for AI agents")
  .version("0.1.0");

program
  .command("summary <trace-file>")
  .description("Print a summary of a trace session")
  .action(async (file: string) => {
    try {
      await summaryCommand(file);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("report <trace-file>")
  .description("Generate a static HTML report from a trace session")
  .action(async (file: string) => {
    try {
      await reportCommand(file);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
