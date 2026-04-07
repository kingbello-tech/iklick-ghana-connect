import { Zap, Shield, Globe, TrendingUp } from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "High-Speed Fiber & Wireless",
    description: "Enterprise-grade fiber-optic lines and reliable wireless connectivity delivered directly to homes and businesses for fast, dependable internet.",
  },
  {
    icon: Shield,
    title: "98.5% Service Reliability",
    description: "Redundant network architecture across fiber and wireless — with proactive monitoring to ensure consistent uptime you can depend on.",
  },
  {
    icon: Globe,
    title: "Expanding Coverage Across Ghana",
    description: "Aggressive network expansion into Accra, Tema, and beyond — using fiber and wireless to connect communities that were previously underserved.",
  },
  {
    icon: TrendingUp,
    title: "60% Cost Savings",
    description: "Competitive pricing with transparent plans — delivering superior speeds via fiber or wireless at significantly lower costs than competitors.",
  },
];

const SolutionSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Solution visuals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 order-2 lg:order-1">
            {solutions.map((solution, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 glow-card animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <solution.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{solution.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>
              </div>
            ))}
          </div>

          {/* Right: Story text */}
          <div className="space-y-6 order-1 lg:order-2 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Our Solution</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Fiber & Wireless Internet{" "}
              <span className="gradient-text">For Everyone</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              iKlick Communications delivers reliable, high-speed internet through fiber-optic and wireless solutions — to homes, businesses, and institutions — bridging Ghana's digital divide with infrastructure built for the future.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether through dedicated fiber lines or robust wireless links, we provide the connectivity backbone that families need to stay connected and enterprises need to compete globally.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
