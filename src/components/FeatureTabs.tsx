import { useState } from "react";
import { Building2, Home, Phone, Shield, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  {
    id: "enterprise",
    label: "Enterprise",
    icon: Building2,
    title: "Enterprise Fiber Solutions",
    description: "Dedicated high-speed connectivity designed for large organizations with mission-critical needs.",
    features: [
      "Dedicated fiber lines up to 1Gbps",
      "99.9% SLA-backed uptime guarantee",
      "24/7 Network Operations Center (NOC)",
      "Dedicated Technical Account Manager",
      "Custom bandwidth scaling",
      "Priority fault resolution",
    ],
    stat: { value: "99.9%", label: "Uptime SLA" },
  },
  {
    id: "residential",
    label: "Residential",
    icon: Home,
    title: "Home & SME Broadband",
    description: "Reliable fiber broadband for homes and small businesses at competitive prices.",
    features: [
      "Speeds from 10Mbps to 50Mbps",
      "Unlimited data on all plans",
      "Free router with installation",
      "Same-day support response",
      "No hidden fees or contracts",
      "Coverage in Accra & Tema",
    ],
    stat: { value: "50Mbps", label: "Max Speed" },
  },
  {
    id: "voip",
    label: "VoIP",
    icon: Phone,
    title: "Voice over IP Solutions",
    description: "Crystal-clear business communication with our managed VoIP services.",
    features: [
      "HD voice quality",
      "Multi-line support",
      "Virtual receptionist",
      "Call recording & analytics",
      "Integration with existing PBX",
      "Competitive international rates",
    ],
    stat: { value: "60%", label: "Cost Savings" },
  },
  {
    id: "managed",
    label: "Managed IT",
    icon: Shield,
    title: "Managed IT Services",
    description: "End-to-end IT management so you can focus on growing your business.",
    features: [
      "Network monitoring & management",
      "Cybersecurity protection",
      "Cloud migration support",
      "IT helpdesk & support",
      "Infrastructure planning",
      "Disaster recovery",
    ],
    stat: { value: "24/7", label: "Monitoring" },
  },
];

const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState("enterprise");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            One Platform for{" "}
            <span className="gradient-text">All Connectivity</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to stay connected, managed from a single provider
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="max-w-5xl mx-auto">
          <div
            key={active.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in"
          >
            {/* Left: Info */}
            <div>
              <h3 className="text-3xl font-bold mb-4">{active.title}</h3>
              <p className="text-muted-foreground mb-8 text-lg">{active.description}</p>
              <ul className="space-y-3 mb-8">
                {active.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="hero" size="lg">
                Learn More <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Right: Visual Card */}
            <div className="relative">
              <div className="rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-center py-12">
                  <div className="text-7xl font-bold gradient-text mb-2">
                    {active.stat.value}
                  </div>
                  <div className="text-xl text-muted-foreground">
                    {active.stat.label}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-2 rounded-full bg-primary/20">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${60 + i * 12}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureTabs;
