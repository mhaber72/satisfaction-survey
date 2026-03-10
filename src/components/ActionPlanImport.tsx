import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ExcelJS from "exceljs";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActionPlanImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const EXPECTED_COLUMNS = [
  "pesquisa_id", "survey_year", "client_name", "theme", "theme_comment", "question_comment",
  "contract_manager", "regional_manager", "directory", "responsible",
  "action_name", "action_description", "status",
  "start_date", "end_date", "new_end_date", "completion_date",
];

const ActionPlanImport = ({ open, onOpenChange }: ActionPlanImportProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const { data: contractManagers } = useQuery({
    queryKey: ["contract_managers"],
    queryFn: async () => {
      const { data } = await supabase.from("contract_managers").select("*");
      return data || [];
    },
  });

  const { data: regionalManagers } = useQuery({
    queryKey: ["regional_managers"],
    queryFn: async () => {
      const { data } = await supabase.from("regional_managers").select("*");
      return data || [];
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["directories"],
    queryFn: async () => {
      const { data } = await supabase.from("directories").select("*");
      return data || [];
    },
  });

  const { data: responsibles } = useQuery({
    queryKey: ["action_responsibles"],
    queryFn: async () => {
      const { data } = await supabase.from("action_responsibles").select("*");
      return data || [];
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ["action_statuses"],
    queryFn: async () => {
      const { data } = await supabase.from("action_statuses").select("*");
      return data || [];
    },
  });

  const findByName = (list: { id: string; name: string }[] | undefined, name: string) => {
    if (!list || !name) return null;
    return list.find((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  };

  const findResponsible = (name: string) => {
    if (!responsibles || !name) return null;
    const trimmed = name.trim().toLowerCase();
    return responsibles.find((r) => {
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase().trim();
      return fullName === trimmed;
    }) || null;
  };

  const parseDate = (val: any): string | null => {
    if (!val) return null;
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    const str = String(val).trim();
    // DD/MM/YYYY
    const match = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
    // YYYY-MM-DD
    const match2 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match2) return str;
    return null;
  };

  const downloadTemplate = useCallback(async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Action Plans");

    ws.columns = EXPECTED_COLUMNS.map((col) => ({
      header: col,
      key: col,
      width: col === "action_description" ? 40 : col === "action_name" ? 25 : 20,
    }));

    // Style header
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    });

    // Add example row
    ws.addRow({
      pesquisa_id: 1,
      survey_year: 2025,
      client_name: "Example Client",
      theme: "Customer Support",
      theme_comment: "",
      question_comment: "",
      contract_manager: contractManagers?.[0]?.name || "Manager Name",
      regional_manager: regionalManagers?.[0]?.name || "Regional Name",
      directory: directories?.[0]?.name || "Directory Name",
      responsible: responsibles?.[0] ? `${responsibles[0].first_name} ${responsibles[0].last_name}` : "",
      action_name: "Action example",
      action_description: "Description of the action",
      status: statuses?.[0]?.name || "Status Name",
      start_date: "01/01/2025",
      end_date: "30/06/2025",
      new_end_date: "",
      completion_date: "",
    });

    // Add info sheet
    const infoWs = wb.addWorksheet("Field Reference");
    infoWs.columns = [
      { header: "Field", key: "field", width: 25 },
      { header: "Required", key: "required", width: 12 },
      { header: "Type", key: "type", width: 15 },
      { header: "Max Length", key: "maxLen", width: 12 },
      { header: "Notes", key: "notes", width: 60 },
    ];
    infoWs.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    });

    const fields = [
      { field: "pesquisa_id", required: "Yes", type: "Integer", maxLen: "-", notes: "Must exist in pesquisa_satisfacao table" },
      { field: "survey_year", required: "No", type: "Integer", maxLen: "-", notes: "e.g. 2024, 2025" },
      { field: "client_name", required: "No", type: "Text", maxLen: "-", notes: "Client name (informational)" },
      { field: "theme", required: "No", type: "Text", maxLen: "-", notes: "Theme name" },
      { field: "theme_comment", required: "No", type: "Text", maxLen: "-", notes: "Theme comment" },
      { field: "question_comment", required: "No", type: "Text", maxLen: "-", notes: "Question comment" },
      { field: "contract_manager", required: "Yes", type: "Text (name)", maxLen: "-", notes: `Exact match. Valid: ${contractManagers?.map((c) => c.name).join(", ") || "—"}` },
      { field: "regional_manager", required: "Yes", type: "Text (name)", maxLen: "-", notes: `Exact match. Valid: ${regionalManagers?.map((r) => r.name).join(", ") || "—"}` },
      { field: "directory", required: "Yes", type: "Text (name)", maxLen: "-", notes: `Exact match. Valid: ${directories?.map((d) => d.name).join(", ") || "—"}` },
      { field: "responsible", required: "No", type: "Text (full name)", maxLen: "-", notes: `Format: "First Last". Valid: ${responsibles?.map((r) => `${r.first_name} ${r.last_name}`).join(", ") || "—"}` },
      { field: "action_name", required: "Yes", type: "Text", maxLen: "100", notes: "Name of the action" },
      { field: "action_description", required: "Yes", type: "Text", maxLen: "250", notes: "Description of the action" },
      { field: "status", required: "Yes", type: "Text (name)", maxLen: "-", notes: `Exact match. Valid: ${statuses?.map((s) => s.name).join(", ") || "—"}` },
      { field: "start_date", required: "Conditional", type: "Date", maxLen: "-", notes: "DD/MM/YYYY. Required if status requires it" },
      { field: "end_date", required: "Conditional", type: "Date", maxLen: "-", notes: "DD/MM/YYYY. Required if status requires it" },
      { field: "new_end_date", required: "Conditional", type: "Date", maxLen: "-", notes: "DD/MM/YYYY. Required if status requires it" },
      { field: "completion_date", required: "Conditional", type: "Date", maxLen: "-", notes: "DD/MM/YYYY. Required if status requires it" },
    ];
    fields.forEach((f) => infoWs.addRow(f));

    // Lookup values sheet
    const lookupWs = wb.addWorksheet("Valid Values");
    lookupWs.columns = [
      { header: "Contract Managers", key: "cm", width: 30 },
      { header: "Regional Managers", key: "rm", width: 30 },
      { header: "Directories", key: "dir", width: 30 },
      { header: "Responsibles", key: "resp", width: 35 },
      { header: "Statuses", key: "st", width: 30 },
    ];
    lookupWs.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    });

    const maxRows = Math.max(
      contractManagers?.length || 0, regionalManagers?.length || 0,
      directories?.length || 0, responsibles?.length || 0, statuses?.length || 0
    );
    for (let i = 0; i < maxRows; i++) {
      lookupWs.addRow({
        cm: contractManagers?.[i]?.name || "",
        rm: regionalManagers?.[i]?.name || "",
        dir: directories?.[i]?.name || "",
        resp: responsibles?.[i] ? `${responsibles[i].first_name} ${responsibles[i].last_name}` : "",
        st: statuses?.[i]?.name || "",
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "action_plans_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [contractManagers, regionalManagers, directories, responsibles, statuses]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setErrors([]);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(data);
      const ws = wb.worksheets[0];

      const headers: string[] = [];
      ws.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim().toLowerCase();
      });

      const rows: Record<string, any>[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber - 1];
          if (key) obj[key] = cell.value;
        });
        rows.push(obj);
      });

      if (rows.length === 0) {
        toast({ title: t("importActions.noRows"), variant: "destructive" });
        setImporting(false);
        return;
      }

      // Validate all rows
      const validationErrors: ValidationError[] = [];
      const validRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number
        const rowErrors: ValidationError[] = [];

        // Required fields
        const pesquisaId = row.pesquisa_id != null ? Number(row.pesquisa_id) : null;
        if (!pesquisaId || isNaN(pesquisaId)) {
          rowErrors.push({ row: rowNum, field: "pesquisa_id", message: t("importActions.errRequired") });
        }

        const actionName = String(row.action_name ?? "").trim();
        if (!actionName) {
          rowErrors.push({ row: rowNum, field: "action_name", message: t("importActions.errRequired") });
        } else if (actionName.length > 100) {
          rowErrors.push({ row: rowNum, field: "action_name", message: t("importActions.errMaxLen", { max: 100 }) });
        }

        const actionDesc = String(row.action_description ?? "").trim();
        if (!actionDesc) {
          rowErrors.push({ row: rowNum, field: "action_description", message: t("importActions.errRequired") });
        } else if (actionDesc.length > 250) {
          rowErrors.push({ row: rowNum, field: "action_description", message: t("importActions.errMaxLen", { max: 250 }) });
        }

        // Lookups
        const cmName = String(row.contract_manager ?? "").trim();
        const cm = findByName(contractManagers, cmName);
        if (!cmName) {
          rowErrors.push({ row: rowNum, field: "contract_manager", message: t("importActions.errRequired") });
        } else if (!cm) {
          rowErrors.push({ row: rowNum, field: "contract_manager", message: t("importActions.errNotFound", { value: cmName }) });
        }

        const rmName = String(row.regional_manager ?? "").trim();
        const rm = findByName(regionalManagers, rmName);
        if (!rmName) {
          rowErrors.push({ row: rowNum, field: "regional_manager", message: t("importActions.errRequired") });
        } else if (!rm) {
          rowErrors.push({ row: rowNum, field: "regional_manager", message: t("importActions.errNotFound", { value: rmName }) });
        }

        const dirName = String(row.directory ?? "").trim();
        const dir = findByName(directories, dirName);
        if (!dirName) {
          rowErrors.push({ row: rowNum, field: "directory", message: t("importActions.errRequired") });
        } else if (!dir) {
          rowErrors.push({ row: rowNum, field: "directory", message: t("importActions.errNotFound", { value: dirName }) });
        }

        const statusName = String(row.status ?? "").trim();
        const status = findByName(statuses, statusName);
        if (!statusName) {
          rowErrors.push({ row: rowNum, field: "status", message: t("importActions.errRequired") });
        } else if (!status) {
          rowErrors.push({ row: rowNum, field: "status", message: t("importActions.errNotFound", { value: statusName }) });
        }

        // Optional responsible
        const respName = String(row.responsible ?? "").trim();
        let resp: any = null;
        if (respName) {
          resp = findResponsible(respName);
          if (!resp) {
            rowErrors.push({ row: rowNum, field: "responsible", message: t("importActions.errNotFound", { value: respName }) });
          }
        }

        // Conditional date validations
        const startDate = parseDate(row.start_date);
        const endDate = parseDate(row.end_date);
        const newEndDate = parseDate(row.new_end_date);
        const completionDate = parseDate(row.completion_date);

        if (row.start_date && !startDate) {
          rowErrors.push({ row: rowNum, field: "start_date", message: t("importActions.errInvalidDate") });
        }
        if (row.end_date && !endDate) {
          rowErrors.push({ row: rowNum, field: "end_date", message: t("importActions.errInvalidDate") });
        }
        if (row.new_end_date && !newEndDate) {
          rowErrors.push({ row: rowNum, field: "new_end_date", message: t("importActions.errInvalidDate") });
        }
        if (row.completion_date && !completionDate) {
          rowErrors.push({ row: rowNum, field: "completion_date", message: t("importActions.errInvalidDate") });
        }

        if (status) {
          if (status.requires_start_date && !startDate) {
            rowErrors.push({ row: rowNum, field: "start_date", message: t("importActions.errRequiredByStatus", { status: statusName }) });
          }
          if (status.requires_end_date && !endDate) {
            rowErrors.push({ row: rowNum, field: "end_date", message: t("importActions.errRequiredByStatus", { status: statusName }) });
          }
          if (status.requires_new_end_date && !newEndDate) {
            rowErrors.push({ row: rowNum, field: "new_end_date", message: t("importActions.errRequiredByStatus", { status: statusName }) });
          }
          if (status.requires_completion_date && !completionDate) {
            rowErrors.push({ row: rowNum, field: "completion_date", message: t("importActions.errRequiredByStatus", { status: statusName }) });
          }
        }

        if (rowErrors.length > 0) {
          validationErrors.push(...rowErrors);
        } else {
          validRows.push({
            pesquisa_id: pesquisaId,
            survey_year: row.survey_year != null ? Number(row.survey_year) : null,
            client_name: row.client_name ? String(row.client_name).trim() : null,
            theme: row.theme ? String(row.theme).trim() : null,
            theme_comment: row.theme_comment ? String(row.theme_comment).trim() : null,
            question_comment: row.question_comment ? String(row.question_comment).trim() : null,
            contract_manager_id: cm!.id,
            regional_manager_id: rm!.id,
            directory_id: dir!.id,
            responsible_id: resp?.id || null,
            action_name: actionName,
            action_description: actionDesc,
            status_id: status!.id,
            start_date: startDate,
            end_date: endDate,
            new_end_date: newEndDate,
            completion_date: completionDate,
            created_by: user?.id,
          });
        }
      }

      setErrors(validationErrors);

      if (validRows.length > 0) {
        const batchSize = 50;
        let inserted = 0;
        for (let i = 0; i < validRows.length; i += batchSize) {
          const batch = validRows.slice(i, i + batchSize);
          const { error } = await supabase.from("action_plans").insert(batch);
          if (error) throw error;
          inserted += batch.length;
        }
        await qc.invalidateQueries({ queryKey: ["all_action_plans"], refetchType: "all" });
        await qc.refetchQueries({ queryKey: ["all_action_plans"] });
        setImportResult({ success: inserted, failed: validationErrors.length > 0 ? rows.length - validRows.length : 0 });
      } else if (validationErrors.length > 0) {
        setImportResult({ success: 0, failed: rows.length });
      }
    } catch (err: any) {
      toast({ title: t("importActions.importError"), description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, [contractManagers, regionalManagers, directories, responsibles, statuses, user, qc, t]);

  const handleClose = (open: boolean) => {
    if (!open) {
      setErrors([]);
      setImportResult(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("importActions.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{t("importActions.templateInfo")}</p>
                <p className="mt-1 text-muted-foreground">{t("importActions.templateDesc")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                {t("importActions.downloadTemplate")}
              </Button>
            </div>
          </div>

          {/* Upload */}
          <div className="flex items-center gap-3">
            <label>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={importing} />
              <Button asChild disabled={importing}>
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? t("importActions.importing") : t("importActions.importExcel")}
                </span>
              </Button>
            </label>
          </div>

          {/* Result summary */}
          {importResult && (
            <div className="rounded-md border p-4 space-y-2">
              {importResult.success > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("importActions.successCount", { count: importResult.success })}
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4" />
                  {t("importActions.failedCount", { count: importResult.failed })}
                </div>
              )}
            </div>
          )}

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("importActions.validationErrors", { count: errors.length })}
              </div>
              <ScrollArea className="max-h-[200px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="p-1 text-left font-medium">{t("importActions.row")}</th>
                      <th className="p-1 text-left font-medium">{t("importActions.field")}</th>
                      <th className="p-1 text-left font-medium">{t("importActions.error")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-1">{err.row}</td>
                        <td className="p-1 font-mono">{err.field}</td>
                        <td className="p-1">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          {/* Column reference */}
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="font-medium text-sm mb-2">{t("importActions.expectedColumns")}</p>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {EXPECTED_COLUMNS.join(", ")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionPlanImport;
