import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
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

      if (progress >= 0.85 && onAnimationComplete) {
        onAnimationComplete();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onAnimationComplete]);

  return (
    <section id="hero-section" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#f0f4f8]">
      {/* 3D Scene */}
      <MetropolisScene scrollProgress={scrollProgress} />

      {/* Logo overlay - clean, centered at top */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 transition-opacity duration-500"
        style={{ opacity: scrollProgress > 0.5 ? 0 : 1 }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)] flex items-center justify-center shadow-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-[hsl(220,20%,25%)] tracking-tight">
          i<span className="bg-gradient-to-r from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)] bg-clip-text text-transparent">Klick</span>
        </span>
      </div>

      {/* Scroll Instruction */}
      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500 z-10"
        style={{ opacity: scrollProgress > 0.3 ? 0 : 1 }}
      >
        <p className="text-sm text-[hsl(220,15%,50%)] mb-2 animate-bounce">Scroll to explore</p>
        <div className="w-6 h-10 border-2 border-[hsl(195,100%,55%)]/50 rounded-full flex items-start justify-center p-2 mx-auto">
          <div className="w-1.5 h-3 bg-[hsl(195,100%,55%)] rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
