import { useState } from "react";
import { Linkedin, Mail, ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import team1 from "@/assets/team/team-1.jpg";
import team2 from "@/assets/team/team-2.jpg";
import team3 from "@/assets/team/team-3.jpg";
import team4 from "@/assets/team/team-4.jpg";
import team5 from "@/assets/team/team-5.jpg";
import team6 from "@/assets/team/team-6.jpg";

interface Member {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
  email: string;
  linkedin?: string;
}

const team: Member[] = [
  {
    id: 1, name: "Kwame Mensah", role: "Chief Executive Officer", image: team1,
    email: "kwame@iklickgh.com", linkedin: "#",
    bio: "Kwame founded iKlick with a vision to bridge Ghana's digital divide. With over 15 years in telecommunications and infrastructure, he leads the company's strategic direction and partnerships across the region. He is passionate about building reliable connectivity for communities, enterprises, and homes.",
  },
  {
    id: 2, name: "Ama Boateng", role: "Director of Operations", image: team2,
    email: "ama@iklickgh.com", linkedin: "#",
    bio: "Ama oversees iKlick's day-to-day operations, ensuring every deployment, installation, and service ticket is delivered to the highest standard. With a background in industrial engineering, she brings precision and care to every project the team takes on.",
  },
  {
    id: 3, name: "Kojo Asante", role: "Lead Network Engineer", image: team3,
    email: "kojo@iklickgh.com", linkedin: "#",
    bio: "Kojo architects the fiber and wireless networks powering iKlick's clients. From core routing to last-mile design, he leads the engineering team in building resilient, scalable infrastructure that delivers consistent performance.",
  },
  {
    id: 4, name: "Akosua Owusu", role: "Sales Manager", image: team4,
    email: "akosua@iklickgh.com", linkedin: "#",
    bio: "Akosua partners with enterprises, estates, and institutions to design connectivity solutions that fit their needs. She combines technical fluency with a consultative approach to help clients get the most from their network.",
  },
  {
    id: 5, name: "Yaw Adjei", role: "Finance Officer", image: team5,
    email: "yaw@iklickgh.com", linkedin: "#",
    bio: "Yaw runs iKlick's financial operations with discipline and transparency. He keeps the engine of the business running smoothly so the operations and engineering teams can focus on serving clients.",
  },
  {
    id: 6, name: "Esi Quartey", role: "Client Experience Lead", image: team6,
    email: "esi@iklickgh.com", linkedin: "#",
    bio: "Esi champions the voice of every iKlick client. She leads support, satisfaction, and SLA programs — making sure clients feel heard and that every issue is resolved quickly and completely.",
  },
];

const Team = () => {
  const [selected, setSelected] = useState<Member>(team[0]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <p className="text-sm text-muted-foreground mb-2">Home / Meet the team</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Meet the <span className="gradient-text">Team</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The people behind our success, Engineers, Operators, and Storytellers building Ghana's most reliable connectivity.
          </p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left: Team grid */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <p className="text-xs text-muted-foreground mb-1 text-center">Home /</p>
                <h2 className="text-2xl font-bold mb-1 text-center">MEET THE TEAM</h2>
                <p className="text-sm text-muted-foreground text-center">The people behind our success</p>
              </div>
            </div>

            {/* Right: Selected member */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card p-8 md:p-12 animate-fade-in" key={selected.id}>
                <p className="text-xs text-muted-foreground mb-2 text-center">
                  Home / Meet the team /
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center tracking-tight uppercase">
                  {selected.name}
                </h2>
                <p className="text-muted-foreground text-center mb-8">{selected.role}</p>

                <div className="flex justify-center mb-6">
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-primary/20">
                    <img src={selected.image} alt={selected.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex justify-center gap-3 mb-8">
                  <a href={`mailto:${selected.email}`} aria-label="Email"
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                  {selected.linkedin && (
                    <a href={selected.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
                  <p>{selected.bio}</p>
                </div>

                <div className="mt-10 flex justify-center">
                  <a href="mailto:sales@iklickgh.com">
                    <Button variant="hero" size="lg">Work with us</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Team;