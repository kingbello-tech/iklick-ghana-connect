import { Target, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const pillars = [
  {
    icon: Eye,
    label: "Our Vision",
    title: "A Connected Ghana",
    description:
      "To deliver innovative, reliable, and affordable fiber-optic and wireless internet that empowers homes, businesses, and communities to thrive in a connected world — improving service quality and driving digital inclusion across Ghana.",
  },
  {
    icon: Target,
    label: "Our Mission",
    title: "Trusted, Customer-First Connectivity",
    description:
      "To be Ghana's most trusted Internet Service Provider, recognized for exceptional reliability, customer-first support, and our contribution to connecting every corner of the nation with world-class internet.",
  },
];

const AboutSection = () => {
  const [visible, setVisible] = useState<boolean[]>(() => pillars.map(() => false));
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
        { threshold: 0.3 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">About Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Built to Bridge Ghana's <span className="gradient-text">Digital Divide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            iKlick Communications Ltd was founded to address the critical need for reliable, affordable internet
            connectivity across Ghana. We bring enterprise-grade fiber and wireless solutions to homes, businesses, and
            institutions nationwide.
          </p>
        </div>

        {/* Storytelling timeline */}
        <div className="max-w-4xl mx-auto relative mb-16">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary/30 to-transparent sm:-translate-x-1/2" />

          <div className="space-y-16">
            {pillars.map((pillar, index) => {
              const isVisible = visible[index];
              const fromLeft = index % 2 === 0;
              return (
                <div
                  key={index}
                  ref={(el) => (refs.current[index] = el)}
                  className="relative"
                >
                  {/* Step dot on the line */}
                  <div
                    className={`absolute left-6 sm:left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 ring-4 ring-background z-10 transition-all duration-500 ${
                      isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />

                  <div
                    className={`flex flex-col sm:flex-row items-start gap-6 sm:gap-12 pl-16 sm:pl-0 transition-all duration-700 ease-out ${
                      isVisible
                        ? "opacity-100 translate-x-0"
                        : `opacity-0 ${fromLeft ? "-translate-x-10" : "translate-x-10"}`
                    } ${fromLeft ? "" : "sm:flex-row-reverse"}`}
                  >
                    {/* Content side */}
                    <div className={`flex-1 sm:w-1/2 ${fromLeft ? "sm:text-right sm:pr-4" : "sm:text-left sm:pl-4"}`}>
                      <div
                        className={`inline-flex items-center gap-2 mb-3 transition-all duration-700 delay-100 ${
                          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">
                          {pillar.label}
                        </span>
                      </div>
                      <h3
                        className={`text-2xl md:text-3xl font-bold mb-3 text-foreground transition-all duration-700 delay-200 ${
                          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                      >
                        {pillar.title}
                      </h3>
                      <p
                        className={`text-base text-muted-foreground leading-relaxed transition-all duration-700 delay-300 ${
                          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                      >
                        {pillar.description}
                      </p>
                    </div>

                    {/* Icon side */}
                    <div className="hidden sm:flex sm:w-1/2 items-center justify-center">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/10 transition-all duration-700 delay-200 ${
                          isVisible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12"
                        }`}
                      >
                        <pillar.icon className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in">
          <a href="mailto:sales@iklickgh.com">
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Partner With Us <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
