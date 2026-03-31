import iklickLogo from "@/assets/iklick-logo.jpg";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                i<span className="gradient-text">Klick</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Forward-thinking ISP delivering reliable, high-speed connectivity across Ghana.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#services" className="hover:text-foreground transition-colors">Enterprise Fiber</a></li>
              <li><a href="#services" className="hover:text-foreground transition-colors">Residential Broadband</a></li>
              <li><a href="#services" className="hover:text-foreground transition-colors">VoIP Solutions</a></li>
              <li><a href="#services" className="hover:text-foreground transition-colors">Managed IT</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#support" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#support" className="hover:text-foreground transition-colors">Service Status</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Adiriganor Road, East Legon</li>
              <li>P.O. Box OS 1554, Osu Accra</li>
              <li><a href="mailto:sales@iklickgh.com" className="hover:text-foreground transition-colors">sales@iklickgh.com</a></li>
              <li><a href="tel:+233242548764" className="hover:text-foreground transition-colors">+233-242-548-764</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} iKlick Communications Limited. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
