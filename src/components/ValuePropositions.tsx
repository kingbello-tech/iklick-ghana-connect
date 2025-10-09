import { Shield, Headphones, TrendingUp, Network, Lock, Gauge } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Reliable Service",
    description: "98.5% service availability with rapid response teams to minimize downtime"
  },
  {
    icon: Headphones,
    title: "24/7 Network Support",
    description: "Dedicated account management and round-the-clock technical support"
  },
  {
    icon: TrendingUp,
    title: "High Service Availability",
    description: "Industry-leading uptime ensuring your business stays connected"
  },
  {
    icon: Network,
    title: "Resilient Network",
    description: "Robust backhaul & metro connectivity with redundant fiber coverage across Ghana"
  },
  {
    icon: Lock,
    title: "Highly Secure Network",
    description: "Enterprise-grade security protocols protecting your data and connectivity"
  },
  {
    icon: Gauge,
    title: "Superior Performance",
    description: "Up to 70% faster speeds with 60% cost savings compared to competitors"
  }
];

const ValuePropositions = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">iKlick Communications</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamless performance and support to keep you connected and ahead
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 glow-card animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositions;
