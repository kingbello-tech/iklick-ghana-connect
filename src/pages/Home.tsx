import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Clients from "@/components/Clients";
import ValuePropositions from "@/components/ValuePropositions";
import FeatureTabs from "@/components/FeatureTabs";
import Support from "@/components/Support";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Home = () => {
  const [showNavbar, setShowNavbar] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar visible={showNavbar} />
      <Hero onAnimationComplete={() => setShowNavbar(true)} />
      <Clients />
      <ValuePropositions />
      <div id="services">
        <FeatureTabs />
      </div>
      <div id="support">
        <Support />
      </div>
      <Testimonials />
      <div id="pricing">
        <Pricing />
      </div>
      <div id="contact">
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
