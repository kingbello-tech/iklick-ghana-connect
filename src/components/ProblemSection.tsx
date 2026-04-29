const ProblemSection = () => {
  return (
    <section className="pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-transparent" />

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

        {/* Seamless transition connector to Solution section */}
        <div className="flex flex-col items-center mt-12 animate-fade-in">
          <div className="h-24 w-px bg-gradient-to-b from-transparent via-primary/40 to-primary" />
          <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary))] animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
