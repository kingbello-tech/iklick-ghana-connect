import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-card/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              i<span className="gradient-text">Klick</span> Communications
            </span>
          </div>

          {/* Copyright */}
          <div className="text-muted-foreground text-sm text-center md:text-left">
            © {new Date().getFullYear()} iKlick Communications Limited. All rights reserved.
          </div>

          {/* Links */}
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
