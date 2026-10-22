/**
 * Tata letak jalur petualangan (fungsi murni, mudah diuji).
 * Sistem koordinat logis lebar 360; seluruh peta diskalakan seragam lewat CSS.
 */
export const MAP_WIDTH = 360;
const CENTER = MAP_WIDTH / 2;
const AMPLITUDE = 96;
const STEP = 1.15; // radian per node → jalur berkelok halus
const GAP = 108;
const PAD_TOP = 64;
const PAD_BOTTOM = 72;

export interface Point {
  x: number;
  y: number;
}

/** Posisi n node materi + 1 node hadiah di ujung. */
export function layoutRegion(nodeCount: number): { points: Point[]; height: number } {
  const total = nodeCount + 1;
  const points = Array.from({ length: total }, (_, i) => ({
    x: Math.round((CENTER + AMPLITUDE * Math.sin(i * STEP)) * 10) / 10,
    y: PAD_TOP + i * GAP,
  }));
  return { points, height: PAD_TOP + (total - 1) * GAP + PAD_BOTTOM };
}

/** Kurva halus melewati titik 0..upTo (inklusif). */
export function pathUpTo(points: Point[], upTo: number): string {
  const last = Math.min(upTo, points.length - 1);
  if (last < 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i <= last; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const mid = (a.y + b.y) / 2;
    d += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
  }
  return d;
}

/** Label ditaruh di sisi yang punya ruang lebih. */
export const labelSide = (x: number): "left" | "right" => (x <= CENTER ? "right" : "left");
