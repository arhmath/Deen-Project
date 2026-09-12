import { useState, type ReactNode } from "react";
import foto1 from "../assets/foto1.jpg";
import foto2 from "../assets/foto2.jpg";

const COLORS = {
  cream: "#FFFCF3",
  purple: "#8231F2", // primary
  purpleDark: "#4B1E96", // darker shade of primary, used for section contrast
  orange: "#FFAD00",
  gold: "#FFCC00",
  yellow: "#FFEA00",
  blue: "#009DFE",
  ink: "#1F1136",
} as const;

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Deen", href: "#tentang" },
  { label: "Alur Belajar", href: "#alur" },
  { label: "Fitur", href: "#fitur" },
];

interface FlowStep {
  number: string;
  title: string;
  description: string;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  { number: "01", title: "Daftar & buat profil", description: "Santri membuat akun, ustadz/ustadzah mendapat akses dashboard kelas.", color: COLORS.orange },
  { number: "02", title: "Pilih materi", description: "Santri memilih materi yang tersedia — tiap materi punya cara belajarnya sendiri.", color: COLORS.blue },
  { number: "03", title: "Belajar interaktif", description: "Materi disampaikan lewat cerita, kartu, skenario, atau misi bertahap, bukan ceramah satu arah.", color: COLORS.cream },
  { number: "04", title: "Kumpulkan poin & progres", description: "Setiap materi selesai, santri dapat poin dan progresnya otomatis tercatat.", color: COLORS.gold },
  { number: "05", title: "Terpantau ustadz", description: "Ustadz/ustadzah memantau perkembangan tiap santri langsung dari dashboard.", color: COLORS.orange },
];

type FeatureIconName = "mission" | "streak" | "board" | "badge";

interface Feature {
  icon: FeatureIconName;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: Feature[] = [
  { icon: "mission", title: "Misi belajar interaktif", description: "Materi disajikan lewat tantangan dan simulasi langkah demi langkah.", accent: COLORS.orange },
  { icon: "streak", title: "Daily check-in & streak", description: "Bangun kebiasaan belajar rutin lewat check-in harian dan bonus poin.", accent: COLORS.blue },
  { icon: "board", title: "Leaderboard kelas", description: "Pacu semangat berlomba dalam kebaikan antar santri secara sehat.", accent: COLORS.gold },
  { icon: "badge", title: "Badge & reward", description: "Dapatkan badge setiap kali menyelesaikan misi atau bab baru.", accent: COLORS.orange },
];

interface ImagePlaceholderProps {
  ratio?: string;
  label: string;
  rounded?: string;
}

/** Reusable placeholder — swap the background/content here with your own image. */
function ImagePlaceholder({ ratio = "1 / 1", label, rounded = "24px" }: ImagePlaceholderProps) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed"
      style={{
        aspectRatio: ratio,
        borderRadius: rounded,
        borderColor: `${COLORS.cream}4D`,
        background: `${COLORS.cream}14`,
        color: COLORS.cream,
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={COLORS.cream} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 16l-5.5-5.5L4 21" />
      </svg>
      <span className="text-xs font-medium text-center px-4 opacity-80">{label}</span>
    </div>
  );
}

interface FeatureIconProps {
  name: FeatureIconName;
  accent: string;
}

function FeatureIcon({ name, accent }: FeatureIconProps) {
  const isLight = accent === COLORS.cream || accent === COLORS.gold || accent === COLORS.yellow;
  const s = { width: 24, height: 24, fill: "none", stroke: isLight ? COLORS.ink : COLORS.cream, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes: Record<FeatureIconName, ReactNode> = {
    mission: (
      <svg viewBox="0 0 24 24" style={s}>
        <path d="M4 20l4-1 9-9-3-3-9 9-1 4Z" />
        <path d="M14 6l4 4" />
      </svg>
    ),
    streak: (
      <svg viewBox="0 0 24 24" style={s}>
        <path d="M12 2s5 5.5 5 10a5 5 0 0 1-10 0c0-1.7.8-3 1.7-4.2C9.4 9 12 7 12 2Z" />
      </svg>
    ),
    board: (
      <svg viewBox="0 0 24 24" style={s}>
        <path d="M5 21V10M12 21V4M19 21v-7" />
      </svg>
    ),
    badge: (
      <svg viewBox="0 0 24 24" style={s}>
        <circle cx="12" cy="9" r="5.5" />
        <path d="M9 13.5L7.5 21 12 18.5 16.5 21 15 13.5" />
      </svg>
    ),
  };
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: accent }}>
      {shapes[name]}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-semibold mb-3" style={{ color: COLORS.gold }}>
      {children}
    </p>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div style={{ fontFamily: "'Fredoka', sans-serif", background: COLORS.purple, color: COLORS.cream }} className="min-h-screen w-full overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50" style={{ background: `${COLORS.purpleDark}F0`, backdropFilter: "blur(6px)", borderBottom: `2px solid ${COLORS.cream}1A` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#beranda" className="text-2xl font-semibold" style={{ color: COLORS.cream }}>
            Deen<span style={{ color: COLORS.orange }}>.</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: COLORS.cream }}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="#masuk" className="text-sm font-semibold px-5 py-2.5 rounded-full border-2" style={{ borderColor: COLORS.cream, color: COLORS.cream }}>
              Masuk
            </a>
            <a href="#daftar" className="text-sm font-semibold px-5 py-2.5 rounded-full" style={{ background: COLORS.orange, color: COLORS.ink }}>
              Daftar gratis
            </a>
          </div>

          <button className="md:hidden p-2 rounded-lg" onClick={() => setMenuOpen((v) => !v)} aria-label="Buka menu navigasi" aria-expanded={menuOpen} type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.cream} strokeWidth="2.5" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-4" style={{ borderTop: `2px solid ${COLORS.cream}1A` }}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium pt-3" style={{ color: COLORS.cream }} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <a href="#masuk" className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-full border-2" style={{ borderColor: COLORS.cream, color: COLORS.cream }}>
                Masuk
              </a>
              <a href="#daftar" className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-full" style={{ background: COLORS.orange, color: COLORS.ink }}>
                Daftar gratis
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="beranda" className="px-6 pt-16 pb-24" style={{ background: COLORS.purpleDark }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-6" style={{ background: `${COLORS.cream}22`, color: COLORS.cream }}>
              Untuk santri &amp; ustadz/ustadzah TPA
            </span>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6">Bikin belajar di TPA jadi petualangan seru</h1>
            <p className="text-lg leading-relaxed mb-9" style={{ color: `${COLORS.cream}CC` }}>
              Deen adalah aplikasi belajar Islam berbasis gamifikasi untuk santri TPA. Ubah rasa bosan jadi semangat belajar, setiap hari.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <a href="#daftar" className="px-7 py-4 rounded-full font-semibold" style={{ background: COLORS.orange, color: COLORS.ink }}>
                Mulai petualangan
              </a>
              <a href="#masuk" className="px-7 py-4 rounded-full font-semibold border-2" style={{ borderColor: COLORS.cream, color: COLORS.cream }}>
                Masuk ke portal
              </a>
            </div>
          </div>

          {/* Hero image slot — drop your own illustration/photo here, portrait works best */}
          <div className="w-full max-w-sm mx-auto">
          <img src={foto1} alt="Deen" className="w-full h-full object-cover" style={{ aspectRatio: "4 / 5", borderRadius: "36px" }} />
          </div>
        </div>
      </section>

      {/* TENTANG & FILOSOFI */}
      <section id="tentang" className="px-6 py-24" style={{ background: COLORS.purple }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-2">
            <SectionLabel>Tentang Deen</SectionLabel>
            <h2 className="text-4xl font-semibold mb-6">Apa itu Deen, dan kenapa namanya Deen?</h2>
            <p className="leading-relaxed mb-5 " style={{ color: `${COLORS.cream}CC` }}>
              "Deen" dalam bahasa Arab berarti jauh lebih luas dari sekadar "agama" — ia mencakup keseluruhan cara hidup dan hubungan seseorang dengan Allah, sesama, dan dirinya sendiri. Kisah Nabi, sifat-sifat Allah, akhlak, dan fikih bukan topik yang terpisah, melainkan satu kesatuan yang saling terhubung.
            </p>
            <p className="leading-relaxed" style={{ color: `${COLORS.cream}CC` }}>
              Karena itu, Deen tidak menyeragamkan cara belajar untuk semua materi. Setiap dimensi keislaman dipelajari dengan caranya masing-masing — sama seperti Deen sendiri dipahami secara utuh, bukan sepotong-sepotong.
            </p>
          </div>

          {/* About-section image slot — square works well here */}
          <div className="order-1 md:order-1 w-full max-w-sm mx-auto">
          <img src={foto2} alt="Deen" className="w-full h-full object-cover" style={{ aspectRatio: "4 / 5", borderRadius: "36px" }} />
          </div>
        </div>
      </section>

      {/* ALUR APLIKASI */}
      <section id="alur" className="px-6 py-24" style={{ background: COLORS.purpleDark }}>
        <div className="max-w-3xl mx-auto">
          <SectionLabel>Alur belajar</SectionLabel>
          <h2 className="text-4xl font-semibold mb-14">Bagaimana santri belajar di Deen ?</h2>

          <div className="relative">
            <div className="absolute left-[27px] top-2 bottom-2 w-0.5" style={{ background: `${COLORS.cream}26` }} />
            <div className="space-y-10">
              {FLOW_STEPS.map((step) => (
                <div key={step.number} className="relative flex gap-6">
                  <div
                    className="relative z-10 w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-lg font-semibold"
                    style={{ background: step.color, color: COLORS.ink }}
                  >
                    {step.number}
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold mb-1.5">{step.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: `${COLORS.cream}B3` }}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="px-6 py-24" style={{ background: COLORS.purple }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <SectionLabel>Fitur</SectionLabel>
            <h2 className="text-4xl font-semibold">Fitur yang bikin santri semangat belajar</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-3xl p-7" style={{ background: `${COLORS.cream}14`, border: `2px solid ${COLORS.cream}26` }}>
                <FeatureIcon name={feature.icon} accent={feature.accent} />
                <p className="font-semibold mb-2 text-lg">{feature.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: `${COLORS.cream}B3` }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 pb-24" style={{ background: COLORS.purple }}>
        <div className="max-w-6xl mx-auto rounded-[40px] px-8 py-14 text-center" style={{ background: COLORS.purpleDark, border: `2px solid ${COLORS.cream}1A` }}>
          <h2 className="text-3xl font-semibold mb-4">Siap membuat santri jatuh cinta belajar Islam?</h2>
          <p className="mb-8 max-w-lg mx-auto" style={{ color: `${COLORS.cream}CC` }}>
            Daftarkan TPA kamu dan mulai pantau progres belajar santri hari ini juga.
          </p>
          <a href="#daftar" className="inline-block px-8 py-4 rounded-full font-semibold" style={{ background: COLORS.orange, color: COLORS.ink }}>
            Daftar gratis sekarang
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12" style={{ background: COLORS.purpleDark }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-sm">
            <p className="text-2xl font-semibold mb-3">
              Deen<span style={{ color: COLORS.orange }}>.</span>
            </p>
            <p className="text-sm" style={{ color: `${COLORS.cream}99` }}>
              Platform belajar Islam interaktif berbasis gamifikasi untuk santri TPA.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="opacity-80 hover:opacity-100">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t text-xs" style={{ borderColor: `${COLORS.cream}1F`, color: `${COLORS.cream}80` }}>
          © 2026 Deen. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}