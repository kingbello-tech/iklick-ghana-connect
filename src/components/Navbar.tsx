import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import iklickLogo from "@/assets/IKLICK_LOGO.jpg";

interface NavbarProps {
  visible?: boolean;
}

const Navbar = ({ visible = true }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Services", href: "#services", isRoute: false },
    { name: "Projects", href: "/projects", isRoute: true },
    { name: "Support", href: "#support", isRoute: false },
    { name: "Contact", href: "#contact", isRoute: false }
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
            <img src={iklickLogo} alt="iKlick Communications" className="h-10 w-auto object-contain rounded" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`transition-colors ${location.pathname === link.href ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </a>
              )
            )}
            <ThemeToggle />
            <a href="mailto:sales@iklickgh.com">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </a>
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
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`py-2 transition-colors ${location.pathname === link.href ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              )}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <a href="mailto:sales@iklickgh.com" className="flex-1">
                  <Button variant="hero" size="sm" className="w-full">
                    Get Started
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
