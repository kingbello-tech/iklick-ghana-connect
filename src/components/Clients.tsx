import ruijie from "@/assets/logos/ruijie.png";
import ubiquiti from "@/assets/logos/ubiquiti.png";
import furukawa from "@/assets/logos/furukawa.png";
import vsol from "@/assets/logos/vsol.jpg";
import nedco from "@/assets/logos/nedco.jpg";
import mikrotik from "@/assets/logos/mikrotik.jpg";
import vobiss from "@/assets/logos/vobiss.png";

const allClients = [
  { name: "Ruijie Networks", logo: ruijie },
  { name: "Ubiquiti Networks", logo: ubiquiti },
  { name: "Furukawa Electric", logo: furukawa },
  { name: "V-SOL", logo: vsol },
  { name: "NEDCo", logo: nedco },
  { name: "MikroTik", logo: mikrotik },
  { name: "VOBISS Solutions", logo: vobiss },
];

const Clients = () => {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Our Partners and Vendors
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="flex animate-scroll gap-16 items-center">
          {[...allClients, ...allClients, ...allClients, ...allClients].map((client, i) => (
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
