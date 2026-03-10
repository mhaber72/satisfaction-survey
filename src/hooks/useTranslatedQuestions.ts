import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface SurveyQuestion {
  question_fr: string;
  question_en: string;
  question_pt: string;
  question_es: string;
}

const langFieldMap: Record<string, keyof SurveyQuestion> = {
  fr: "question_fr",
  en: "question_en",
  pt: "question_pt",
  es: "question_es",
};

export function useTranslatedQuestions() {
  const { i18n } = useTranslation();

  const { data: questions = [] } = useQuery({
    queryKey: ["survey-questions-translations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("survey_questions")
        .select("question_fr, question_en, question_pt, question_es");
      if (error) throw error;
      return data as SurveyQuestion[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const map = useMemo(() => {
    const m = new Map<string, SurveyQuestion>();
    for (const q of questions) {
      if (!m.has(q.question_fr)) {
        m.set(q.question_fr, q);
      }
    }
    return m;
  }, [questions]);

  const translateQuestion = useMemo(() => {
    const lang = i18n.language?.substring(0, 2) ?? "fr";
    const field = langFieldMap[lang] ?? "question_fr";

    return (originalQuestion: string | null | undefined): string => {
      if (!originalQuestion) return "";
      const entry = map.get(originalQuestion);
      if (!entry) return originalQuestion;
      const translated = entry[field];
      return translated || originalQuestion;
    };
  }, [map, i18n.language]);

  return { translateQuestion };
}
