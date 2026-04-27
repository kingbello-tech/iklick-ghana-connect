import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wifi, Mail, Phone, ArrowRight } from "lucide-react";

const LAUNCH_DATE = new Date();
LAUNCH_DATE.setDate(LAUNCH_DATE.getDate() + 30);

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function ComingSoon() {
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);

  useEffect(() => {
    document.title = "iKlick Communications — Coming Soon";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "iKlick Communications is launching soon. Connecting Ghana with reliable fiber and wireless internet.");
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(220,40%,8%)] text-white">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[hsl(195,100%,55%)]/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[hsl(180,100%,45%)]/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[hsl(220,90%,50%)]/15 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)]">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">iKlick</span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(180,100%,45%)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(180,100%,45%)]" />
            </span>
            Launching Soon
          </span>

          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-5xl font-bold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
            Something powerful
            <br />
            is coming.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            We're building Ghana's most reliable internet experience — for homes,
            enterprises, and everything in between. Stay tuned.
          </p>

          {/* Countdown */}
          <div className="mt-12 grid grid-cols-4 gap-3 sm:gap-5">
            {[
              { label: "Days", value: days },
              { label: "Hours", value: hours },
              { label: "Minutes", value: minutes },
              { label: "Seconds", value: seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="min-w-[70px] rounded-2xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur-md sm:min-w-[100px] sm:px-5 sm:py-6"
              >
                <div className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-bold tabular-nums text-transparent sm:text-5xl">
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-xs">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
            <a
              href="mailto:info@iklickgh.com"
              className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
              info@iklickgh.com
            </a>
            <a
              href="tel:+233000000000"
              className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4" />
              Contact Sales
            </a>
          </div>
        </main>

        {/* Footer / discreet board access */}
        <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} iKlick Communications Ltd. All rights reserved.</span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white/80"
          >
            <Link to="/login">
              Board access
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}