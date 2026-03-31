import { Check, Infinity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    speed: "10Mbps",
    price: "400",
    description: "Perfect for homes and small offices",
    features: [
      "Unlimited data",
      "24/7 support",
      "Free router",
      "Accra & Tema coverage",
    ],
  },
  {
    name: "Business",
    speed: "30Mbps",
    price: "1,000",
    description: "For growing businesses that need more speed",
    features: [
      "Unlimited data",
      "Priority support",
      "Free router & installation",
      "Dedicated account manager",
      "99.5% SLA uptime",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    speed: "50Mbps+",
    price: "1,600",
    description: "Mission-critical connectivity for enterprises",
    features: [
      "Unlimited data",
      "24/7 NOC monitoring",
      "Custom SLA",
      "Dedicated fiber line",
      "Technical account manager",
      "Multi-site support",
    ],
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Infinity className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">All Plans Include Unlimited Data</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. Setup costs determined after survey. Accra & Tema only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-card/80 border-primary glow-card scale-105"
                  : "bg-card/40 border-border/50 hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-2">
                <span className="text-5xl font-bold gradient-text">{plan.speed}</span>
              </div>
              <div className="mb-8">
                <span className="text-2xl font-bold text-foreground">GH₵ {plan.price}</span>
                <span className="text-muted-foreground"> / month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "hero-outline"}
                className="w-full"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Need custom bandwidth? <a href="#contact" className="text-primary hover:underline">Contact us</a> for a tailored solution.</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
