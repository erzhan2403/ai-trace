import { trace } from "../src/index.js";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fakeSearchInvoice(id: string): Promise<{ status: string; amount: number }> {
  await sleep(420);
  if (id === "999") throw new Error("Invoice not found");
  return { status: "found", amount: 250 };
}

async function fakeSendEmail(to: string, body: string): Promise<{ sent: boolean }> {
  await sleep(150);
  return { sent: true };
}

async function fakeSearchDatabase(query: string): Promise<string[]> {
  await sleep(3500); // intentionally slow — will trigger latency warning
  return ["result_1", "result_2", "result_3"];
}

async function main() {
  const session = trace.startSession({ name: "support-agent" });

  console.log(`\nStarting trace session...`);
  console.log(`Trace file: ${session.getFilePath()}\n`);

  // User sends a message
  await session.recordUserInput("Please find invoice #123 and notify the client.");

  // Step 1: Search invoice
  await session.recordStep({ description: "Searching invoice database" });

  const invoiceStart = Date.now();
  try {
    const result = await fakeSearchInvoice("123");
    await session.recordToolCall({
      name: "search_invoice",
      input: { invoiceId: "123" },
      output: result,
      durationMs: Date.now() - invoiceStart,
    });
  } catch (err) {
    await session.recordToolCall({
      name: "search_invoice",
      input: { invoiceId: "123" },
      durationMs: Date.now() - invoiceStart,
      error: { message: (err as Error).message, type: "NotFoundError" },
    });
  }

  // Step 2: Simulate LLM deciding next action
  await session.recordLlmCall({
    model: "gpt-4.1-mini",
    input: "Invoice #123 found. Amount: $250. Should I notify the client?",
    output: "Yes, send a notification email to the client.",
    promptTokens: 120,
    completionTokens: 18,
    costUsd: 0.0003,
    durationMs: 980,
  });

  // Step 3: Send email
  await session.recordStep({ description: "Sending client notification email" });

  const emailStart = Date.now();
  const emailResult = await fakeSendEmail("client@example.com", "Invoice #123 ready.");
  await session.recordToolCall({
    name: "send_email",
    input: { to: "client@example.com", subject: "Invoice #123" },
    output: emailResult,
    durationMs: Date.now() - emailStart,
  });

  // Step 4: Slow database search (triggers latency warning)
  await session.recordStep({ description: "Archiving request in database" });

  const dbStart = Date.now();
  const dbResult = await fakeSearchDatabase("invoice archive");
  await session.recordToolCall({
    name: "search_database",
    input: { query: "invoice archive" },
    output: dbResult,
    durationMs: Date.now() - dbStart,
  });

  // Step 5: Simulate a failed tool call
  const failStart = Date.now();
  await sleep(200);
  await session.recordToolCall({
    name: "send_sms",
    input: { phone: "+1234567890", message: "Invoice ready" },
    durationMs: Date.now() - failStart,
    error: { message: "SMS gateway timeout", type: "TimeoutError" },
  });

  // Step 6: Loop detection — same tool called 3 times in a row
  for (let i = 0; i < 3; i++) {
    const retryStart = Date.now();
    await sleep(100);
    await session.recordToolCall({
      name: "check_status",
      input: { attempt: i + 1 },
      output: { status: "pending" },
      durationMs: Date.now() - retryStart,
    });
  }

  // Final LLM call
  await session.recordLlmCall({
    model: "gpt-4.1-mini",
    input: "Summarize the result of the support request.",
    output: "Invoice #123 was found ($250). Client was notified via email. SMS failed.",
    promptTokens: 95,
    completionTokens: 28,
    costUsd: 0.0002,
    durationMs: 750,
  });

  await session.recordFinalOutput(
    "Invoice #123 processed. Client notified via email. SMS delivery failed."
  );

  await session.end();

  console.log("✓ Session complete.");
  console.log(`\nRun summary:\n  npx tsx src/cli/index.ts summary ${session.getFilePath()}`);
  console.log(`\nGenerate report:\n  npx tsx src/cli/index.ts report ${session.getFilePath()}\n`);
}

main().catch(console.error);
