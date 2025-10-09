import { Home, Wifi, Tv, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Wifi,
    title: "Ultra-Fast Internet",
    description: "Up to 70% faster than the competition"
  },
  {
    icon: Home,
    title: "FTTH Technology",
    description: "Fiber-to-the-Home for maximum reliability"
  },
  {
    icon: Tv,
    title: "IPTV & CCTV",
    description: "Voice, video, and IoT connectivity"
  },
  {
    icon: Smartphone,
    title: "Cost-Effective",
    description: "Up to 60% savings for clients"
  }
];

const ResidentialServices = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Home className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">For Homes & SMEs</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Residential & SME <span className="gradient-text">Fibre Broadband</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8">
              Our Fiber-to-the-Home (FTTH) solution delivers ultra-fast internet, Wi-Fi, voice, 
              video (IPTV/CCTV), and IoT connectivity, tailored for homes and small businesses.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border hover:border-primary/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg">
              Request Installation
            </Button>
          </div>

          {/* Right Column - Process Steps */}
          <div className="animate-fade-in-up">
            <div className="p-8 rounded-2xl bg-card border border-border glow-card">
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="space-y-6">
                {[
                  "Submit request with location coordinates",
                  "Technical site survey conducted",
                  "Invoice shared for approval and payment",
                  "Project plan issued",
                  "Deployment based on requirements",
                  "Client acceptance test & sign-off",
                  "Billing begins"
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <p className="text-muted-foreground">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResidentialServices;
