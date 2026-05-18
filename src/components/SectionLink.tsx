import { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface SectionLinkProps {
  hash: string; // e.g. "#services"
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const SectionLink = ({ hash, className, children, onClick }: SectionLinkProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = hash.replace(/^#/, "");
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `/#${id}`);
    } else {
      navigate(`/#${id}`);
    }
    onClick?.();
  };

  return (
    <a href={`/#${hash.replace(/^#/, "")}`} className={className} onClick={handleClick}>
      {children}
    </a>
  );
};

export default SectionLink;