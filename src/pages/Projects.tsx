import { useState, useEffect, useRef } from "react";
import { Wifi, Home, GraduationCap, MapPin, Users, Signal, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Project {
  id: number;
  title: string;
  category: "community" | "ftth" | "university";
  location: string;
  description: string;
  stats: { label: string; value: string }[];
  icon: React.ReactNode;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Accra Community Hotspots",
    category: "community",
    location: "Greater Accra Region",
    description: "Deployed public WiFi hotspots across key community centers, markets, and public spaces in Accra, bridging the digital divide for thousands of residents.",
    stats: [
      { label: "Hotspots Deployed", value: "50+" },
      { label: "Daily Users", value: "10,000+" },
      { label: "Coverage Area", value: "25 km²" },
    ],
    icon: <Wifi className="w-8 h-8" />,
  },
  {
    id: 2,
    title: "Tema Community Network",
    category: "community",
    location: "Tema Metropolitan Area",
    description: "Built a mesh wireless network connecting community libraries, schools, and health centers with reliable high-speed internet access.",
    stats: [
      { label: "Locations Connected", value: "35+" },
      { label: "Monthly Users", value: "5,000+" },
      { label: "Uptime", value: "99.5%" },
    ],
    icon: <Wifi className="w-8 h-8" />,
  },
  {
    id: 3,
    title: "East Legon FTTH Rollout",
    category: "ftth",
    location: "East Legon, Accra",
    description: "Comprehensive fiber-to-the-home deployment serving residential estates with speeds up to 1Gbps, enabling seamless streaming, remote work, and smart home connectivity.",
    stats: [
      { label: "Homes Connected", value: "500+" },
      { label: "Max Speed", value: "1 Gbps" },
      { label: "Uptime", value: "99.9%" },
    ],
    icon: <Home className="w-8 h-8" />,
  },
  {
    id: 4,
    title: "Spintex Road Fiber Network",
    category: "ftth",
    location: "Spintex, Accra",
    description: "Laid over 30km of fiber optic cable connecting residential communities along Spintex Road with ultra-fast internet for homes and small businesses.",
    stats: [
      { label: "Fiber Laid", value: "30+ km" },
      { label: "Subscribers", value: "800+" },
      { label: "Avg Speed", value: "200 Mbps" },
    ],
    icon: <Home className="w-8 h-8" />,
  },
  {
    id: 5,
    title: "University of Ghana Hostel WiFi",
    category: "university",
    location: "Legon, Accra",
    description: "Campus-wide high-speed wireless network deployment across all student hostels, providing reliable connectivity for academic research, e-learning, and student life.",
    stats: [
      { label: "Students Served", value: "15,000+" },
      { label: "Access Points", value: "200+" },
      { label: "Concurrent Users", value: "5,000+" },
    ],
    icon: <GraduationCap className="w-8 h-8" />,
  },
  {
    id: 6,
    title: "KNUST Hostel Connectivity",
    category: "university",
    location: "Kumasi",
    description: "Designed and deployed a robust wireless infrastructure across student hostels at KNUST, supporting high-density usage for lectures, research, and entertainment.",
    stats: [
      { label: "Hostels Covered", value: "12" },
      { label: "Students Connected", value: "8,000+" },
      { label: "Bandwidth", value: "10 Gbps" },
    ],
    icon: <GraduationCap className="w-8 h-8" />,
  },
];

const filters = [
  { key: "all", label: "All Projects" },
  { key: "community", label: "Community WiFi" },
  { key: "ftth", label: "Fiber to Home" },
  { key: "university", label: "University WiFi" },
];

const featuredSections = [
  {
    category: "community",
    title: "Community WiFi",
    subtitle: "Connecting Communities, Empowering People",
    description: "We believe internet access is a fundamental right. Our Community WiFi projects bring reliable, high-speed connectivity to underserved areas — from bustling markets to quiet community centers. By deploying robust mesh networks and public hotspots, we're helping bridge the digital divide across Ghana, enabling access to education, healthcare, and economic opportunities.",
    stats: [
      { value: "85+", label: "Hotspots Deployed" },
      { value: "15,000+", label: "Daily Users" },
      { value: "50 km²", label: "Total Coverage" },
    ],
    icon: <Wifi className="w-12 h-12" />,
    gradient: "from-primary/20 to-accent/20",
  },
  {
    category: "ftth",
    title: "Fiber to the Home",
    subtitle: "Ultra-Fast Fiber, Right to Your Doorstep",
    description: "Our FTTH projects deliver blazing-fast fiber optic connections directly into residential homes. With speeds up to 1Gbps, families can stream, work remotely, game, and connect smart devices without compromise. We handle everything from trenching and cable laying to final-mile installation, ensuring a seamless experience from start to finish.",
    stats: [
      { value: "1,300+", label: "Homes Connected" },
      { value: "60+ km", label: "Fiber Laid" },
      { value: "99.9%", label: "Network Uptime" },
    ],
    icon: <Home className="w-12 h-12" />,
    gradient: "from-accent/20 to-primary/20",
  },
  {
    category: "university",
    title: "University Hostel WiFi",
    subtitle: "Powering Campus Life with Seamless WiFi",
    description: "Our university projects provide high-density wireless coverage across student hostels and campus facilities. Designed to handle thousands of concurrent connections, our networks support e-learning platforms, research activities, video conferencing, and social connectivity — keeping students connected 24/7.",
    stats: [
      { value: "23,000+", label: "Students Served" },
      { value: "400+", label: "Access Points" },
      { value: "20 Gbps", label: "Total Bandwidth" },
    ],
    icon: <GraduationCap className="w-12 h-12" />,
    gradient: "from-primary/20 to-accent/20",
  },
];

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all" ? projects : projects.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)/0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Signal className="w-4 h-4" />
              Delivering Connectivity Across Ghana
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              From community hotspots to fiber-connected homes and university campuses — explore how iKlick is transforming connectivity across Ghana.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 sticky top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === f.key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Project Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      {featuredSections.map((section, i) => (
        <FeaturedSection key={section.category} section={section} index={i} />
      ))}

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Have a Project in <span className="gradient-text">Mind?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Let's discuss how iKlick can bring reliable fiber and wireless connectivity to your community, estate, or campus.
          </p>
          <a href="mailto:sales@iklickgh.com">
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Schedule a Consultation
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const gradients: Record<string, string> = {
    community: "from-primary/30 to-accent/20",
    ftth: "from-accent/30 to-primary/20",
    university: "from-primary/20 to-accent/30",
  };

  return (
    <div
      ref={ref}
      className={`group rounded-xl border border-border bg-card overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image area */}
      <div className={`h-48 bg-gradient-to-br ${gradients[project.category]} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)/0.1) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="text-primary/80 group-hover:scale-110 transition-transform duration-500">
          {project.icon}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5" />
          {project.location}
        </div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{project.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{project.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {project.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-sm font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-300">
          <a href="mailto:sales@iklickgh.com">
            <Button variant="hero" size="sm" className="w-full">
              Learn More <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function FeaturedSection({ section, index }: { section: typeof featuredSections[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const reversed = index % 2 === 1;

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 items-center`}>
          {/* Visual */}
          <div className={`flex-1 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${reversed ? "translate-x-8" : "-translate-x-8"}`}`}>
            <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${section.gradient} border border-border flex items-center justify-center relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)/0.3) 1px, transparent 0)", backgroundSize: "30px 30px" }} />
              <div className="text-primary/60">{section.icon}</div>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${reversed ? "-translate-x-8" : "translate-x-8"}`}`}>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">{section.title}</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{section.subtitle}</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{section.description}</p>

            <div className="grid grid-cols-3 gap-6">
              {section.stats.map((stat) => (
                <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Projects;
