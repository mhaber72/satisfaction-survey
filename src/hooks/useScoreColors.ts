import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScoreColor {
  id: string;
  score: number;
  color: string;
}

export function useScoreColors() {
  const { data: scoreColors = [] } = useQuery<ScoreColor[]>({
    queryKey: ["score-colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_colors")
        .select("*")
        .order("score", { ascending: true });
      if (error) throw error;
      return data as ScoreColor[];
    },
  });

  const getColor = (score: number | null | undefined): string | null => {
    if (score == null) return null;
    const match = scoreColors.find((sc) => Number(sc.score) === Number(score));
    return match?.color ?? null;
  };

  return { scoreColors, getColor };
}
