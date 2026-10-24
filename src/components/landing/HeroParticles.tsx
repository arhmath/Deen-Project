import { useEffect, useRef } from "react";

/**
 * Partikel latar Hero: huruf hijaiyah, bintang, dan titik berwarna yang melayang pelan
 * ke atas. Saat kursor mendekat, partikel menghindar lalu kembali ke jalurnya.
 *
 * - Ringan: satu <canvas>, jumlah partikel mengikuti luas section (maks. MAX_PARTICLES).
 * - Berhenti otomatis saat section tidak terlihat atau tab di-background.
 * - Hormati `prefers-reduced-motion`: hanya digambar statis, tanpa animasi.
 * - Warna menyesuaikan mode light/dark (class `.dark` di <html>).
 */

const LETTERS = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ر", "س", "ش", "ع", "ف", "ق", "ك", "م", "ن", "ه", "و", "ي"];
const COLORS_LIGHT = ["#8231f2", "#009dfe", "#ffad00", "#ffcc00"];
const COLORS_DARK = ["#b78cff", "#4cb8ff", "#ffad00", "#ffcc00"];

const MAX_PARTICLES = 42;
const AREA_PER_PARTICLE = 26000; // px² per partikel
const REPEL_RADIUS = 130;

type Kind = "letter" | "star" | "dot";

interface Particle {
  x: number;
  y: number;
  ox: number; // pergeseran akibat kursor
  oy: number;
  speed: number;
  sway: number;
  phase: number;
  size: number;
  rot: number;
  vr: number;
  kind: Kind;
  char: string;
  colorIdx: number;
  alpha: number;
}

function makeParticle(w: number, h: number, anywhere: boolean): Particle {
  const r = Math.random();
  const kind: Kind = r < 0.5 ? "letter" : r < 0.78 ? "star" : "dot";
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 30,
    ox: 0,
    oy: 0,
    speed: 8 + Math.random() * 16, // px/detik
    sway: 0.4 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
    size: kind === "letter" ? 26 + Math.random() * 30 : kind === "star" ? 8 + Math.random() * 10 : 3 + Math.random() * 4,
    rot: (Math.random() - 0.5) * 0.8,
    vr: (Math.random() - 0.5) * 0.25,
    kind,
    char: LETTERS[Math.floor(Math.random() * LETTERS.length)]!,
    colorIdx: Math.floor(Math.random() * 4),
    alpha: kind === "letter" ? 0.1 + Math.random() * 0.1 : 0.35 + Math.random() * 0.4,
  };
}

function drawSparkle(ctx: CanvasRenderingContext2D, s: number) {
  // bintang 4 sudut dengan sisi melengkung
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.fill();
}

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const particles: Particle[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = host!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      const target = Math.min(MAX_PARTICLES, Math.max(10, Math.round((w * h) / AREA_PER_PARTICLE)));
      if (particles.length > target) particles.length = target;
      while (particles.length < target) particles.push(makeParticle(w, h, true));
      if (reduceMotion) render(0);
    }

    function render(t: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      const colors = document.documentElement.classList.contains("dark") ? COLORS_DARK : COLORS_LIGHT;
      const fade = h * 0.14;

      for (const p of particles) {
        const px = p.x + Math.sin(t * p.sway + p.phase) * 14 + p.ox;
        const py = p.y + p.oy;

        // fade di tepi atas & bawah supaya muncul/hilang halus
        const edge = Math.min(py, h - py);
        const edgeAlpha = Math.max(0, Math.min(1, edge / fade));
        ctx!.globalAlpha = p.alpha * edgeAlpha;
        ctx!.fillStyle = colors[p.colorIdx]!;

        ctx!.save();
        ctx!.translate(px, py);
        ctx!.rotate(p.rot);
        if (p.kind === "letter") {
          ctx!.font = `700 ${p.size}px "Noto Naskh Arabic", "Baloo 2", serif`;
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          ctx!.fillText(p.char, 0, 0);
        } else if (p.kind === "star") {
          drawSparkle(ctx!, p.size);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }
      ctx!.globalAlpha = 1;
    }

    function step(now: number) {
      raf = requestAnimationFrame(step);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        p.y -= p.speed * dt;
        p.rot += p.vr * dt;

        // menghindar dari kursor, lalu pelan-pelan kembali
        const dx = p.x + p.ox - mouse.x;
        const dy = p.y + p.oy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_RADIUS && d > 0.01) {
          const force = (1 - d / REPEL_RADIUS) * 90 * dt * 10;
          p.ox += (dx / d) * force * 0.12;
          p.oy += (dy / d) * force * 0.12;
        }
        p.ox *= 0.96;
        p.oy *= 0.96;

        if (p.y < -40) particles[i] = makeParticle(w, h, false);
      }
      render(now / 1000);
    }

    function onMove(e: MouseEvent) {
      const rect = host!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.x = mouse.y = -9999;
    }
    function onVisibility() {
      last = performance.now();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let io: IntersectionObserver | undefined;
    if (!reduceMotion) {
      io = new IntersectionObserver(([entry]) => {
        visible = !!entry?.isIntersecting;
        last = performance.now();
      });
      io.observe(host);
      window.addEventListener("mousemove", onMove, { passive: true });
      host.addEventListener("mouseleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(step);
    }

    // pastikan font Arab sudah termuat sebelum frame pertama digambar ulang
    document.fonts?.load('700 32px "Noto Naskh Arabic"', "ابت").then(() => {
      if (reduceMotion) render(0);
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" />;
}
