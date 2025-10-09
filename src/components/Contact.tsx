import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Ready to experience reliable, high-speed connectivity? Contact us today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 glow-card text-center animate-fade-in-up">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:sales@iklickgh.com" className="text-primary hover:underline">
                sales@iklickgh.com
              </a>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 glow-card text-center animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Phone</h3>
              <a href="tel:+233242548764" className="text-primary hover:underline">
                +233-242-548-764
              </a>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 glow-card text-center animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-muted-foreground text-sm">
                Adiriganor Road, East Legon<br />
                P.O. Box OS 1554, Osu Accra
              </p>
            </div>
          </div>

          <div className="text-center animate-fade-in">
            <Button variant="hero" size="lg">
              Schedule a Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
