import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Headphones,
  Building2,
  Cpu,
  Handshake,
  Users,
  Settings,
  Lightbulb,
  Leaf,
  Search,
} from "lucide-react";

const THEMES = [
  { key: "ACCOMPAGNEMENT CLIENT", label: "Customer Support", icon: Headphones },
  { key: "CORPORATE PERCEPTION", label: "Corporate Perception", icon: Building2 },
  { key: "EXPERTISE INFORMATIQUE", label: "IT Expertise", icon: Cpu },
  { key: "PARTENAIRE", label: "Partnership", icon: Handshake },
  { key: "Ressources Humaines", label: "Human Resources", icon: Users },
  { key: "EXCELLENCE OPÉRATIONNELLE", label: "Operational Excellence", icon: Settings },
  { key: "GESTION DE PROJETS ET INNOVATION", label: "Innovation & Project Management", icon: Lightbulb },
  { key: "SOLUTIONS DURABLES", label: "Sustainable Solutions", icon: Leaf },
];

const ThemeSelection = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = THEMES.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(210,80%,15%)] via-[hsl(210,70%,25%)] to-[hsl(200,60%,30%)]">
      {/* Decorative glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-[hsl(200,80%,50%)] opacity-10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[hsl(190,70%,40%)] opacity-10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        {/* Title */}
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-white md:text-5xl">
          Análises Pesquisa de Satisfação
        </h1>
        <p className="mb-10 text-center text-lg text-white/60">
          Seleccione un tema para filtrar los datos
        </p>

        {/* Search Bar */}
        <div className="mb-12 flex w-full max-w-lg items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 backdrop-blur-md">
          <Search className="h-5 w-5 text-white/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search themes..."
            className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            size="sm"
            className="rounded-full bg-white/20 text-white hover:bg-white/30"
            onClick={() => {
              if (filtered.length === 1) {
                navigate(`/theme/${encodeURIComponent(filtered[0].key)}`);
              }
            }}
          >
            Search
          </Button>
        </div>

        {/* Theme Grid */}
        <div className="grid w-full max-w-4xl grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((theme) => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.key}
                onClick={() => navigate(`/theme/${encodeURIComponent(theme.key)}`)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-8 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_40px_hsl(200,80%,50%,0.15)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all group-hover:border-white/40 group-hover:bg-white/20 group-hover:shadow-[0_0_20px_hsl(200,80%,60%,0.3)]">
                  <Icon className="h-8 w-8 text-white/80 transition-colors group-hover:text-white" />
                </div>
                <span className="text-center text-sm font-medium leading-tight text-white/80 group-hover:text-white">
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* View All button */}
        <Button
          variant="outline"
          className="mt-10 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={() => navigate("/dashboard")}
        >
          Ver todos los datos →
        </Button>
      </div>
    </div>
  );
};

export default ThemeSelection;
