import { Cable, Network, Headphones, Settings, Wifi } from "lucide-react";

const capabilities = [
  {
    icon: Cable,
    title: "Fiber Network Design & Build",
    description: "Expert engineers design and deploy fiber-optic networks tailored to residential neighborhoods and enterprise campuses.",
  },
  {
    icon: Wifi,
    title: "Wireless Network Solutions",
    description: "High-performance wireless infrastructure for areas where fiber isn't yet available — delivering reliable speeds via point-to-point and point-to-multipoint links.",
  },
  {
    icon: Network,
    title: "Last-Mile Connectivity",
    description: "High-speed internet delivered directly to your doorstep — from FTTH for homes to dedicated fiber or wireless links for enterprises.",
  },
  {
    icon: Settings,
    title: "Managed Network Services",
    description: "Comprehensive monitoring, maintenance, and optimization of your fiber and wireless connections for maximum uptime and performance.",
  },
  {
    icon: Headphones,
    title: "24/7 Technical Support",
    description: "Dedicated account managers and round-the-clock NOC support ensuring your connection never lets you down.",
  },
];

const InfrastructureSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">How We Deliver</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Infrastructure That{" "}
            <span className="gradient-text">Scales</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete lifecycle management of your internet connectivity
          </p>
        </div>

        {/* Timeline-style cards */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {capabilities.map((cap, index) => (
              <div
                key={index}
                className="relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 glow-card animate-fade-in-up group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                  <cap.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfrastructureSection;
