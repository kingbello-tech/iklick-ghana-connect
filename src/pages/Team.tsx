import { useState } from "react";
import { Linkedin, Mail, ChevronLeft, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import brightAsset from "@/assets/bright.jpg.asset.json";
import ritaAsset from "@/assets/rita.jfif.asset.json";
import erasmusAsset from "@/assets/erasmus.jpg.asset.json";
import eugeneAsset from "@/assets/eugene.png.asset.json";
import josephAsset from "@/assets/joseph.png.asset.json";
import asedaAsset from "@/assets/aseda.png.asset.json";
interface Member {
  id: number;
  name: string;
  role: string;
  image: string | null;
  bio: string;
  email: string;
  linkedin?: string;
}

const team: Member[] = [
  {
    id: 1, name: "Bright Asiamah Tawiah", role: "General Manager", image: brightAsset.url,
    email: "bright@iklickgh.com", linkedin: "#",
    bio: "Bright Asiamah Tawiah is the General Manager of IKLICK, bringing over 17 years of experience in sales, business development, and strategic leadership within the telecommunications and ICT industry. Throughout his career, he has held key leadership roles with leading multinational organizations, including GS Telecom, Gateway Communication, Vodacom, AirtelTigo, Internet Solutions (IS), and PAIX Data Centres.\n\nHe possesses extensive expertise in enterprise sales, business development, partner management, go-to-market strategy, connectivity solutions, value-added services (VAS), mobility, Internet of Things (IoT), contract management, and data centre solutions. His proven ability to develop high-performing teams, drive revenue growth, and build strategic partnerships has consistently delivered strong business outcomes.\n\nBright holds a Bachelor of Laws (LLB) from CU, a Master of Business Administration (MBA) in Marketing, and a Master of Arts (MA) in Economic Policy Management from the University of Ghana. He also earned a Master of Science (MSc) by Research from the University of Salford–RKC, reflecting his commitment to continuous learning and evidence-based leadership.\n\n\nAs General Manager, Bright is committed to positioning IKLICK as a leading provider of innovative, reliable, and customer-centric connectivity solutions. His vision is to drive sustainable growth, foster a culture of innovation and operational excellence, and strengthen IKLICK's competitiveness within Ghana and across the wider African digital economy.",
  },
  {
    id: 2, name: "Rita Sena Agbeko", role: "Head of Finance & Strategy", image: ritaAsset.url,
    email: "rita@iklickgh.com", linkedin: "#",
    bio: "Rita Sena Agbeko is the Head of Finance and Strategy with over 11 years of experience in the finance industry. She is a Chartered Accountant and an ACCA-certified professional, bringing strong expertise in financial management, corporate governance, and strategic planning. Rita aspires to leverage her skills to strengthen Iklick’s financial sustainability and drive innovative strategies that position the company for long-term growth and industry leadership.",
  },
  {
    id: 3, name: "Joseph Afotey", role: "Head of Technology", image: josephAsset.url,
    email: "joseph@iklickgh.com", linkedin: "#",
    bio: "Joseph Afotey is the Head of Technology at IKLICK, bringing over 20 years of experience in the telecommunications and ICT industry. He is an accomplished technology leader with extensive expertise in designing, deploying, and managing resilient communication networks across Ghana and the wider West African region.\n\n\n\n\nHe holds a Bachelor of Science (BSc) in Computer Science (Information Systems) and has successfully applied radio frequency, fibre optic transmission, and satellite technologies to develop robust backbone infrastructure and customer access networks. His experience spans network architecture, systems integration, infrastructure optimisation, and the delivery of high-availability connectivity solutions for enterprise and carrier environments.\n\n\n\n\nAs Head of Technology, Joseph leads IKLICK's technology strategy and operations, ensuring the delivery of secure, scalable, and reliable network services. He is passionate about leveraging innovation and emerging technologies to strengthen the company's infrastructure, enhance service quality, and support IKLICK's long-term growth and commitment to delivering world-class connectivity solutions.",
  },
  {
    id: 4, name: "Eugene Bluku", role: "Sales Manager", image: eugeneAsset.url,
    email: "eugene@iklickgh.com", linkedin: "#",
    bio: "Eugene Bluku is an experienced Corporate Account Manager with over 13 years of proven success in the telecommunications industry. He is highly skilled in analytical thinking, customer relationship management (CRM), corporate communications, and business-to-business (B2B) strategies, consistently driving customer satisfaction and business growth. He is a graduate of University of Ghana and a member of Chartered Institute of Marketing UK and has built a strong foundation in sales and corporate account management. Mr. Bluku aspires to continue strengthening client relationships and contributing to IKLICK’s vision of innovation and sustainable growth.",
  },
  {
    id: 5, name: "Erasmus Ocansey", role: "Head of Service Delivery", image: erasmusAsset.url,
    email: "erasmus@iklickgh.com", linkedin: "#",
    bio: "Erasmus Ocansey is the Head of Service Delivery at IKLICK, bringing over 20 years of experience in the ICT industry, including more than a decade in C-suite and executive leadership roles. He holds a Master of Business Administration (MBA) from Accra Business School and a Bachelor of Business Administration (BBA) from Zenith University College.\n\n\n\n\nWith extensive expertise in service delivery, operations management, and customer experience, Erasmus is committed to ensuring the delivery of reliable, high-quality, and customer-centric solutions. His strategic leadership and operational excellence play a key role in driving service innovation, enhancing customer satisfaction, and improving long-term client retention, while supporting IKLICK's vision of becoming a leading provider of digital connectivity solutions.",
  },
  {
    id: 6, name: "Aseda Sasu-Boamah", role: "Business Support Officer", image: asedaAsset.url,
    email: "aseda@iklickgh.com", linkedin: "#",
    bio: "Aseda Sasu-Boamah is the Business Support Officer at IKLICK, with expertise in human resources and administration. She holds a master’s degree in human resource management from Accra Business School and has over two years of experience supporting organizational operations and workforce management.\n\nShe is skilled in employee relations, administrative coordination, and HR information management, with a strong commitment to creating efficient processes and fostering a positive workplace culture. Aseda is passionate about building a well-structured and supportive work environment that empowers employees and contributes to IKLICK's operational excellence and long-term growth.",
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
            The people behind our success, Engineers, Operators, and amazing people building the most reliable connectivity ever seen.
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
                <p className="text-sm text-muted-foreground mb-6 text-center">The people behind our success</p>
                <div className="grid grid-cols-2 gap-5">
                  {team.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={`group flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                        selected.id === m.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 ring-2 transition-all flex items-center justify-center bg-muted ${
                        selected.id === m.id ? "ring-primary" : "ring-border group-hover:ring-primary/40"
                      }`}>
                        {m.image ? (
                          <img src={m.image} alt={m.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </button>
                  ))}
                </div>
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
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-primary/20 flex items-center justify-center bg-muted">
                    {selected.image ? (
                      <img src={selected.image} alt={selected.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-20 h-20 text-muted-foreground" />
                    )}
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

                <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
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