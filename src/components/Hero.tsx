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

      {/* Frosted Glass Content */}
      <div 
        className="container mx-auto px-4 z-10 text-center transition-all duration-700"
        style={{ 
          opacity: 1 - scrollProgress * 1.5,
          transform: `scale(${1 - scrollProgress * 0.2})`
        }}
      >
        <div className="animate-fade-in-up backdrop-blur-2xl bg-background/10 border border-primary/30 rounded-3xl p-8 md:p-12 max-w-5xl mx-auto shadow-2xl">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Trusted by Leading Businesses in Ghana</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Get <span className="gradient-text">High-Speed Internet</span>
            <br />
            That Powers Your Success
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Reliable, resilient, and high-performance connectivity with 24/7 support. 
            Experience seamless internet built for Ghana's digital future.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="hero" size="lg" className="group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="hero-outline" size="lg">
              View Plans & Pricing
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-primary/10">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">98.5%</div>
              <div className="text-sm text-muted-foreground">Service Availability</div>
            </div>
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-primary/10">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Network Support</div>
            </div>
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-primary/10">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">70%</div>
              <div className="text-sm text-muted-foreground">Faster Speed</div>
            </div>
            <div className="p-6 rounded-lg bg-card/30 backdrop-blur-sm border border-primary/10">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">60%</div>
              <div className="text-sm text-muted-foreground">Cost Savings</div>
          </div>
        </div>

        {/* Scroll Instruction */}
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500"
          style={{ opacity: scrollProgress > 0.3 ? 0 : 1 }}
        >
          <p className="text-sm text-foreground/60 mb-2 animate-bounce">Scroll to explore</p>
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2 mx-auto">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default Hero;
