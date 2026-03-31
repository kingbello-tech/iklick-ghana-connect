import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi, Globe, Shield, Star, Zap, Signal } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

        {/* Animated fiber grid with traveling light */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fiber-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="hsl(var(--primary))" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="hsl(var(--primary))" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="60" y2="30" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </pattern>
            {/* Horizontal traveling light */}
            <linearGradient id="h-light" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            {/* Vertical traveling light */}
            <linearGradient id="v-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              <stop offset="40%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
              <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#fiber-grid)" />
          {/* Horizontal light pulse 1 */}
          <rect y="90" width="200" height="1.5" fill="url(#h-light)" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" from="-200 0" to="2000 0" dur="6s" repeatCount="indefinite" />
          </rect>
          {/* Horizontal light pulse 2 */}
          <rect y="270" width="200" height="1.5" fill="url(#h-light)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" from="-200 0" to="2000 0" dur="8s" repeatCount="indefinite" />
          </rect>
          {/* Horizontal light pulse 3 */}
          <rect y="450" width="200" height="1.5" fill="url(#h-light)" opacity="0.6">
            <animateTransform attributeName="transform" type="translate" from="2000 0" to="-200 0" dur="7s" repeatCount="indefinite" />
          </rect>
          {/* Vertical light pulse 1 */}
          <rect x="150" width="1.5" height="200" fill="url(#v-light)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" from="0 -200" to="0 1200" dur="7s" repeatCount="indefinite" />
          </rect>
          {/* Vertical light pulse 2 */}
          <rect x="510" width="1.5" height="200" fill="url(#v-light)" opacity="0.6">
            <animateTransform attributeName="transform" type="translate" from="0 1200" to="0 -200" dur="9s" repeatCount="indefinite" />
          </rect>
          {/* Vertical light pulse 3 */}
          <rect x="870" width="1.5" height="200" fill="url(#v-light)" opacity="0.4">
            <animateTransform attributeName="transform" type="translate" from="0 -200" to="0 1200" dur="5s" repeatCount="indefinite" />
          </rect>
        </svg>

        {/* Decorative glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mx-auto lg:mx-0 animate-fade-in">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm font-medium text-primary">Trusted by 100+ Businesses in Ghana</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground animate-fade-in" style={{ animationDelay: '0.15s' }}>
              Reliable High-Speed{" "}
              <span className="gradient-text">Internet</span>{" "}
              for Ghana
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Seamless fiber connectivity for businesses and homes with 98.5% uptime guarantee. Powering Ghana's digital future.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.45s' }}>
              <a href="mailto:sales@iklickgh.com">
                <Button variant="hero" size="lg" className="text-base px-8 py-6">
                  Schedule a Consultation
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </a>
              <a href="tel:+233242548764">
                <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                  Call +233-242-548-764
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              {[
                { value: "98.5%", label: "Uptime" },
                { value: "100+", label: "Businesses" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual — ISP Network Illustration */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Central hub */}
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                  <Globe className="w-14 h-14 text-primary-foreground" />
                </div>
              </div>

              {/* Orbiting connection nodes */}
              {[
                { icon: Wifi, label: "Fiber", angle: 0, delay: '0.3s' },
                { icon: Shield, label: "Secure", angle: 60, delay: '0.45s' },
                { icon: Zap, label: "Fast", angle: 120, delay: '0.6s' },
                { icon: Signal, label: "Stable", angle: 180, delay: '0.75s' },
                { icon: Globe, label: "Global", angle: 240, delay: '0.9s' },
                { icon: Wifi, label: "5G Ready", angle: 300, delay: '1.05s' },
              ].map((node, i) => {
                const radius = 180;
                const rad = (node.angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                return (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 animate-fade-in"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      animationDelay: node.delay,
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-xl bg-card border border-border shadow-md flex items-center justify-center backdrop-blur-sm animate-pulse" style={{ animationDelay: node.delay }}>
                        <node.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{node.label}</span>
                    </div>
                  </div>
                );
              })}

              {/* Connection lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = 200 + Math.cos(rad) * 180;
                  const y = 200 + Math.sin(rad) * 180;
                  return (
                    <line
                      key={i}
                      x1="200" y1="200"
                      x2={x} y2={y}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="6 4"
                      opacity="0.3"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
