import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background z-0" />

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="animate-fade-in-up">
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
