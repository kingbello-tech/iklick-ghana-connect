import nationalGeographic from "@/assets/logos/national-geographic.png";
import netflix from "@/assets/logos/netflix.png";
import ted from "@/assets/logos/ted.png";
import ign from "@/assets/logos/ign.png";
import espn from "@/assets/logos/espn.png";
import disneyKids from "@/assets/logos/disney-kids.png";
import unesco from "@/assets/logos/unesco.png";
import barbie from "@/assets/logos/barbie.png";

const row1 = [
  { name: "National Geographic", logo: nationalGeographic },
  { name: "Netflix", logo: netflix },
  { name: "TED", logo: ted },
  { name: "IGN", logo: ign },
];

const row2 = [
  { name: "ESPN", logo: espn },
  { name: "Disney Kids", logo: disneyKids },
  { name: "UNESCO", logo: unesco },
  { name: "Barbie", logo: barbie },
];

const Clients = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Trusted by leading organizations
          </p>
        </div>
      </div>

      {/* Row 1 - scrolls left */}
      <div className="relative mb-8">
        <div className="flex animate-scroll gap-16 items-center">
          {[...row1, ...row1, ...row1, ...row1].map((client, i) => (
            <div key={i} className="flex-shrink-0 px-4">
              <img
                src={client.logo}
                alt={client.name}
                className="h-10 md:h-12 object-contain opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 - scrolls right */}
      <div className="relative">
        <div className="flex animate-scroll-reverse gap-16 items-center">
          {[...row2, ...row2, ...row2, ...row2].map((client, i) => (
            <div key={i} className="flex-shrink-0 px-4">
              <img
                src={client.logo}
                alt={client.name}
                className="h-10 md:h-12 object-contain opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;
