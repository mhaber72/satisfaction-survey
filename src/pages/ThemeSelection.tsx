import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import customerSupportImg from "@/assets/Customer_Support.png";
import corporatePerceptionImg from "@/assets/Corporate_Perception.png";
import itExpertiseImg from "@/assets/IT_Expertise.png";
import partnershipImg from "@/assets/Partnership.png";
import humanResourcesImg from "@/assets/Human_Ressources.png";
import operationalExcellenceImg from "@/assets/Operational_Excellence.png";
import innovationImg from "@/assets/Innovation_Project_Management.png";
import sustainableImg from "@/assets/Sustainable_Solutions.png";

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
  const [search, setSearch] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  const filtered = THEMES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen overflow-hidden select-none">
      {/* Deep oceanic background */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 120% 80% at 50% 50%, hsl(205,70%,18%) 0%, hsl(210,80%,10%) 50%, hsl(215,85%,6%) 100%)"
      }} />
      {/* Central glow */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsla(200,80%,40%,0.15) 0%, transparent 70%)"
      }} />
      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, hsla(215,90%,4%,0.6) 100%)"
      }} />
      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsla(200,80%,70%,1) 1px, transparent 1px), linear-gradient(90deg, hsla(200,80%,70%,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
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
          Automated Response Selection
        </h1>
        <p className="mb-10 text-center text-base text-[hsl(200,60%,70%)]">
          Seleccione un tema para explorar los datos
        </p>

        {/* Search Bar - glass pill */}
        <div className="mb-16 flex w-full max-w-md items-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-5 py-2 shadow-[0_4px_30px_hsla(200,80%,40%,0.12)] backdrop-blur-xl">
          <Search className="h-4 w-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 border-0 bg-transparent text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            className="rounded-md bg-white/20 px-4 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
            onClick={() => {
              if (filtered.length === 1)
                navigate(`/theme/${encodeURIComponent(filtered[0].key)}`);
            }}
          >
            Search
          </button>
        </div>

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
      className="group relative flex w-[200px] flex-col items-center gap-2 transition-transform duration-300"
      style={{ transform: isHovered ? "scale(1.08)" : "scale(1)" }}
    >
      {/* Custom image icon */}
      <div className="relative z-10 -mb-5">
        <div
          className="flex h-36 w-36 items-center justify-center rounded-full border overflow-hidden transition-all duration-300"
          style={{
            borderColor: isHovered ? "hsla(200,80%,60%,0.6)" : "hsla(200,80%,60%,0.25)",
            background: isHovered
              ? "linear-gradient(135deg, hsla(200,80%,45%,0.5), hsla(210,70%,30%,0.6))"
              : "linear-gradient(135deg, hsla(200,80%,40%,0.25), hsla(210,70%,25%,0.3))",
            boxShadow: isHovered
              ? "0 0 25px hsla(200,80%,50%,0.4), inset 0 1px 1px hsla(0,0%,100%,0.15)"
              : "0 0 10px hsla(200,80%,50%,0.1), inset 0 1px 1px hsla(0,0%,100%,0.08)",
          }}
        >
          <img
            src={theme.image}
            alt={theme.label}
            className="h-24 w-24 object-contain transition-all duration-300"
            style={{
              filter: isHovered ? "brightness(1.3)" : "brightness(1)",
            }}
          />
        </div>
      </div>

      {/* Oval pill label */}
      <div
        className="relative flex min-h-[52px] w-full items-center justify-center rounded-[28px] border px-4 pt-4 pb-3 transition-all duration-300"
        style={{
          borderColor: isHovered ? "hsla(200,80%,55%,0.45)" : "hsla(200,70%,50%,0.2)",
          background: isHovered
            ? "linear-gradient(180deg, hsla(200,70%,35%,0.4) 0%, hsla(210,60%,20%,0.5) 100%)"
            : "linear-gradient(180deg, hsla(200,70%,30%,0.2) 0%, hsla(210,60%,18%,0.25) 100%)",
          boxShadow: isHovered
            ? "0 8px 32px hsla(200,80%,40%,0.2), inset 0 1px 0 hsla(0,0%,100%,0.1)"
            : "0 4px 16px hsla(200,80%,30%,0.08), inset 0 1px 0 hsla(0,0%,100%,0.05)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span
          className="text-center text-[13px] font-semibold leading-tight transition-colors duration-300"
          style={{ color: isHovered ? "hsl(0,0%,100%)" : "hsl(200,40%,80%)" }}
        >
          {theme.label}
        </span>
      </div>
    </button>
  );
};

export default ThemeSelection;
