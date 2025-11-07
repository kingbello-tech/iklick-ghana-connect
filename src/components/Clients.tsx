import nationalGeographic from "@/assets/logos/national-geographic.png";
import netflix from "@/assets/logos/netflix.png";
import ted from "@/assets/logos/ted.png";
import ign from "@/assets/logos/ign.png";
import espn from "@/assets/logos/espn.png";
import disneyKids from "@/assets/logos/disney-kids.png";
import unesco from "@/assets/logos/unesco.png";
import barbie from "@/assets/logos/barbie.png";

const clients = [
  { name: "National Geographic", logo: nationalGeographic },
  { name: "Netflix", logo: netflix },
  { name: "TED", logo: ted },
  { name: "IGN", logo: ign },
  { name: "ESPN", logo: espn },
  { name: "Disney Kids", logo: disneyKids },
  { name: "UNESCO", logo: unesco },
  { name: "Barbie", logo: barbie },
];

const Clients = () => {
  return (
    <section className="py-24 border-y border-border overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="gradient-text">Leading Organizations</span>
          </h2>
          <p className="text-muted-foreground">
            Powering connectivity for Ghana's most innovative businesses
          </p>
        </div>

        <div className="relative">
          <div className="flex animate-scroll">
            {[...clients, ...clients].map((client, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-8 flex items-center justify-center p-6 rounded-lg bg-card/30 border border-border hover:border-primary/30 transition-all duration-300 min-w-[200px] h-[120px]"
              >
                <img 
                  src={client.logo} 
                  alt={client.name}
                  className="max-w-full max-h-full object-contain filter brightness-90 hover:brightness-110 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Clients;
