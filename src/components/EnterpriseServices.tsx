import { Building2, Cable, Phone, Settings, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: Cable,
    title: "Dedicated Internet Access (DIA)",
    description: "High-speed, symmetrical internet with guaranteed bandwidth delivered over fiber for unmatched reliability and performance.",
    benefits: [
      "Consistent connectivity for critical operations",
      "Optimized for cloud applications",
      "Large data transfers made seamless"
    ]
  },
  {
    icon: Network,
    title: "Leased Line & WAN Connectivity",
    description: "Secure, high-speed point-to-point or point-to-multipoint connections over fiber for inter-office communication.",
    benefits: [
      "Data center integration",
      "Scalable WAN solutions",
      "Designed for enterprises and banks"
    ]
  },
  {
    icon: Phone,
    title: "Voice over IP (VoIP)",
    description: "High-quality voice services over fiber, enabling seamless communication with low latency.",
    benefits: [
      "Cost-effective telephony solutions",
      "Support for call centers",
      "Unified communications ready"
    ]
  },
  {
    icon: Settings,
    title: "Managed IT Services",
    description: "Comprehensive management of your fiber network, including monitoring, troubleshooting, and optimization.",
    benefits: [
      "Consistent uptime and performance",
      "Reduced operational complexity",
      "Customized solutions"
    ]
  }
];

const EnterpriseServices = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">For Businesses</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Enterprise Fibre <span className="gradient-text">Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mission-critical connectivity solutions designed for modern businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="border-border hover:border-primary/50 transition-all duration-300 glow-card animate-fade-in-up bg-card/50 backdrop-blur-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">{service.title}</CardTitle>
                <CardDescription className="text-base pt-2">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnterpriseServices;
