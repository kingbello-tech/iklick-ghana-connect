import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ValuePropositions from "@/components/ValuePropositions";
import EnterpriseServices from "@/components/EnterpriseServices";
import ResidentialServices from "@/components/ResidentialServices";
import Pricing from "@/components/Pricing";
import Support from "@/components/Support";
import Clients from "@/components/Clients";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Home = () => {
  const [showNavbar, setShowNavbar] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar visible={showNavbar} />
      <Hero onAnimationComplete={() => setShowNavbar(true)} />
      <ValuePropositions />
      <div id="services">
        <EnterpriseServices />
        <ResidentialServices />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <div id="support">
        <Support />
      </div>
      <Clients />
      <div id="contact">
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
