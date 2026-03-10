import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ClipboardPlus, List } from "lucide-react";
import { useTranslatedQuestions } from "@/hooks/useTranslatedQuestions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ActionPlanForm from "./ActionPlanForm";
import ActionPlanList from "./ActionPlanList";

interface RowDetailDialogProps {
  row: Record<string, any> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_ORDER = [
  "client_name", "firstname", "lastname", "country", "contact", "type", "activity", "context",
  "survey_year", "answered", "answer_delay", "progress", "theme", "theme_comment",
  "question", "applicability", "importance", "score", "question_comment",
];

const RowDetailDialog = ({ row, open, onOpenChange }: RowDetailDialogProps) => {
  const { t } = useTranslation();
  const { translateQuestion } = useTranslatedQuestions();
  const { isAdmin, isSuperUser } = useAuth();
  const canCreateActionPlan = isAdmin || isSuperUser;
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [showListActions, setShowListActions] = useState(false);

  if (!row) return null;

  const labelMap: Record<string, string> = {
    client_name: t("dashboard.client"),
    firstname: t("rowDetail.firstname", "First Name"),
    lastname: t("rowDetail.lastname", "Last Name"),
    country: t("rowDetail.country", "Country"),
    contact: t("rowDetail.contact", "Contact"),
    type: t("rowDetail.type", "Type"),
    activity: t("rowDetail.activity", "Activity"),
    context: t("rowDetail.context", "Context"),
    survey_year: t("rowDetail.surveyYear", "Survey Year"),
    answered: t("rowDetail.answered", "Answered"),
    answer_delay: t("rowDetail.answerDelay", "Answer Delay"),
    progress: t("rowDetail.progress", "Progress"),
    theme: t("dashboard.theme"),
    theme_comment: t("dashboard.themeComment"),
    question: t("dashboard.question"),
    applicability: t("dashboard.applicability"),
    importance: t("dashboard.importance"),
    score: t("dashboard.score"),
    question_comment: t("dashboard.questionComment"),
  };

  const fields = FIELD_ORDER.filter((key) => key in row);

  return (
    <>
      <Dialog open={open && !showCreateAction && !showListActions} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t("rowDetail.title", "Record Details")}</DialogTitle>
              <div className="flex gap-2 mr-6">
                {canCreateActionPlan && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setShowCreateAction(true)}>
                        <ClipboardPlus className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("actionPlan.createTitle")}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setShowListActions(true)}>
                      <List className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("actionPlan.listTitle")}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm">
            {fields.map((key) => (
              <div key={key} className="contents">
                <span className="font-medium text-muted-foreground truncate">{labelMap[key] ?? key}</span>
                <span className="text-foreground break-words">
                  {key === "question"
                    ? translateQuestion(row[key]) || "—"
                    : (row[key] != null && row[key] !== "" ? String(row[key]) : "—")}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ActionPlanForm
        open={showCreateAction}
        onOpenChange={setShowCreateAction}
        pesquisaId={row.id}
        surveyYear={row.survey_year}
        clientName={row.client_name}
        theme={row.theme}
        themeComment={row.theme_comment}
        questionComment={row.question_comment}
      />

      <ActionPlanList
        open={showListActions}
        onOpenChange={setShowListActions}
        pesquisaId={row.id}
        surveyYear={row.survey_year}
        clientName={row.client_name}
        theme={row.theme}
        themeComment={row.theme_comment}
        questionComment={row.question_comment}
      />
    </>
  );
};

export default RowDetailDialog;
