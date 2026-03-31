import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface NavbarProps {
  visible?: boolean;
}

const Navbar = ({ visible = true }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "Pricing", href: "#pricing" },
    { name: "Support", href: "#support" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              i<span className="gradient-text">Klick</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
            <ThemeToggle />
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button variant="hero" size="sm" className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
