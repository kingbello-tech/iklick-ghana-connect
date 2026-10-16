import { useLocation } from "react-router-dom";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/contact";

/** Staff tools and the client portal keep their own chrome — no floating support button there. */
const HIDDEN_PREFIXES = ["/crm", "/portal", "/login"];

const WhatsAppFloatingButton = () => {
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact support on WhatsApp"
      className="fixed bottom-5 right-5 z-50 group flex items-center gap-3 rounded-full bg-whatsapp text-whatsapp-foreground pl-3 pr-5 py-3 shadow-lg shadow-whatsapp/30 hover:shadow-xl hover:shadow-whatsapp/40 hover:scale-[1.03] active:scale-100 transition-all"
    >
      <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <WhatsAppIcon className="w-5 h-5" />
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">Chat with us</span>
    </a>
  );
};

export default WhatsAppFloatingButton;
