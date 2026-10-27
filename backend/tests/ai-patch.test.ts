import { beforeEach, describe, expect, it, vi } from "vitest";

/* ---------- unit: intent / guard / retriever ---------- */
import { forcedKnowledge, isAboutDeen, isHowTo, routeIntent } from "@/ai/intent";
import { classifyDomain } from "@/ai/guards";
import { search } from "@/ai/retriever";
import { DEEN_KNOWLEDGE } from "@/ai/knowledge";
import { humanize } from "@/ai/providers";
import { toolSource } from "@/ai/orchestrator";

describe("router: pertanyaan prosedur ≠ data pribadi", () => {
  it("how-to tidak memanggil tool (orang tua)", () => {
    expect(routeIntent("Bagaimana orang tua melihat progress anak?", "PARENT").tools).toEqual([]);
    expect(routeIntent("Bagaimana cara menghubungkan akun anak saya?", "PARENT").tools).toEqual([]);
  });
  it("permintaan nilai konkret tetap memanggil tool", () => {
    expect(routeIntent("Bagaimana progress anak saya?", "PARENT").tools).toContain("get_child_progress");
    expect(routeIntent("Gimana perkembangan Ahmad?", "PARENT", ["Ahmad"]).tools).toContain("get_child_gamification");
    expect(routeIntent("Berapa XP saya?", "SANTRI").tools).toEqual(["get_my_gamification"]);
  });
  it("'cara cek XP saya' = prosedur → RAG saja", () => {
    expect(isHowTo("Cara cek XP saya?")).toBe(true);
    expect(routeIntent("Cara cek XP saya?", "SANTRI").tools).toEqual([]);
  });
  it("'berapa ... sekarang' bukan how-to", () => expect(isHowTo("Berapa XP saya sekarang, caranya?")).toBe(false));
});

describe("intent 'tentang Deen' & Maps", () => {
  it("'Apa itu Deen?' memaksa kb-about; 'Apa itu XP di Deen?' tidak", () => {
    expect(isAboutDeen("Apa itu Deen?")).toBe(true);
    expect(isAboutDeen("Deen itu apa sih")).toBe(true);
    expect(isAboutDeen("Apa itu XP di Deen?")).toBe(false);
    expect(forcedKnowledge("Apa itu Deen?", "DEEN_FEATURE")).toEqual(["kb-about"]);
  });
  it("pencarian lokasi → MAPS (jujur: belum tersedia)", () => {
    expect(classifyDomain("Cari room Student Center terdekat")).toBe("MAPS");
    expect(classifyDomain("masjid terdekat dari rumah")).toBe("MAPS");
    expect(forcedKnowledge("masjid terdekat", "MAPS")).toEqual(["kb-maps"]);
  });
  it("restoran terdekat tetap di luar domain", () => expect(classifyDomain("restoran terdekat dari sini")).toBe("UNRELATED"));
  it("pertanyaan hukum → RELIGIOUS_KNOWLEDGE (bukan 'di luar cakupan')", () => expect(classifyDomain("Apa hukum riba?")).toBe("RELIGIOUS_KNOWLEDGE"));
});

describe("retriever: stopword percakapan tidak menimbulkan hit palsu", () => {
  it("'Kenapa XP saya belum nambah?' tidak menarik kb-maps", () => {
    const ids = search("Kenapa XP saya belum nambah?", DEEN_KNOWLEDGE, 5, 0.7).map((h) => h.chunk.id);
    expect(ids).toContain("kb-xp-point");
    expect(ids).not.toContain("kb-maps");
  });
  it("satu keyword tidak cukup untuk pertanyaan multi-istilah yang konteksnya berbeda", () => {
    const hits = search("Bagaimana mengatasi streak hilang karena sakit?", DEEN_KNOWLEDGE, 5, 0.7);
    expect(hits.some((h) => /streak/i.test(h.chunk.title + " " + h.chunk.text))).toBe(false);
  });
  it("query singkat satu istilah tetap bisa menemukan topik terkait", () => {
    const hits = search("streak", DEEN_KNOWLEDGE, 5, 0.7);
    expect(hits.some((h) => /streak/i.test(h.chunk.title + " " + h.chunk.text))).toBe(true);
  });
});

describe("sumber & format", () => {
  it("label sumber tidak membuka nama tool internal", () => {
    for (const [name, type] of [["get_my_progress", "progress"], ["get_child_quiz_results", "progress"], ["get_room_statistics", "progress"], ["get_my_profile", "profile"]] as const) {
      const s = toolSource(name, type);
      expect(JSON.stringify(s)).not.toMatch(/get_/);
    }
    expect(toolSource("get_child_progress", "progress").title).toBe("Data belajar anak");
  });
  it("humanize mengubah JSON tool menjadi teks", () => {
    const t = humanize({ xp: 240, sudahCheckInHariIni: false, streak: 3 });
    expect(t).toContain("xp: 240");
    expect(t).toContain("sudah check in hari ini: belum");
    expect(t).not.toContain("{");
  });
});

/* ---------- alur chat: "Apa itu Deen?" & Maps ---------- */
const saved: { content: string; metadata: Record<string, unknown> }[] = [];
vi.mock("@/ai/conversation", () => ({
  getOwnedConversation: vi.fn(),
  recentMessages: vi.fn(async () => []),
  saveExchange: vi.fn(async (x: { assistantContent: string; metadata: Record<string, unknown> }) => {
    saved.push({ content: x.assistantContent, metadata: x.metadata });
    return { conversationId: "c1", assistantMessageId: "m1", createdAt: "2026-10-20T00:00:00.000Z" };
  }),
}));
vi.mock("@/ai/course-knowledge", () => ({ loadCourseChunks: vi.fn(async () => []), loadCuratedChunks: vi.fn(async () => []) }));
vi.mock("@/modules/parent/parent.service", () => ({ parentService: { students: vi.fn(async () => []) } }));
vi.mock("@/ai/tools", () => ({ runTool: vi.fn(async () => ({ ok: true, source: "progress", data: { xp: 240 } })) }));
import { handleChat } from "@/ai/orchestrator";
const santri = { id: "s1", role: "SANTRI" as const };
beforeEach(() => { saved.length = 0; });

describe("handleChat setelah patch", () => {
  it("'Apa itu Deen?' dijawab dari kb-about (grounded)", async () => {
    const r = await handleChat(santri, { message: "Apa itu Deen?" });
    expect(r.grounded).toBe(true);
    expect(r.sources.map((s) => s.id)).toContain("kb-about");
    expect(r.content).toMatch(/gamifikasi/i);
  });
  it("pencarian lokasi → jawab jujur Maps belum tersedia, bukan info join room", async () => {
    const r = await handleChat(santri, { message: "Cari room Student Center terdekat", latitude: -7.7956, longitude: 110.3695 });
    expect(r.domain).toBe("MAPS");
    expect(r.content).toMatch(/belum tersedia/i);
  });
  it("sumber tool tidak membocorkan nama tool", async () => {
    const r = await handleChat(santri, { message: "Berapa XP saya sekarang?" });
    expect(r.sources.some((s) => /get_/.test(s.id) || /get_/.test(s.title))).toBe(false);
    expect(r.sources.some((s) => s.id === "data:progress")).toBe(true);
  });
});
