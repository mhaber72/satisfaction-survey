import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoIdl from "@/assets/logo-idl-dark.png";

interface Props {
  surveyYear: number | null;
}

export default function BookCustomersPage({ surveyYear }: Props) {
  // Fetch distinct client_names for the selected year
  const { data: surveyClients } = useQuery({
    queryKey: ["book-survey-clients", surveyYear],
    queryFn: async () => {
      const allRows: { client_name: string | null }[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        let query = supabase
          .from("pesquisa_satisfacao")
          .select("client_name")
          .range(from, from + PAGE_SIZE - 1);
        if (surveyYear) {
          query = query.eq("survey_year", surveyYear);
        }
        const { data, error } = await query;
        if (error) throw error;
        allRows.push(...(data || []));
        hasMore = (data?.length || 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }
      const unique = new Set(
        allRows.map((r) => r.client_name?.trim()).filter(Boolean)
      );
      return Array.from(unique) as string[];
    },
  });

  // Fetch all registered clients with verticals
  const { data: clients } = useQuery({
    queryKey: ["book-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, verticals(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Match survey client names to registered clients & group by vertical
  const grouped = (() => {
    if (!surveyClients || !clients) return {};
    const nameSet = new Set(surveyClients.map((n) => n.toLowerCase()));
    const matched = clients.filter((c) =>
      nameSet.has(c.name.toLowerCase())
    );
    const groups: Record<string, typeof matched> = {};
    for (const c of matched) {
      const vertName = (c as any).verticals?.name || "Others";
      if (!groups[vertName]) groups[vertName] = [];
      groups[vertName].push(c);
    }
    return groups;
  })();

  const verticalNames = Object.keys(grouped).sort();
  const totalClients = Object.values(grouped).flat().length;

  // Dynamic sizing based on number of groups and clients
  const isLarge = totalClients > 20;
  const logoMaxH = isLarge ? "max-h-8" : "max-h-10";
  const logoMaxW = isLarge ? "max-w-[90px]" : "max-w-[120px]";
  const gap = isLarge ? "gap-2" : "gap-3";

  return (
    <div className="flex h-full w-full flex-col bg-white text-[hsl(215,85%,15%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-[hsl(210,30%,90%)]">
        <div>
          <h2 className="text-3xl font-extrabold uppercase tracking-tight">
            Customers {surveyYear || ""}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-[hsl(0,85%,45%)] uppercase tracking-wide">
              BRAZIL
            </p>
            <div className="h-[3px] w-6 bg-[hsl(0,85%,45%)] rounded-full" />
          </div>
        </div>
        <img src={logoIdl} alt="ID Logistics" className="h-10 object-contain" />
      </div>

      {/* Content — verticals grid */}
      <div className="flex-1 overflow-hidden px-8 py-5">
        {verticalNames.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[hsl(200,20%,55%)]">
            No clients found for this year
          </div>
        ) : (
          <div className={`grid ${verticalNames.length <= 3 ? "grid-cols-3" : verticalNames.length <= 4 ? "grid-cols-4" : "grid-cols-3"} ${gap} h-full auto-rows-fr`}>
            {verticalNames.map((vertName) => {
              const items = grouped[vertName];
              return (
                <div
                  key={vertName}
                  className="flex flex-col rounded-xl border-2 border-[hsl(210,60%,75%)] overflow-hidden"
                >
                  {/* Vertical title */}
                  <div className="bg-white border-b border-[hsl(210,30%,90%)] px-3 py-2 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[hsl(215,85%,15%)]">
                      {vertName}
                    </span>
                  </div>
                  {/* Logos */}
                  <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-3 p-3">
                    {items.map((client) => (
                      <div key={client.id} className="flex items-center justify-center">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className={`${logoMaxH} ${logoMaxW} object-contain`}
                          />
                        ) : (
                          <span className="text-xs font-semibold text-[hsl(215,85%,25%)] bg-[hsl(210,30%,95%)] rounded px-2 py-1">
                            {client.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative dots top-right */}
      <div className="absolute top-4 right-4 grid grid-cols-5 gap-1.5 opacity-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-[hsl(200,30%,70%)]" />
        ))}
      </div>
    </div>
  );
}
