import { JsonlStorage } from "../../storage/jsonl.js";
import { printSummary } from "../../reporters/console.js";

export async function summaryCommand(filePath: string): Promise<void> {
  const storage = new JsonlStorage();
  const events = await storage.readAll(filePath);
  printSummary(events, filePath);
}
