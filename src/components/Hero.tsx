import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import MetropolisScene from "./MetropolisScene";

interface HeroProps {
  onAnimationComplete?: () => void;
}

const clientStats = [
  { name: "National Geographic", stat: "99.9% Uptime" },
  { name: "Netflix", stat: "Connected Since 2021" },
  { name: "TED", stat: "50Mbps Dedicated" },
  { name: "ESPN", stat: "Zero Downtime" },
  { name: "UNESCO", stat: "Enterprise Grade" },
  { name: "Disney Kids", stat: "24/7 Support" },
];

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

  const contentOpacity = Math.max(0, 1 - scrollProgress * 3);

  return (
    <section id="hero-section" className="relative h-screen flex items-center justify-center overflow-hidden">
      <MetropolisScene scrollProgress={scrollProgress} />

      {/* Content Overlay */}
      <div 
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
        style={{ opacity: contentOpacity, pointerEvents: contentOpacity < 0.1 ? 'none' : 'auto' }}
      >
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/50">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm text-foreground/80 font-medium">Trusted by 100+ Businesses in Ghana</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight">
          Reliable High-Speed{" "}
          <span className="gradient-text">Internet for Ghana</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
          Seamless fiber connectivity for businesses and homes with 98.5% uptime guarantee
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Button variant="hero" size="lg" className="text-base px-8 py-6">
            Get Connected
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
            View Plans
          </Button>
        </div>

        {/* Scrolling Client Stats */}
        <div className="w-full max-w-3xl overflow-hidden">
          <div className="flex animate-scroll gap-6">
            {[...clientStats, ...clientStats].map((client, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-full bg-card/30 backdrop-blur-sm border border-border/30"
              >
                <Wifi className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">{client.name}</p>
                  <p className="text-sm font-semibold text-foreground">{client.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Instruction */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-10"
        style={{ opacity: scrollProgress > 0.15 ? 0 : contentOpacity * 0.7 }}
      >
        <p className="text-xs text-foreground/50 mb-2 animate-bounce">Scroll to explore</p>
        <div className="w-5 h-8 border-2 border-primary/40 rounded-full flex items-start justify-center p-1.5 mx-auto">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
