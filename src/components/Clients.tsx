const clients = [
  "National Geographic",
  "Netflix", 
  "TED",
  "IGN",
  "ESPN",
  "Disney Kids",
  "UNESCO",
  "Barbie"
];

const Clients = () => {
  return (
    <section className="py-24 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="gradient-text">Leading Organizations</span>
          </h2>
          <p className="text-muted-foreground">
            Powering connectivity for Ghana's most innovative businesses
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {clients.map((client, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-6 rounded-lg bg-card/30 border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-lg font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {client}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;
