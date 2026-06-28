"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryCommand = summaryCommand;
const jsonl_js_1 = require("../../storage/jsonl.js");
const console_js_1 = require("../../reporters/console.js");
async function summaryCommand(filePath) {
    const storage = new jsonl_js_1.JsonlStorage();
    const events = await storage.readAll(filePath);
    (0, console_js_1.printSummary)(events, filePath);
}
//# sourceMappingURL=summary.js.map