import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import fiberNetwork from "@/assets/fiber-network.jpg";

const IntroLanding = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/home");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${fiberNetwork})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 animate-gradient-shift z-0" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 gradient-text">
            iKlick
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>

        {/* Tagline */}
        <p className="text-2xl md:text-4xl font-light text-foreground/90 mb-4">
          Connecting Ghana's Digital Future
        </p>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          High-speed fiber optic internet for homes and businesses
        </p>

        {/* CTA Button */}
        <Button 
          onClick={handleEnter}
          variant="hero"
          size="lg"
          className="group animate-float"
        >
          Explore Our Services
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroLanding;
