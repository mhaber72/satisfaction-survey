import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import customerSupportImg from "@/assets/Customer_Support.png";
import corporatePerceptionImg from "@/assets/Corporate_Perception.png";
import itExpertiseImg from "@/assets/IT_Expertise.png";
import partnershipImg from "@/assets/Partnership.png";
import humanResourcesImg from "@/assets/Human_Ressources.png";
import operationalExcellenceImg from "@/assets/Operational_Excellence.png";
import innovationImg from "@/assets/Innovation_Project_Management.png";
import sustainableImg from "@/assets/Sustainable_Solutions.png";
import logoIdl from "@/assets/logo-idl.png";

const THEMES = [
  { key: "ACCOMPAGNEMENT CLIENT", label: "Customer Support", image: customerSupportImg },
  { key: "CORPORATE PERCEPTION", label: "Corporate Perception", image: corporatePerceptionImg },
  { key: "EXPERTISE INFORMATIQUE", label: "IT Expertise", image: itExpertiseImg },
  { key: "PARTENAIRE", label: "Partnership", image: partnershipImg },
  { key: "Ressources Humaines", label: "Human Resources", image: humanResourcesImg },
  { key: "EXCELLENCE OPÉRATIONNELLE", label: "Operational Excellence", image: operationalExcellenceImg },
  { key: "GESTION DE PROJETS ET INNOVATION", label: "Innovation & Project Management", image: innovationImg },
  { key: "SOLUTIONS DURABLES", label: "Sustainable Solutions", image: sustainableImg },
];

const ThemeSelection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const { isAdmin, allowedThemes } = useAuth();

  // Admin sees all; users see only allowed themes
  const filtered = isAdmin
    ? THEMES
    : THEMES.filter((t) => allowedThemes.includes(t.key));

  return (
    <div className="relative min-h-screen overflow-hidden select-none">
      {/* Deep blue radial gradient background */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 130% 80% at 50% 30%, hsl(205,75%,25%) 0%, hsl(210,80%,14%) 40%, hsl(215,85%,8%) 100%)"
      }} />
      {/* Top-center bright glow */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 40% at 50% 20%, hsla(200,85%,55%,0.2) 0%, transparent 70%)"
      }} />
      {/* Diagonal futuristic light streaks */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
        <line x1="0%" y1="100%" x2="35%" y2="0%" stroke="hsl(200,80%,50%)" strokeWidth="1.5" />
        <line x1="5%" y1="100%" x2="40%" y2="0%" stroke="hsl(200,80%,50%)" strokeWidth="0.8" />
        <line x1="55%" y1="100%" x2="90%" y2="0%" stroke="hsl(200,80%,50%)" strokeWidth="1.5" />
        <line x1="60%" y1="100%" x2="95%" y2="0%" stroke="hsl(200,80%,50%)" strokeWidth="0.8" />
        <line x1="25%" y1="100%" x2="60%" y2="0%" stroke="hsl(195,70%,45%)" strokeWidth="0.5" />
        <line x1="75%" y1="100%" x2="110%" y2="0%" stroke="hsl(195,70%,45%)" strokeWidth="0.5" />
        <line x1="-5%" y1="80%" x2="20%" y2="0%" stroke="hsl(200,80%,50%)" strokeWidth="0.4" />
        <line x1="85%" y1="100%" x2="105%" y2="20%" stroke="hsl(200,80%,50%)" strokeWidth="0.4" />
      </svg>
      {/* Curved arc lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.25]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 600">
        <ellipse cx="500" cy="550" rx="650" ry="300" fill="none" stroke="hsl(200,70%,45%)" strokeWidth="1" />
        <ellipse cx="500" cy="600" rx="550" ry="260" fill="none" stroke="hsl(200,70%,45%)" strokeWidth="0.7" />
        <ellipse cx="500" cy="650" rx="450" ry="220" fill="none" stroke="hsl(200,70%,45%)" strokeWidth="0.5" />
        <ellipse cx="200" cy="100" rx="300" ry="200" fill="none" stroke="hsl(200,70%,40%)" strokeWidth="0.4" />
        <ellipse cx="800" cy="150" rx="250" ry="180" fill="none" stroke="hsl(200,70%,40%)" strokeWidth="0.3" />
      </svg>
      {/* Dot grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.25]" style={{
        backgroundImage: "radial-gradient(circle, hsla(200,80%,65%,1) 1.2px, transparent 1.2px)",
        backgroundSize: "28px 28px"
      }} />
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, hsla(215,90%,4%,0.7) 100%)"
      }} />
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full bg-[hsl(200,80%,60%)]"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            opacity: 0.1 + Math.random() * 0.2,
            animation: `pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Logo top-left */}
      <img src={logoIdl} alt="IDL Logo" className="absolute left-20 top-12 z-20 h-24 w-auto" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10">
        {/* Header decoration */}
        <div className="mb-2 flex items-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(200,70%,50%)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(200,70%,60%)]">
            Survey Analytics
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(200,70%,50%)]" />
        </div>

        <h1 className="mb-1 text-center text-4xl font-bold tracking-tight text-white md:text-5xl"
          style={{ textShadow: "0 0 40px hsla(200,80%,50%,0.3)" }}
        >
          Customer Satisfaction Survey
        </h1>
        <p className="mb-10 text-center text-base text-[hsl(200,60%,70%)]">
          Seleccione un tema para explorar los datos
        </p>


        {/* Theme Bubbles - dispersed layout with more spacing */}
        <div className="flex w-full max-w-5xl flex-col items-center gap-14">
          {/* Row 1: 3 items */}
          <div className="flex flex-wrap justify-center gap-16">
            {filtered.slice(0, 3).map((theme, i) => (
              <ThemeBubble
                key={theme.key}
                theme={theme}
                isHovered={hoveredIdx === i}
                onHover={() => setHoveredIdx(i)}
                onLeave={() => setHoveredIdx(null)}
                onClick={() => navigate(`/theme/${encodeURIComponent(theme.key)}`)}
              />
            ))}
          </div>
          {/* Row 2: 3 items */}
          <div className="flex flex-wrap justify-center gap-16">
            {filtered.slice(3, 6).map((theme, i) => (
              <ThemeBubble
                key={theme.key}
                theme={theme}
                isHovered={hoveredIdx === i + 3}
                onHover={() => setHoveredIdx(i + 3)}
                onLeave={() => setHoveredIdx(null)}
                onClick={() => navigate(`/theme/${encodeURIComponent(theme.key)}`)}
              />
            ))}
          </div>
          {/* Row 3: 2 items */}
          <div className="flex flex-wrap justify-center gap-16">
            {filtered.slice(6, 8).map((theme, i) => (
              <ThemeBubble
                key={theme.key}
                theme={theme}
                isHovered={hoveredIdx === i + 6}
                onHover={() => setHoveredIdx(i + 6)}
                onLeave={() => setHoveredIdx(null)}
                onClick={() => navigate(`/theme/${encodeURIComponent(theme.key)}`)}
              />
            ))}
          </div>
        </div>

        {/* View all link */}
        <button
          className="mt-12 text-sm text-[hsl(200,60%,65%)] underline-offset-4 transition hover:text-white hover:underline"
          onClick={() => navigate("/dashboard")}
        >
          Ver todos los datos →
        </button>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

/* --- Oval bubble component (like the reference image) --- */
interface ThemeBubbleProps {
  theme: { key: string; label: string; image: string };
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const ThemeBubble = ({ theme, isHovered, onHover, onLeave, onClick }: ThemeBubbleProps) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="group relative flex w-[280px] flex-col items-center transition-transform duration-300"
      style={{ transform: isHovered ? "scale(1.08)" : "scale(1)" }}
    >
      {/* Ellipse with icon + label together */}
      <div
        className="flex h-[180px] w-[280px] flex-col items-center justify-center gap-1 overflow-hidden transition-all duration-300"
        style={{
          borderRadius: "50%",
          border: `1px solid ${isHovered ? "hsla(200,80%,60%,0.6)" : "hsla(200,80%,60%,0.25)"}`,
          background: isHovered
            ? "linear-gradient(180deg, hsla(200,80%,45%,0.5), hsla(210,70%,30%,0.6))"
            : "linear-gradient(180deg, hsla(200,80%,40%,0.2), hsla(210,70%,25%,0.25))",
          boxShadow: isHovered
            ? "0 0 25px hsla(200,80%,50%,0.4), inset 0 1px 1px hsla(0,0%,100%,0.15)"
            : "0 0 10px hsla(200,80%,50%,0.1), inset 0 1px 1px hsla(0,0%,100%,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <img
          src={theme.image}
          alt={theme.label}
          className="h-32 w-32 object-contain transition-all duration-300"
          style={{ filter: isHovered ? "brightness(1.3)" : "brightness(1)" }}
        />
        <span
          className="relative z-10 text-center text-[16px] font-bold leading-tight transition-colors duration-300 px-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          style={{ color: isHovered ? "hsl(0,0%,100%)" : "hsl(200,40%,80%)" }}
        >
          {theme.label}
        </span>
      </div>
    </button>
  );
};

export default ThemeSelection;
