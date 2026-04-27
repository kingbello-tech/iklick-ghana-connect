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
  return (
    <div
      className="group relative cursor-default rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:scale-105 hover:z-10 p-6 transition-all duration-500 animate-fade-in-up overflow-hidden"
      style={{
        animationDelay: `${index * 100}ms`,
        perspective: "800px",
      }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-all duration-500 group-hover:mx-auto group-hover:w-14 group-hover:h-14 group-hover:rounded-xl">
        <challenge.icon className="w-5 h-5 text-primary transition-all duration-500 group-hover:w-7 group-hover:h-7" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground transition-all duration-500 group-hover:text-center group-hover:text-lg group-hover:mb-3">
        {challenge.title}
      </h3>

      {/* Description — revealed on hover */}
      <div className="max-h-0 opacity-0 mt-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {challenge.description}
        </p>
      </div>
    </div>
  );
};

const ProblemSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Centered header text */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary bg-primary">
            <span className="text-sm font-medium uppercase tracking-wider text-secondary-foreground">The Challenge</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Connectivity Gaps in a{" "}
            <span className="text-primary">Rapidly Growing</span> Digital Economy
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Despite strong growth in mobile penetration and digital services, Ghana's internet infrastructure faces structural challenges that limit nationwide connectivity and service quality for both homes and businesses.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The result is a growing gap between the demand for reliable internet and the infrastructure needed to support everyday life, education, healthcare, and business operations.
          </p>
        </div>

        {/* Cards below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {challenges.map((challenge, index) => (
            <ChallengeCard key={index} challenge={challenge} index={index} />
          ))}
        </div>
      </div>

    </section>
  );
};

export default ProblemSection;
