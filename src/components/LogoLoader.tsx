import iklickLogo from "@/assets/iklick_logo_full.png";

interface LogoLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-12",
  md: "h-20",
  lg: "h-28",
};

const LogoLoader = ({ className = "", size = "md" }: LogoLoaderProps) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-background ${className}`}>
      <img
        src={iklickLogo}
        alt="iKlick Communications"
        className={`${sizeMap[size]} w-auto object-contain animate-pulse`}
        style={{ animation: "pulse 1.5s ease-in-out infinite" }}
      />
    </div>
  );
};

export default LogoLoader;