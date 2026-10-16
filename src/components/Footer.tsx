import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";
import iklickLogo from "@/assets/iklick_logo_full.png";
import SectionLink from "@/components/SectionLink";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { LINKEDIN_URL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/contact";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={iklickLogo} alt="iKlick Communications" className="h-16 md:h-20 w-auto object-contain rounded" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Forward-thinking ISP delivering reliable, high-speed connectivity across Ghana.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="iKlick Communications on LinkedIn"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat with iKlick support on WhatsApp"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-whatsapp hover:text-whatsapp-foreground transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><SectionLink hash="#services" className="hover:text-foreground transition-colors">Enterprise Fiber</SectionLink></li>
              <li><SectionLink hash="#services" className="hover:text-foreground transition-colors">Residential Broadband</SectionLink></li>
              <li><SectionLink hash="#services" className="hover:text-foreground transition-colors">VoIP Solutions</SectionLink></li>
              <li><SectionLink hash="#services" className="hover:text-foreground transition-colors">Managed IT</SectionLink></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><SectionLink hash="#support" className="hover:text-foreground transition-colors">Help Center</SectionLink></li>
              <li><SectionLink hash="#support" className="hover:text-foreground transition-colors">Service Status</SectionLink></li>
              <li><SectionLink hash="#contact" className="hover:text-foreground transition-colors">Contact Us</SectionLink></li>
              <li><SectionLink hash="#support" className="hover:text-foreground transition-colors">FAQs</SectionLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/70">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Adjiringanor Road, East Legon</li>
              <li>P.O. Box OS 1554, Osu Accra</li>
              <li><a href="mailto:sales@iklickgh.com" className="hover:text-foreground transition-colors">sales@iklickgh.com</a></li>
              <li><a href="tel:+233242548764" className="hover:text-foreground transition-colors">{WHATSAPP_DISPLAY}</a></li>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"><WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} iKlick Communications Limited. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="mailto:sales@iklickgh.com" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="mailto:sales@iklickgh.com" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

