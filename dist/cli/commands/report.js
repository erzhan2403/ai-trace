"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCommand = reportCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const jsonl_js_1 = require("../../storage/jsonl.js");
const html_js_1 = require("../../reporters/html.js");
async function reportCommand(filePath) {
    const storage = new jsonl_js_1.JsonlStorage();
    const events = await storage.readAll(filePath);
    const html = (0, html_js_1.generateHtmlReport)(events, filePath);
    const outputPath = path_1.default.resolve(filePath + ".html");
    fs_1.default.writeFileSync(outputPath, html, "utf-8");
    console.log(chalk_1.default.green(`\n✓ HTML report generated:`));
    console.log(chalk_1.default.cyan(`  ${outputPath}\n`));
}
//# sourceMappingURL=report.js.map