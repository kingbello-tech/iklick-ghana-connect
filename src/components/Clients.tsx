import shc from "@/assets/logos/shc.jpg";
import soccabet from "@/assets/logos/soccabet.png";
import umat from "@/assets/logos/umat.png";
import qgConstruction from "@/assets/logos/qg-construction.jpg";
import mkopa from "@/assets/logos/mkopa.png";
import royalSenchi from "@/assets/logos/royal-senchi.jpg";
import gtbank from "@/assets/logos/gtbank.png";
import uhas from "@/assets/logos/uhas.jpg";
import b5plus from "@/assets/logos/b5plus.png";
import unnamedSchool from "@/assets/logos/unnamed-school.jpg";
import kaaf from "@/assets/logos/kaaf.jpg";
import fidelity from "@/assets/logos/fidelity.jfif";
import lancaster from "@/assets/logos/lancaster.jfif";
import safariValley from "@/assets/logos/safari-valley.png";
import heritage from "@/assets/logos/heritage.png";

const row1 = [
  { name: "State Housing Company", logo: shc },
  { name: "SoccaBet", logo: soccabet },
  { name: "UMaT", logo: umat },
  { name: "Queiroz Galvão", logo: qgConstruction },
  { name: "B5 Plus Group", logo: b5plus },
  { name: "KAAF University", logo: kaaf },
  { name: "Fidelity Bank", logo: fidelity },
  { name: "Safari Valley Resort", logo: safariValley },
];

const row2 = [
  { name: "M-KOPA", logo: mkopa },
  { name: "Royal Senchi", logo: royalSenchi },
  { name: "GTBank", logo: gtbank },
  { name: "UHAS", logo: uhas },
  { name: "Make Your Mark", logo: unnamedSchool },
  { name: "Lancaster University", logo: lancaster },
  { name: "Heritage Christian University", logo: heritage },
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
                className="h-10 md:h-12 object-contain opacity-80 transition-all duration-500 hover:scale-110"
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
                className="h-10 md:h-12 object-contain opacity-80 transition-all duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;
