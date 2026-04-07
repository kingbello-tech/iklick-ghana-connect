import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        {/* Subtle animated grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="80" stroke="hsl(var(--primary))" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="80" y2="0" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="hero-pulse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
          <rect y="200" width="300" height="1" fill="url(#hero-pulse)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" from="-300 0" to="2000 0" dur="8s" repeatCount="indefinite" />
          </rect>
          <rect y="400" width="300" height="1" fill="url(#hero-pulse)" opacity="0.3">
            <animateTransform attributeName="transform" type="translate" from="2000 0" to="-300 0" dur="10s" repeatCount="indefinite" />
          </rect>
        </svg>
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Company badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <span className="text-sm font-semibold tracking-wider uppercase text-primary">iKlick Communications Ltd</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-foreground animate-fade-in" style={{ animationDelay: '0.15s' }}>
            Connecting Ghana's homes & enterprises through{" "}
            <span className="gradient-text">fiber-optic innovation</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            We're a leading Internet Service Provider delivering reliable, high-speed fiber connectivity to households, businesses, and institutions across Ghana — powering the nation's digital future.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <a href="mailto:sales@iklickgh.com">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Get Connected
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#about">
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                Learn Our Story
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-8 pt-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { value: "98.5%", label: "Service Uptime" },
              { value: "100+", label: "Businesses Served" },
              { value: "24/7", label: "NOC Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
