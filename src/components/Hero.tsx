import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import MetropolisScene from "./MetropolisScene";

interface HeroProps {
  onAnimationComplete?: () => void;
}

const Hero = ({ onAnimationComplete }: HeroProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-section');
      if (!heroSection) return;
      
      const heroHeight = heroSection.offsetHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / heroHeight, 1);
      setScrollProgress(progress);

      // Trigger animation complete when zoom is almost done
      if (progress >= 0.85 && onAnimationComplete) {
        onAnimationComplete();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onAnimationComplete]);

  return (
    <section id="hero-section" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Metropolis Background */}
      <MetropolisScene scrollProgress={scrollProgress} />

      {/* Scroll Instruction */}
      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500 z-10"
        style={{ opacity: scrollProgress > 0.3 ? 0 : 1 }}
      >
        <p className="text-sm text-foreground/60 mb-2 animate-bounce">Scroll to explore</p>
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2 mx-auto">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
