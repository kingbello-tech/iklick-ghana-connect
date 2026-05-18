import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Clients from "@/components/Clients";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import AboutSection from "@/components/AboutSection";
import FeatureTabs from "@/components/FeatureTabs";
import InfrastructureSection from "@/components/InfrastructureSection";
import Support from "@/components/Support";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace(/^#/, "");
      // Wait for sections to mount
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen">
      <Navbar visible={true} />
      <Hero />
      <Clients />
      <ProblemSection />
      <SolutionSection />
      <AboutSection />
      <div id="services">
        <FeatureTabs />
      </div>
      <InfrastructureSection />
      <div id="support">
        <Support />
      </div>
      <Testimonials />
      <div id="contact">
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
