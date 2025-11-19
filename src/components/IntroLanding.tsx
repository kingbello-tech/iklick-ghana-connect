import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FiberScene from "./FiberScene";

const IntroLanding = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/home");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* 3D Interactive Background */}
      <FiberScene onHouseReached={handleEnter} />

      {/* Frosted Glass UI Overlay */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
        <div className="backdrop-blur-xl bg-background/20 border border-primary/20 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 gradient-text drop-shadow-lg">
              iKlick
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/50" />
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-4xl font-light text-foreground mb-4 drop-shadow-md">
            Connecting Ghana's Digital Future
          </p>
          
          <p className="text-lg md:text-xl text-foreground/80 mb-12 max-w-2xl mx-auto">
            High-speed fiber optic internet for homes and businesses
          </p>

          {/* CTA Button */}
          <Button 
            onClick={handleEnter}
            variant="hero"
            size="lg"
            className="group backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-lg shadow-primary/30"
          >
            Explore Our Services
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-sm text-foreground/60 mt-6 italic">
            Click anywhere to zoom into the connection
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroLanding;
