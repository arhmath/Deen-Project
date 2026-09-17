import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { Hero } from "../components/landing/Hero";
import { LearningPath } from "../components/landing/LearningPath";
import { Features } from "../components/landing/Features";
import { Testimonials } from "../components/landing/Testimonials";
import { CtaBanner } from "../components/landing/CtaBanner";
import { LandingFooter } from "../components/landing/LandingFooter";

export default function LandingPage() {
  useEffect(() => {
    // Memaksa GSAP menghitung ulang posisi SETELAH browser selesai menggambar elemen
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-cream">
      <LandingNavbar />
      <main>
        <Hero />
        <LearningPath />
        <Features />
        <Testimonials />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}