import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get{" "}
            <span className="gradient-text">Connected?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Join 100+ businesses in Ghana enjoying reliable, high-speed fiber connectivity from iKlick.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Schedule a Consultation
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
              Call +233-242-548-764
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
