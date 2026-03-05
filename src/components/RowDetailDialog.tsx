import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface RowDetailDialogProps {
  row: Record<string, any> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_ORDER = [
  "client_name",
  "firstname",
  "lastname",
  "country",
  "contact",
  "type",
  "activity",
  "context",
  "survey_year",
  "answered",
  "answer_delay",
  "progress",
  "theme",
  "theme_comment",
  "question",
  "applicability",
  "importance",
  "score",
  "question_comment",
];

const RowDetailDialog = ({ row, open, onOpenChange }: RowDetailDialogProps) => {
  const { t } = useTranslation();

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("rowDetail.title", "Record Details")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm">
          {fields.map((key) => (
            <div key={key} className="contents">
              <span className="font-medium text-muted-foreground truncate">{labelMap[key] ?? key}</span>
              <span className="text-foreground break-words">
                {row[key] != null && row[key] !== "" ? String(row[key]) : "—"}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RowDetailDialog;
