import { Zap, Shield, Globe, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [visible, setVisible] = useState<boolean[]>(() => solutions.map(() => false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    refs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[i]) return prev;
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 animate-fade-in">
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
        </div>

        {/* Individual animated points */}
        <div className="max-w-4xl mx-auto space-y-10">
          {solutions.map((solution, index) => {
            const isVisible = visible[index];
            const fromLeft = index % 2 === 0;
            return (
              <div
                key={index}
                ref={(el) => (refs.current[index] = el)}
                className={`flex flex-col sm:flex-row items-start gap-6 transition-all duration-700 ease-out ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : `opacity-0 ${fromLeft ? "-translate-x-10" : "translate-x-10"}`
                } ${fromLeft ? "" : "sm:flex-row-reverse sm:text-right"}`}
              >
                <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <solution.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-2xl font-bold mb-2 text-foreground transition-all duration-700 delay-150 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                  >
                    {solution.title}
                  </h3>
                  <p
                    className={`text-base text-muted-foreground leading-relaxed transition-all duration-700 delay-300 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                  >
                    {solution.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
