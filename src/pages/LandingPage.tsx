import { LandingNavbar } from "../components/landing/LandingNavbar";
import { Hero } from "../components/landing/Hero";
import { LearningPath } from "../components/landing/LearningPath";
import { Features } from "../components/landing/Features";
import { Testimonials } from "../components/landing/Testimonials";
import { CtaBanner } from "../components/landing/CtaBanner";
import { LandingFooter } from "../components/landing/LandingFooter";
import { ScrollAnimation } from "../components/ui/ScrollAnimation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <LandingNavbar />
      <main>
        <Hero />

        <ScrollAnimation direction="up" delay={0.4}>
        <LearningPath />
        </ScrollAnimation>

        <ScrollAnimation direction="right" delay={0.4}>
        <Features />
        </ScrollAnimation>

        <ScrollAnimation direction ="left" delay={0.4}>
        <Testimonials />
        </ScrollAnimation>

        <ScrollAnimation direction="up" delay={0.4}>
        <CtaBanner />
        </ScrollAnimation>

      </main>
      <LandingFooter />
    </div>
  );
}
