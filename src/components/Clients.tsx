import shc from "@/assets/logos/shc.jpg";
import soccabet from "@/assets/logos/soccabet.png";
import umat from "@/assets/logos/umat.png";
import qgConstruction from "@/assets/logos/qg-construction.jpg";
import mkopa from "@/assets/logos/mkopa.png";
import royalSenchi from "@/assets/logos/royal-senchi.jpg";
import gtbank from "@/assets/logos/gtbank.png";
import uhas from "@/assets/logos/uhas.jpg";
import b5plus from "@/assets/logos/b5plus.png";

const row1 = [
  { name: "State Housing Company", logo: shc },
  { name: "SoccaBet", logo: soccabet },
  { name: "UMaT", logo: umat },
  { name: "Queiroz Galvão", logo: qgConstruction },
  { name: "B5 Plus Group", logo: b5plus },
];

const row2 = [
  { name: "M-KOPA", logo: mkopa },
  { name: "Royal Senchi", logo: royalSenchi },
  { name: "GTBank", logo: gtbank },
  { name: "UHAS", logo: uhas },
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
