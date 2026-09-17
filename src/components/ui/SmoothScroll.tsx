import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const smootherRef = useRef<ScrollSmoother | null>(null);
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Inisialisasi ScrollSmoother setelah DOM stabil sepenuhnya
    const timer = setTimeout(() => {
      smootherRef.current = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: prefersReducedMotion ? 0 : 1.2,
        effects: !prefersReducedMotion,
      });

      ScrollTrigger.refresh();
    }, 50);

    return () => {
      clearTimeout(timer);
      smootherRef.current?.kill();
      smootherRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (smootherRef.current) {
      smootherRef.current.scrollTo(0, false);
      ScrollTrigger.refresh();
    }
  }, [location.pathname]);

  return (
    <div id="smooth-wrapper" className="overflow-hidden">
      <div id="smooth-content">{children}</div>
    </div>
  );
}