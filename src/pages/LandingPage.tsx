import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SmoothScroll } from "../components/ui/SmoothScroll";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { Hero } from "../components/landing/Hero";
import { LearningPath } from "../components/landing/LearningPath";
import { Features } from "../components/landing/Features";
import { Testimonials } from "../components/landing/Testimonials";
import { CtaBanner } from "../components/landing/CtaBanner";
import { LandingFooter } from "../components/landing/LandingFooter";
import { ZiyaChatWidget } from "../components/landing/ZiyaChatWidget";

export function LandingPage() {
  useEffect(() => {
    // Memaksa GSAP menghitung ulang posisi SETELAH browser selesai menggambar elemen
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Navbar fixed di LUAR SmoothScroll: elemen fixed/sticky tidak jalan di dalam konten ber-transform. */}
      <LandingNavbar />
      <ZiyaChatWidget />
      <SmoothScroll>
        {/* Ruang di bawah navbar fixed — tingginya diukur & dipublikasikan oleh LandingNavbar. */}
        <div aria-hidden="true" style={{ height: "var(--landing-nav-h, 4.5rem)" }} />
        <main>
          <Hero />
          <LearningPath />
          <Features />
          <Testimonials />
          <CtaBanner />
        </main>
        <LandingFooter />
      </SmoothScroll>
    </div>
  );
}

export default LandingPage;