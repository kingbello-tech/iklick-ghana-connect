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

const ProblemSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-destructive/3 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Two-column narrative layout */}
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
              <div
                key={index}
                className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-destructive/30 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <challenge.icon className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{challenge.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
