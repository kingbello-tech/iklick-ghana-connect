import { useState } from "react";
import { Linkedin, Mail, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import brightImg from "@/assets/team-photos/bright.jpg";
import ritaImg from "@/assets/team-photos/rita.jpg";
import erasmusImg from "@/assets/team-photos/erasmus.jpg";
import eugeneImg from "@/assets/team-photos/eugene.png";
import josephImg from "@/assets/team-photos/joseph.png";
import asedaImg from "@/assets/team-photos/aseda.png";
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
    id: 1, name: "Bright Asiamah Tawiah", role: "General Manager", image: brightImg,
    email: "bright@iklickgh.com", linkedin: "#",
    bio: "Bright Asiamah Tawiah is the General Manager of IKLICK, bringing over 17 years of experience in sales, business development, and strategic leadership within the telecommunications and ICT industry. Throughout his career, he has held key leadership roles with leading multinational organizations, including GS Telecom, Gateway Communication, Vodacom, AirtelTigo, Internet Solutions (IS), and PAIX Data Centres.\n\nHe possesses extensive expertise in enterprise sales, business development, partner management, go-to-market strategy, connectivity solutions, value-added services (VAS), mobility, Internet of Things (IoT), contract management, and data centre solutions. His proven ability to develop high-performing teams, drive revenue growth, and build strategic partnerships has consistently delivered strong business outcomes.\n\nBright holds a Bachelor of Laws (LLB), a Master of Business Administration (MBA) in Marketing, and a Master of Arts (MA) in Economic Policy Management from the University of Ghana. He also earned a Master of Science (MSc) of Research from the University of Salford, reflecting his commitment to continuous learning and evidence-based leadership.\n\nAs General Manager, Bright is committed to positioning IKLICK as a leading provider of innovative, reliable, and customer-centric connectivity solutions. His vision is to drive sustainable growth, foster a culture of innovation and operational excellence, and strengthen IKLICK's competitiveness within Ghana and across the wider African digital economy.",
  },
  {
    id: 2, name: "Rita Sena Agbeko", role: "Head of Finance & Strategy", image: ritaImg,
    email: "rita@iklickgh.com", linkedin: "#",
    bio: "Rita Sena Agbeko is the Head of Finance and Strategy at IKLICK, bringing over 16 years of experience in finance, accounting, and strategic management. She is a Chartered Accountant (CA) and an ACCA-certified finance professional with a strong track record in financial leadership, corporate governance, and business strategy.\n\nHer diverse industry experience spans finance, advertising, manufacturing, and supply chain management, equipping her with a broad perspective on driving operational efficiency, financial performance, and sustainable business growth. She has successfully led financial planning, budgeting, compliance, risk management, and strategic initiatives that enhance organisational value and support informed decision-making in various institutions like NDK Financial Services, mediaReach OMD, and Plot Enterprise Ghana Limited.\n\nAs Head of Finance and Strategy, Rita is responsible for strengthening IKLICK's financial sustainability, optimising business performance, and supporting the company's long-term strategic objectives. She is committed to fostering sound financial governance, driving innovation, and delivering strategies that position IKLICK for sustained growth and industry leadership.",
  },
  {
    id: 3, name: "Joseph Afotey", role: "Head of Technology", image: josephImg,
    email: "joseph@iklickgh.com", linkedin: "#",
    bio: "Joseph Afotey is the Head of Technology at IKLICK, bringing over 20 years of experience in the telecommunications and ICT industry. He is an accomplished technology leader with extensive expertise in designing, deploying, and managing resilient communication networks across Ghana and the wider West African region.\n\nHe holds a Bachelor of Science (BSc) in Computer Science (Information Systems) and has successfully applied radio frequency, fibre optic transmission, and satellite technologies to develop robust backbone infrastructure and customer access networks. His experience spans network architecture, systems integration, infrastructure optimisation, and the delivery of high-availability connectivity solutions for enterprise and carrier environments.\n\nAs Head of Technology, Joseph leads IKLICK's technology strategy and operations, ensuring the delivery of secure, scalable, and reliable network services. He is passionate about leveraging innovation and emerging technologies to strengthen the company's infrastructure, enhance service quality, and support IKLICK's long-term growth and commitment to delivering world-class connectivity solutions.",
  },
  {
    id: 4, name: "Eugene Bluku", role: "Head of Sales", image: eugeneImg,
    email: "eugene@iklickgh.com", linkedin: "#",
    bio: "Eugene Bluku is the Head of Sales at IKLICK, bringing over 13 years of experience in enterprise sales, account management, and business development within the telecommunications industry. He has a proven track record of building strategic client relationships, driving revenue growth, and delivering customer-focused solutions that create long-term value.\n\nHis expertise includes corporate account management, business-to-business (B2B) sales, customer relationship management (CRM), corporate communications, strategic sales planning, and market development. With a strong analytical approach and a deep understanding of customer needs, Eugene has consistently delivered sustainable business growth while enhancing customer satisfaction and retention in various institututions like AirtelTigo, Comsys and MainOne.\n\nEugene is a graduate of the University of Ghana and a member of the Chartered Institute of Marketing (UK). As Head of Sales, he leads IKLICK’s commercial strategy, focusing on expanding the company's market presence, strengthening client partnerships, and delivering innovative connectivity solutions that support sustainable growth and reinforce IKLICK’s position as a trusted telecommunications provider.",
  },
  {
    id: 5, name: "Erasmus Ocansey", role: "Head of Service Delivery", image: erasmusImg,
    email: "erasmus@iklickgh.com", linkedin: "#",
    bio: "Erasmus Ocansey is the Head of Service Delivery at IKLICK, bringing over 20 years of experience in the ICT industry, including more than a decade in C-suite and executive leadership roles at Vobiss Solutions. He holds a Master of Business Administration (MBA) from Accra Business School and a Bachelor of Business Administration (BBA) from Zenith University College.\n\nWith extensive expertise in service delivery, operations management, and customer experience, Erasmus is committed to ensuring the delivery of reliable, high-quality, and customer-centric solutions. His strategic leadership and operational excellence play a key role in driving service innovation, enhancing customer satisfaction, and improving long-term client retention, while supporting IKLICK's vision of becoming a leading provider of digital connectivity solutions.",
  },
  {
    id: 6, name: "Aseda Sasu-Boamah", role: "Business Support Officer", image: asedaImg,
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
            {/* Left: Hierarchy */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <p className="text-xs text-muted-foreground mb-1 text-center">Home /</p>
                <h2 className="text-2xl font-bold mb-1 text-center">MEET THE TEAM</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center">The people behind our success</p>

                <div className="flex flex-col items-center gap-6">
                  {/* General Manager */}
                  {team.find((m) => m.role === "General Manager") && (
                    <div className="w-full flex flex-col items-center">
                      <button
                        onClick={() => setSelected(team.find((m) => m.role === "General Manager")!)}
                        className={`group flex flex-col items-center text-center p-4 rounded-2xl transition-all ${
                          selected.role === "General Manager" ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 ring-2 transition-all flex items-center justify-center bg-muted ${
                          selected.role === "General Manager" ? "ring-primary" : "ring-border group-hover:ring-primary/40"
                        }`}>
                          {team.find((m) => m.role === "General Manager")!.image ? (
                            <img src={team.find((m) => m.role === "General Manager")!.image!} alt={team.find((m) => m.role === "General Manager")!.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <p className="font-semibold text-sm">{team.find((m) => m.role === "General Manager")!.name}</p>
                        <p className="text-xs text-muted-foreground">{team.find((m) => m.role === "General Manager")!.role}</p>
                      </button>
                    </div>
                  )}

                  {/* Connector line down to heads */}
                  <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-primary/20" />

                  {/* Department Heads */}
                  <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                    {team
                      .filter((m) => m.role.startsWith("Head of"))
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelected(m)}
                          className={`group flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                            selected.id === m.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-2 ring-2 transition-all flex items-center justify-center bg-muted ${
                            selected.id === m.id ? "ring-primary" : "ring-border group-hover:ring-primary/40"
                          }`}>
                            {m.image ? (
                              <img src={m.image} alt={m.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-semibold text-xs md:text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                        </button>
                      ))}
                  </div>

                  {/* Connector line down to support */}
                  <div className="w-px h-8 bg-gradient-to-b from-primary/20 to-primary/10" />

                  {/* Business Support */}
                  {team.find((m) => m.role === "Business Support Officer") && (
                    <div className="w-full flex flex-col items-center">
                      <button
                        onClick={() => setSelected(team.find((m) => m.role === "Business Support Officer")!)}
                        className={`group flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                          selected.role === "Business Support Officer" ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-2 ring-2 transition-all flex items-center justify-center bg-muted ${
                          selected.role === "Business Support Officer" ? "ring-primary" : "ring-border group-hover:ring-primary/40"
                        }`}>
                          {team.find((m) => m.role === "Business Support Officer")!.image ? (
                            <img src={team.find((m) => m.role === "Business Support Officer")!.image!} alt={team.find((m) => m.role === "Business Support Officer")!.name} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <p className="font-semibold text-xs md:text-sm">{team.find((m) => m.role === "Business Support Officer")!.name}</p>
                        <p className="text-xs text-muted-foreground">{team.find((m) => m.role === "Business Support Officer")!.role}</p>
                      </button>
                    </div>
                  )}
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