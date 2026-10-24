import { createInterface } from "node:readline/promises";
import { getProvider } from "../src/ai/providers";
import type { ChatTurn } from "../src/ai/types";

const provider = getProvider();
console.log(`Provider: ${provider.name} (ketik "exit" untuk keluar)`);
if (provider.name === "local") console.warn("⚠ Masih provider local — cek AI_API_KEY / AI_PROVIDER.");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const history: ChatTurn[] = [];

while (true) {
  const msg = (await rl.question("\nKamu: ")).trim();
  if (!msg || msg === "exit") break;
  history.push({ role: "user", content: msg });
  try {
    const reply = await provider.generateReply({
      system: "Kamu asisten yang membantu. Jawab dalam Bahasa Indonesia.",
      messages: history,
      maxTokens: 700,
      timeoutMs: 30000,
      context: { domain: "DEEN_FEATURE", userMessage: msg, chunks: [], tools: [] },
    });
    history.push({ role: "assistant", content: reply });
    console.log(`\nGemini: ${reply || "(kosong)"}`);
  } catch (e) {
    console.error("Error:", e instanceof Error ? e.message : e);
  }
}
rl.close();