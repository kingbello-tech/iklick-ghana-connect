import { useState } from "react";
import { AlertTriangle, MapPin, DollarSign, Wifi } from "lucide-react";

const challenges = [
  {
    icon: MapPin,
    title: "Limited Coverage",
    description: "Many areas across Ghana remain underserved with inconsistent or unavailable internet access, limiting digital participation.",
  },
  {
    icon: DollarSign,
    title: "High Costs & Low Value",
    description: "Existing providers often charge premium rates for unreliable, slow connections — especially for businesses requiring consistent bandwidth.",
  },
  {
    icon: Wifi,
    title: "Unreliable Connectivity",
    description: "Frequent outages, slow speeds, and poor customer support leave homes and enterprises struggling to stay connected.",
  },
  {
    icon: AlertTriangle,
    title: "Growing Digital Divide",
    description: "Without reliable internet, schools, hospitals, and businesses in underserved areas are left behind in Ghana's digital transformation.",
  },
];

const ChallengeCard = ({ challenge, index }: { challenge: typeof challenges[0]; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`relative cursor-pointer rounded-xl bg-card/50 backdrop-blur-sm border transition-all duration-500 animate-fade-in-up overflow-hidden ${
        expanded
          ? "p-6 border-destructive/40 shadow-lg shadow-destructive/10 scale-105 z-10"
          : "p-6 border-border hover:border-destructive/30"
      }`}
      style={{
        animationDelay: `${index * 100}ms`,
        transform: expanded ? "scale(1.05) rotateY(0deg)" : "scale(1) rotateY(0deg)",
        animation: expanded
          ? `card-flip-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
          : undefined,
      }}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 transition-all duration-500 ${
          expanded ? "mx-auto w-14 h-14 rounded-xl" : ""
        }`}
      >
        <challenge.icon className={`text-destructive transition-all duration-500 ${expanded ? "w-7 h-7" : "w-5 h-5"}`} />
      </div>

      {/* Title — always visible */}
      <h3
        className={`font-semibold text-foreground transition-all duration-500 ${
          expanded ? "text-center text-lg mb-3" : "mb-0"
        }`}
      >
        {challenge.title}
      </h3>

      {/* Description — only visible when expanded */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          {challenge.description}
        </p>
      </div>

      {/* Tap hint */}
      {!expanded && (
        <p className="text-[10px] text-muted-foreground/50 mt-3 uppercase tracking-wider">Tap to learn more</p>
      )}
    </div>
  );
};

const ProblemSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-destructive/3 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Story text */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20">
              <span className="text-sm font-medium text-destructive uppercase tracking-wider">The Challenge</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Connectivity Gaps in a{" "}
              <span className="text-destructive">Rapidly Growing</span> Digital Economy
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Despite strong growth in mobile penetration and digital services, Ghana's internet infrastructure faces structural challenges that limit nationwide connectivity and service quality for both homes and businesses.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The result is a growing gap between the demand for reliable internet and the infrastructure needed to support everyday life, education, healthcare, and business operations.
            </p>
          </div>

          {/* Right: Challenge cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenges.map((challenge, index) => (
              <ChallengeCard key={index} challenge={challenge} index={index} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes card-flip-in {
          0% {
            transform: scale(1) perspective(800px) rotateY(0deg);
          }
          40% {
            transform: scale(1.08) perspective(800px) rotateY(180deg);
          }
          70% {
            transform: scale(1.05) perspective(800px) rotateY(360deg);
          }
          100% {
            transform: scale(1.05) perspective(800px) rotateY(360deg);
          }
        }
      `}</style>
    </section>
  );
};

export default ProblemSection;
