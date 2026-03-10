import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import logoIdl from "@/assets/logo-idl.png";
import coverWarehouse from "@/assets/cover-warehouse-clean.jpg";

/* ─── Sample page components ─── */
function CoverPage() {
  return (
    <div className="relative flex h-full w-full bg-white overflow-hidden">
      {/* Left side content */}
      <div className="relative z-10 flex flex-col w-[50%] px-10 py-8">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <img src={logoIdl} alt="ID Logistics" className="h-16 object-contain" style={{ maxWidth: '60px' }} />
          <span className="text-3xl font-extrabold tracking-tight text-[hsl(215,85%,15%)]">
            <span className="text-[hsl(215,85%,15%)]">LOGISTICS</span>
          </span>
        </div>

        {/* Title block */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-[hsl(215,85%,15%)] uppercase">
            Customer Satisfaction<br />Survey Analysis
          </h1>
          <div className="mt-6">
            <p className="text-lg font-bold text-[hsl(0,85%,45%)] uppercase tracking-wide">
              BRAZIL
            </p>
            <div className="mt-1 h-[3px] w-10 bg-[hsl(200,80%,50%)] rounded-full" />
          </div>
        </div>

        {/* Decorative dots bottom-left */}
        <div className="absolute bottom-6 left-6 grid grid-cols-5 gap-2 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-[hsl(200,30%,70%)]" />
          ))}
        </div>
      </div>

      {/* Right side - warehouse image with curved edge */}
      <div className="absolute right-0 top-0 bottom-0 w-[52%]">
        {/* Curved dark border on left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10"
          style={{
            background: "linear-gradient(to right, hsl(215,30%,20%), transparent)",
            borderRadius: "50% 0 0 50% / 100% 0 0 100%",
          }}
        />
        <img
          src={coverWarehouse}
          alt="Warehouse"
          className="h-full w-full object-cover object-center"
          style={{
            borderRadius: "40% 0 0 40% / 50% 0 0 50%",
          }}
        />
      </div>
    </div>
  );
}

function PlaceholderPage({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex h-full flex-col bg-white text-[hsl(215,85%,15%)]">
      {/* Header */}
      <div className="border-b border-[hsl(210,30%,90%)] px-10 py-6">
        <p className="text-sm font-medium text-[hsl(200,40%,50%)] uppercase tracking-wider">
          Página {number}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-[hsl(215,85%,15%)]">{title}</h2>
      </div>
      {/* Body */}
      <div className="flex flex-1 items-center justify-center px-10 py-8">
        <div className="text-center space-y-4">
          <div className="mx-auto h-48 w-80 rounded-xl border-2 border-dashed border-[hsl(210,30%,85%)] flex items-center justify-center">
            <span className="text-[hsl(200,20%,55%)] text-sm">{description}</span>
          </div>
          <p className="text-sm text-[hsl(200,20%,60%)]">
            Defina o conteúdo desta página
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Pages definition ─── */
const PAGES = [
  { component: <CoverPage /> },
  { component: <PlaceholderPage number={1} title="Visão Geral" description="KPIs e métricas principais" /> },
  { component: <PlaceholderPage number={2} title="NPS por Cliente" description="Gráfico de barras NPS" /> },
  { component: <PlaceholderPage number={3} title="Satisfação por Tema" description="Radar ou gráficos comparativos" /> },
  { component: <PlaceholderPage number={4} title="Planos de Ação" description="Tabela resumo de status" /> },
  { component: <PlaceholderPage number={5} title="Conclusões" description="Texto e imagens" /> },
];

/* ─── Main Book Board ─── */
export default function BookBoard() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);

  const totalPages = PAGES.length;

  const goNext = useCallback(() => {
    if (currentPage >= totalPages - 1 || flipping) return;
    setFlipping("next");
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setFlipping(null);
    }, 600);
  }, [currentPage, totalPages, flipping]);

  const goPrev = useCallback(() => {
    if (currentPage <= 0 || flipping) return;
    setFlipping("prev");
    setTimeout(() => {
      setCurrentPage((p) => p - 1);
      setFlipping(null);
    }, 600);
  }, [currentPage, flipping]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    },
    [goNext, goPrev]
  );

  const nextPageIndex = currentPage + 1 < totalPages ? currentPage + 1 : null;
  const prevPageIndex = currentPage - 1 >= 0 ? currentPage - 1 : null;

  return (
    <div
      className="min-h-screen bg-[hsl(210,60%,95%)] flex flex-col items-center justify-center p-4 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Book container */}
      <div className="relative w-full max-w-[72rem] px-16" style={{ perspective: "2000px" }}>
        {/* Page counter */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-3">
          <span className="text-sm text-[hsl(200,20%,40%)]">
            {currentPage + 1} / {totalPages}
          </span>
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {PAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => !flipping && setCurrentPage(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  i === currentPage
                    ? "bg-[hsl(200,80%,60%)] scale-125"
                    : "bg-[hsl(200,20%,80%)] hover:bg-[hsl(200,30%,60%)]"
                )}
              />
            ))}
          </div>
        </div>

        {/* Book spread */}
        <div
          className="relative mx-auto overflow-hidden rounded-2xl shadow-2xl shadow-black/20"
          style={{ aspectRatio: "3/2.3" }}
        >
          {/* Current page (base layer) */}
          <div className="absolute inset-0 z-10">
            {PAGES[currentPage].component}
          </div>

          {/* Next page (underneath, visible when flipping forward) */}
          {flipping === "next" && nextPageIndex !== null && (
            <div className="absolute inset-0 z-0">
              {PAGES[nextPageIndex].component}
            </div>
          )}

          {/* Previous page (underneath, visible when flipping backward) */}
          {flipping === "prev" && prevPageIndex !== null && (
            <div className="absolute inset-0 z-0">
              {PAGES[prevPageIndex].component}
            </div>
          )}

          {/* Flip overlay — the animated page that peels away */}
          {flipping === "next" && (
            <div
              className="absolute inset-0 z-20 origin-left"
              style={{
                animation: "page-flip-next 0.6s ease-in-out forwards",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {PAGES[currentPage].component}
              {/* Shadow on the folding page */}
              <div
                className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent"
                style={{ animation: "page-shadow-in 0.6s ease-in-out forwards" }}
              />
            </div>
          )}

          {flipping === "prev" && (
            <div
              className="absolute inset-0 z-20 origin-right"
              style={{
                animation: "page-flip-prev 0.6s ease-in-out forwards",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {prevPageIndex !== null && PAGES[prevPageIndex].component}
              <div
                className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"
                style={{ animation: "page-shadow-in 0.6s ease-in-out forwards" }}
              />
            </div>
          )}

          {/* Page fold shadow on the book surface */}
          {flipping && (
            <div
              className="absolute inset-y-0 z-30 w-8 pointer-events-none"
              style={{
                left: flipping === "next" ? undefined : 0,
                right: flipping === "next" ? 0 : undefined,
                background: flipping === "next"
                  ? "linear-gradient(to left, rgba(0,0,0,0.3), transparent)"
                  : "linear-gradient(to right, rgba(0,0,0,0.3), transparent)",
                animation: "page-crease 0.6s ease-in-out forwards",
              }}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0 || !!flipping}
          className={cn(
            "absolute left-[-22px] top-1/2 -translate-y-1/2 z-40",
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-[hsl(215,85%,12%,0.05)] border border-[hsl(215,85%,12%,0.15)]",
            "text-[hsl(215,85%,20%)] hover:bg-[hsl(215,85%,12%,0.1)]",
            "transition-all duration-200",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={goNext}
          disabled={currentPage === totalPages - 1 || !!flipping}
          className={cn(
            "absolute right-[-22px] top-1/2 -translate-y-1/2 z-40",
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-[hsl(215,85%,12%,0.05)] border border-[hsl(215,85%,12%,0.15)]",
            "text-[hsl(215,85%,20%)] hover:bg-[hsl(215,85%,12%,0.1)]",
            "transition-all duration-200",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-6 text-xs text-[hsl(200,20%,40%)]">
        ← → Use as setas do teclado para navegar
      </p>

      {/* CSS Animations */}
      <style>{`
        @keyframes page-flip-next {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }

        @keyframes page-flip-prev {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(180deg);
          }
        }

        @keyframes page-shadow-in {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes page-crease {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
