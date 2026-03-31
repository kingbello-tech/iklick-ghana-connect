import { Quote } from "lucide-react";

const testimonials1 = [
  { name: "Kwame Asante", company: "TechHub Ghana", quote: "iKlick transformed our connectivity. Zero downtime since we switched.", stat: "99.9% Uptime" },
  { name: "Ama Mensah", company: "Creative Agency", quote: "The speed upgrade was incredible. Our team productivity doubled.", stat: "2x Productivity" },
  { name: "David Osei", company: "Osei Logistics", quote: "Their enterprise solution handles all our 5 branches seamlessly.", stat: "5 Locations" },
  { name: "Nana Yaa", company: "EduTech Solutions", quote: "Reliable internet is critical for our online platform. iKlick delivers.", stat: "40K+ Users" },
];

const testimonials2 = [
  { name: "Kofi Boateng", company: "FinServe Ltd", quote: "We cut our connectivity costs by 60% after switching to iKlick.", stat: "60% Savings" },
  { name: "Efua Owusu", company: "Health Plus", quote: "24/7 support means our hospital systems never go offline.", stat: "24/7 Support" },
  { name: "Samuel Adjei", company: "RetailMax", quote: "The managed IT services freed our team to focus on growth.", stat: "3x Growth" },
  { name: "Abena Darko", company: "Media House", quote: "Streaming and uploads are flawless on iKlick's fiber connection.", stat: "50Mbps" },
];

const TestimonialCard = ({ t }: { t: typeof testimonials1[0] }) => (
  <div className="flex-shrink-0 w-80 p-6 rounded-xl bg-card/40 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300">
    <Quote className="w-5 h-5 text-primary/50 mb-3" />
    <p className="text-foreground/80 text-sm mb-4 leading-relaxed">"{t.quote}"</p>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{t.name}</p>
        <p className="text-xs text-muted-foreground">{t.company}</p>
      </div>
      <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
        {t.stat}
      </div>
    </div>
  </div>
);

const Testimonials = () => {
  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real Results from{" "}
            <span className="gradient-text">Real Clients</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how businesses across Ghana are thriving with iKlick connectivity
          </p>
        </div>
      </div>

      {/* Row 1 */}
      <div className="mb-6">
        <div className="flex animate-scroll gap-6">
          {[...testimonials1, ...testimonials1, ...testimonials1].map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>

      {/* Row 2 - reverse */}
      <div>
        <div className="flex animate-scroll-reverse gap-6">
          {[...testimonials2, ...testimonials2, ...testimonials2].map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
