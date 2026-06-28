import fs from "fs";
import path from "path";
import chalk from "chalk";
import { JsonlStorage } from "../../storage/jsonl.js";
import { generateHtmlReport } from "../../reporters/html.js";

export async function reportCommand(filePath: string): Promise<void> {
  const storage = new JsonlStorage();
  const events = await storage.readAll(filePath);

  const html = generateHtmlReport(events, filePath);
  const outputPath = path.resolve(filePath + ".html");
  fs.writeFileSync(outputPath, html, "utf-8");

  console.log(chalk.green(`\n✓ HTML report generated:`));
  console.log(chalk.cyan(`  ${outputPath}\n`));
}
