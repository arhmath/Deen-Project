import type { Chunk, ScoredChunk } from "./types";

const STOPWORDS = new Set(
  ("a ada adalah agar akan aku anda apa apakah atau bagaimana bagi bahwa banyak beberapa bisa boleh buat cara dan dapat dari dengan di dong " +
    "dulu gimana hal ini itu jadi jelaskan juga kah kalau kami kamu kapan karena ke kenapa kita lagi lah lain mau mengapa merupakan " +
    "oleh pada para pun saja sama sampai sebuah sedang segera sih sudah supaya tentang tolong untuk ya yang yuk deen hari ini sekarang saat ketika " +
    "saya aku ku belum tidak tak siapa berapa bisa kok nih deh dong masih lagi ada " +
    "the is are of to in and a an what how why").split(" ")
);

const SUFFIXES = ["nya", "kan", "lah", "kah", "pun", "an", "i"];
const NORMALIZED_TERMS: Record<string, string> = {
  nambah: "tambah", bertambah: "tambah", menambah: "tambah", tambahan: "tambah",
  hilang: "hilang", kehilangan: "hilang",
};

export function stem(w: string): string {
  const normalized = NORMALIZED_TERMS[w] ?? w;
  for (const s of SUFFIXES) if (normalized.length > s.length + 3 && normalized.endsWith(s)) return normalized.slice(0, -s.length);
  return normalized;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map(stem);
}

/**
 * Pencarian leksikal berbobot IDF. Tiap istilah query yang cocok memberi "keyakinan" w = idf(t)/idfMax
 * (istilah langka/spesifik ≈ 1, istilah umum kecil; cocok di judul minimal 0.75, di isi ×0.85); skor chunk = 1 − Π(1 − w) ∈ [0,1]
 * (noisy-OR). Skor saja tidak cukup: untuk pertanyaan dengan beberapa istilah bermakna,
 * dokumen juga harus cocok dengan minimal dua istilah query. Ini mencegah satu kata seperti
 * "streak" menarik jawaban tentang streak ketika pertanyaan sebenarnya membahas hal lain.
 * Query satu istilah tetap diizinkan agar pencarian singkat seperti "streak" bisa bekerja.
 * Antarmuka sama dengan retriever vektor sehingga bisa diganti kelak tanpa mengubah orkestrator.
 */
export function search(query: string, corpus: Chunk[], topK: number, minScore: number): ScoredChunk[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length || !corpus.length) return [];

  const docs = corpus.map((c) => ({ chunk: c, body: new Set(tokenize(c.text)), title: new Set(tokenize(c.title)) }));
  const N = docs.length;
  const idfMax = Math.log((N + 1) / 1.5) + 1;
  const weight = new Map<string, number>();
  for (const t of q) {
    const df = docs.filter((d) => d.body.has(t) || d.title.has(t)).length;
    if (df > 0) weight.set(t, Math.min(1, (Math.log((N + 1) / (df + 0.5)) + 1) / idfMax));
  }
  if (!weight.size) return [];

  return docs
    .map(({ chunk, body, title }) => {
      let miss = 1;
      let matchedTerms = 0;
      for (const [t, w] of weight) {
        // judul = label topik terkurasi → keyakinan minimal 0.75 walau istilahnya umum ("xp", "room")
        if (title.has(t)) {
          matchedTerms++;
          miss *= 1 - Math.max(w, 0.75);
        } else if (body.has(t)) {
          matchedTerms++;
          miss *= 1 - w * 0.85;
        }
      }
      return { chunk, score: 1 - miss, matchedTerms };
    })
    // Query multi-istilah perlu kecocokan konteks, bukan hanya satu keyword yang kebetulan sama.
    .filter((r) => (q.length <= 1 || r.matchedTerms >= 2) && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, score }) => ({ chunk, score }));
}

/** Pecah teks panjang menjadi potongan ≤ maxLen berdasarkan paragraf/kalimat. */
export function chunkText(base: Omit<Chunk, "text">, text: string, maxLen = 700): Chunk[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];
  const parts = clean.split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/);
  const out: Chunk[] = [];
  let buf = "";
  for (const p of parts) {
    if ((buf + " " + p).length > maxLen && buf) {
      out.push({ ...base, id: `${base.id}#${out.length}`, text: buf.trim() });
      buf = p;
    } else buf = buf ? `${buf} ${p}` : p;
  }
  if (buf.trim()) out.push({ ...base, id: out.length ? `${base.id}#${out.length}` : base.id, text: buf.trim() });
  return out;
}
