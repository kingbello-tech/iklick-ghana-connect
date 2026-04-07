import { Target, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AboutSection = () => {
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
            Built to Bridge Ghana's{" "}
            <span className="gradient-text">Digital Divide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            iKlick Communications Ltd was founded to address the critical need for reliable, affordable internet connectivity across Ghana. We bring enterprise-grade fiber solutions to homes, businesses, and institutions nationwide.
          </p>
        </div>

        {/* Mission & Vision cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-primary/40 transition-all duration-300 glow-card animate-fade-in-up">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To deliver innovative, reliable, and affordable fiber-optic internet that empowers homes, businesses, and communities to thrive in a connected world — improving service quality and driving digital inclusion across Ghana.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-accent/40 transition-all duration-300 glow-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6">
              <Eye className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              To be Ghana's most trusted Internet Service Provider, recognized for exceptional reliability, customer-first support, and our contribution to connecting every corner of the nation with world-class internet.
            </p>
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
