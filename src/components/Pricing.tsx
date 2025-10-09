import { Check, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    speed: "10Mbps",
    price: "400",
    features: [
      "Unlimited data",
      "24/7 support",
      "30-day duration",
      "Accra & Tema coverage"
    ]
  },
  {
    name: "Business",
    speed: "20Mbps",
    price: "700",
    features: [
      "Unlimited data",
      "Priority support",
      "30-day duration",
      "Accra & Tema coverage"
    ],
    popular: true
  },
  {
    name: "Professional",
    speed: "30Mbps",
    price: "1,000",
    features: [
      "Unlimited data",
      "Premium support",
      "30-day duration",
      "Accra & Tema coverage"
    ]
  },
  {
    name: "Enterprise",
    speed: "50Mbps",
    price: "1,600",
    features: [
      "Unlimited data",
      "Dedicated support",
      "30-day duration",
      "Accra & Tema coverage"
    ]
  }
];

const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Infinity className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Unlimited Data Packages</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All prices exclude tax. Setup costs determined after survey. Valid for locations in Accra & Tema only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative border-border hover:border-primary/50 transition-all duration-300 animate-fade-in-up ${
                plan.popular ? 'glow-card border-primary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold gradient-text">{plan.speed}</span>
                </div>
                <CardDescription className="text-base">
                  <span className="text-3xl font-bold text-foreground">GH₵ {plan.price}</span>
                  <span className="text-muted-foreground"> / month</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant={plan.popular ? "hero" : "hero-outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>* Quote valid for 3 weeks only. Setup cost to be determined after technical survey.</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
