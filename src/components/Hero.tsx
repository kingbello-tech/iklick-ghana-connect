import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import slideFiber from "@/assets/hero/slide-fiber.jpg";
import slideCity from "@/assets/hero/slide-city.jpg";
import slideHome from "@/assets/hero/slide-home.jpg";
import slideEnterprise from "@/assets/hero/slide-enterprise.jpg";

const slides = [
  {
    image: slideFiber,
    badge: "iKlick Communications Ltd",
    headline: "Internet",
    headlineAccent: "at a Click",
    subtitle:
      "We're building Ghana's most reliable network, delivering high-speed fiber and wireless internet to homes and enterprises across the nation.",
  },
  {
    image: slideCity,
    badge: "Connecting Networks",
    headline: "Powering a",
    headlineAccent: "Connected Nation",
    subtitle:
      "Our fiber and wireless infrastructure spans across the country, and beyond, linking communities, businesses, and institutions to the digital world.",
  },
  {
    image: slideHome,
    badge: "For Homes",
    headline: "Seamless Internet",
    headlineAccent: "for Every Home",
    subtitle:
      "Stream, learn, and stay connected with blazing-fast fiber broadband or reliable wireless. Internet you can count on, every day.",
  },
  {
    image: slideEnterprise,
    badge: "For Enterprises",
    headline: "Enterprise-Grade",
    headlineAccent: "Connectivity",
    subtitle:
      "Dedicated fiber lines, high-speed wireless links, 99.9% SLA-backed uptime, and 24/7 NOC support — mission-critical internet built for business.",
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(index);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 500);
    },
    [isTransitioning],
  );

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background images */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current && !isTransitioning ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105"
            width={1920}
            height={1080}
            {...(i === 0 ? {} : { loading: "lazy" as const })}
          />
          {/* Ken Burns subtle zoom */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              animation: i === current ? "kenburns 8s ease-in-out forwards" : "none",
            }}
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-[1]" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 transition-all duration-700 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-white/90">{slide.badge}</span>
          </div>

          {/* Headline */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-white mb-6 transition-all duration-700 delay-100 ${
              isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
            }`}
          >
            {slide.headline}{" "}
            <span className="bg-gradient-to-r from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)] bg-clip-text text-transparent">
              {slide.headlineAccent}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10 transition-all duration-700 delay-200 ${
              isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
            }`}
          >
            {slide.subtitle}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${
              isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
            }`}
          >
            <a href="mailto:sales@iklickgh.com">
              <Button
                size="lg"
                className="text-base px-8 py-6 bg-gradient-to-r from-[hsl(195,100%,45%)] to-[hsl(180,100%,40%)] text-white hover:shadow-lg hover:shadow-[hsl(195,100%,45%)]/30 transition-all border-0"
              >
                Get Connected
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#about">
              <Button
                size="lg"
                className="text-base px-8 py-6 bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20 transition-all"
              >
                Learn Our Story
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-xl mx-auto transition-all duration-700 delay-[400ms] ${
              isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
            }`}
          >
            {[
              { value: "99.9%", label: "Service Uptime" },
              { value: "100+", label: "Businesses Served" },
              { value: "24/7", label: "NOC Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)] bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current
                ? "w-10 bg-gradient-to-r from-[hsl(195,100%,55%)] to-[hsl(180,100%,45%)]"
                : "w-6 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
