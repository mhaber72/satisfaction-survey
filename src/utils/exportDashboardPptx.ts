import PptxGenJS from "pptxgenjs";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ActionPlan {
  id: string;
  action_name: string;
  action_description: string;
  client_name: string | null;
  theme: string | null;
  status_id: string;
  survey_year: number | null;
  start_date: string | null;
  end_date: string | null;
  new_end_date: string | null;
  completion_date: string | null;
  contract_managers: { name: string } | null;
  action_statuses: { name: string; color: string } | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

const BG_COLOR = "0d1f3c";
const TEXT_COLOR = "FFFFFF";
const MUTED_COLOR = "94a3b8";
const HEADER_BG = "1a3a5c";

function hexFromCss(color: string): string {
  return color.replace("#", "").substring(0, 6);
}

function fmtDate(d: string | null): string {
  return d ? format(new Date(d), "dd/MM/yyyy") : "—";
}

function getCompletionData(plans: ActionPlan[]) {
  const total = plans.length;
  const pending = plans.filter((p) => !p.completion_date).length;
  const onTime = plans.filter((p) => {
    if (!p.completion_date) return false;
    const comp = new Date(p.completion_date);
    const deadline = p.new_end_date ? new Date(p.new_end_date) : p.end_date ? new Date(p.end_date) : null;
    return deadline ? comp <= deadline : false;
  }).length;
  const late = plans.filter((p) => {
    if (!p.completion_date) return false;
    const comp = new Date(p.completion_date);
    const deadline = p.new_end_date ? new Date(p.new_end_date) : p.end_date ? new Date(p.end_date) : null;
    return deadline ? comp > deadline : false;
  }).length;
  return { total, pending, onTime, late };
}

export function exportDashboardPptx(plans: ActionPlan[], statuses: Status[]) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
  pptx.author = "IDL Dashboard";
  pptx.title = "Action Plans Dashboard";

  const clients = [...new Set(plans.map((p) => p.client_name).filter(Boolean))].sort() as string[];

  clients.forEach((clientName) => {
    const clientPlans = plans.filter((p) => p.client_name === clientName);
    const slide = pptx.addSlide();
    slide.background = { color: BG_COLOR };

    // Title
    slide.addText(clientName, {
      x: 0.4,
      y: 0.2,
      w: 12,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: TEXT_COLOR,
    });

    // --- KPIs row ---
    const total = clientPlans.length;
    const statusBreakdown: Record<string, number> = {};
    clientPlans.forEach((p) => {
      statusBreakdown[p.status_id] = (statusBreakdown[p.status_id] || 0) + 1;
    });

    // Total box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.4,
      y: 0.85,
      w: 1.2,
      h: 0.8,
      fill: { color: "1e3a5f" },
      line: { color: "3b5998", width: 1 },
      rectRadius: 0.05,
    });
    slide.addText("PROJETOS", {
      x: 0.4,
      y: 0.85,
      w: 1.2,
      h: 0.35,
      fontSize: 9,
      bold: true,
      color: MUTED_COLOR,
      align: "center",
      valign: "middle",
    });
    slide.addText(String(total), {
      x: 0.4,
      y: 1.15,
      w: 1.2,
      h: 0.45,
      fontSize: 22,
      bold: true,
      color: TEXT_COLOR,
      align: "center",
      valign: "middle",
    });

    // Status boxes
    const activeStatuses = statuses.filter((s) => (statusBreakdown[s.id] || 0) > 0);
    const statusStartX = 1.8;
    const statusBoxW = Math.min(1.6, (7 - statusStartX) / Math.max(activeStatuses.length, 1));

    activeStatuses.forEach((s, i) => {
      const count = statusBreakdown[s.id] || 0;
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
      const x = statusStartX + i * (statusBoxW + 0.1);

      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 0.85,
        w: statusBoxW,
        h: 0.8,
        fill: { color: "1e3a5f" },
        line: { color: hexFromCss(s.color), width: 1.5 },
        rectRadius: 0.05,
      });
      slide.addText(s.name, {
        x,
        y: 0.85,
        w: statusBoxW,
        h: 0.35,
        fontSize: 8,
        bold: true,
        color: hexFromCss(s.color),
        align: "center",
        valign: "middle",
      });
      slide.addText(`${count} (${pct}%)`, {
        x,
        y: 1.15,
        w: statusBoxW,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: TEXT_COLOR,
        align: "center",
        valign: "middle",
      });
    });

    // Completion KPIs
    const comp = getCompletionData(clientPlans);
    const compLabels = [
      { label: "Pend. Conclusão", value: comp.pending, color: "f4a261" },
      { label: "Dentro do Prazo", value: comp.onTime, color: "3b82f6" },
      { label: "Fora do Prazo", value: comp.late, color: "ef4444" },
    ];
    const compStartX = 8.5;
    const compBoxW = 1.5;

    compLabels.forEach((item, i) => {
      const x = compStartX + i * (compBoxW + 0.1);
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";

      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 0.85,
        w: compBoxW,
        h: 0.8,
        fill: { color: "1e3a5f" },
        line: { color: item.color, width: 1.5 },
        rectRadius: 0.05,
      });
      slide.addText(item.label, {
        x,
        y: 0.85,
        w: compBoxW,
        h: 0.35,
        fontSize: 8,
        bold: true,
        color: item.color,
        align: "center",
        valign: "middle",
      });
      slide.addText(`${item.value} (${pct}%)`, {
        x,
        y: 1.15,
        w: compBoxW,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: TEXT_COLOR,
        align: "center",
        valign: "middle",
      });
    });

    // --- Donut charts ---
    // Status Projeto donut - single series with all segments
    const statusChartData = [{
      name: "Status Projeto",
      labels: activeStatuses.map((s) => s.name),
      values: activeStatuses.map((s) => statusBreakdown[s.id] || 0),
    }];

    if (statusChartData.length > 0) {
      slide.addText("STATUS PROJETO", {
        x: 0.4,
        y: 1.8,
        w: 4,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: MUTED_COLOR,
        align: "center",
      });

      slide.addChart(pptx.ChartType.doughnut, statusChartData, {
        x: 1.2,
        y: 2.1,
        w: 2.5,
        h: 2.2,
        showLegend: true,
        legendPos: "b",
        legendFontSize: 7,
        legendColor: TEXT_COLOR,
        dataLabelPosition: "outEnd",
        dataLabelColor: TEXT_COLOR,
        dataLabelFontSize: 8,
        showValue: true,
        showPercent: true,
        chartColors: activeStatuses.map((s) => hexFromCss(s.color)),
      } as any);
    }

    // Status Conclusão donut
    const compChartLabels = compLabels.filter((c) => c.value > 0);
    if (compChartLabels.length > 0) {
      slide.addText("STATUS CONCLUSÃO", {
        x: 4.5,
        y: 1.8,
        w: 4,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: MUTED_COLOR,
        align: "center",
      });

      const compChartData = [{
        name: "Status Conclusão",
        labels: compChartLabels.map((c) => c.label),
        values: compChartLabels.map((c) => c.value),
      }];

      slide.addChart(pptx.ChartType.doughnut, compChartData, {
        x: 5.3,
        y: 2.1,
        w: 2.5,
        h: 2.2,
        showLegend: true,
        legendPos: "b",
        legendFontSize: 7,
        legendColor: TEXT_COLOR,
        dataLabelPosition: "outEnd",
        dataLabelColor: TEXT_COLOR,
        dataLabelFontSize: 8,
        showValue: true,
        showPercent: true,
        chartColors: compChartLabels.map((c) => c.color),
      } as any);
    }

    // --- Bar chart by theme ---
    const themeMap: Record<string, Record<string, number>> = {};
    clientPlans.forEach((p) => {
      const theme = p.theme || "N/A";
      if (!themeMap[theme]) themeMap[theme] = {};
      themeMap[theme][p.status_id] = (themeMap[theme][p.status_id] || 0) + 1;
    });

    const themeNames = Object.keys(themeMap).sort();
    const barActiveStatuses = statuses.filter((s) =>
      themeNames.some((t) => (themeMap[t]?.[s.id] || 0) > 0)
    );

    if (themeNames.length > 0 && barActiveStatuses.length > 0) {
      slide.addText("PROJETOS POR ÁREA E STATUS", {
        x: 8.5,
        y: 1.8,
        w: 4.5,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: MUTED_COLOR,
        align: "center",
      });

      const barData = barActiveStatuses.map((s) => ({
        name: s.name,
        labels: themeNames,
        values: themeNames.map((t) => themeMap[t]?.[s.id] || 0),
      }));

      slide.addChart(pptx.ChartType.bar, barData, {
        x: 8.3,
        y: 2.1,
        w: 4.8,
        h: 2.2,
        barDir: "col",
        barGrouping: "stacked",
        showLegend: true,
        legendPos: "b",
        legendFontSize: 7,
        legendColor: TEXT_COLOR,
        catAxisLabelColor: TEXT_COLOR,
        catAxisLabelFontSize: 7,
        valAxisLabelColor: TEXT_COLOR,
        valAxisLabelFontSize: 8,
        chartColors: barActiveStatuses.map((s) => hexFromCss(s.color)),
        dataLabelColor: TEXT_COLOR,
        dataLabelFontSize: 7,
        showValue: true,
      } as any);
    }

    // --- Actions table ---
    slide.addText("LISTA DE AÇÕES", {
      x: 0.4,
      y: 4.4,
      w: 12.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: MUTED_COLOR,
    });

    const headers = [
      { text: "Ano", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG }, align: "center" as const } },
      { text: "Tema", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG } } },
      { text: "Ação", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG } } },
      { text: "Status", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG } } },
      { text: "Gestor", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG } } },
      { text: "Início", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG }, align: "center" as const } },
      { text: "Fim", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG }, align: "center" as const } },
      { text: "Conclusão", options: { bold: true, fontSize: 7, color: TEXT_COLOR, fill: { color: HEADER_BG }, align: "center" as const } },
    ];

    const rows: any[][] = [headers];

    const sortedPlans = [...clientPlans].sort((a, b) => (a.theme || "").localeCompare(b.theme || ""));
    const maxRows = Math.min(sortedPlans.length, 12); // limit rows per slide

    for (let i = 0; i < maxRows; i++) {
      const p = sortedPlans[i];
      const statusColor = hexFromCss((p.action_statuses as any)?.color || "#6b7280");
      const rowBg = i % 2 === 0 ? "0f2847" : "122d4f";
      rows.push([
        { text: String(p.survey_year ?? "—"), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
        { text: (p.theme || "—").substring(0, 30), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
        { text: (p.action_name || "—").substring(0, 40), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
        { text: (p.action_statuses as any)?.name || "—", options: { fontSize: 7, color: statusColor, bold: true, fill: { color: rowBg } } },
        { text: ((p.contract_managers as any)?.name || "—").substring(0, 20), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
        { text: fmtDate(p.start_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
        { text: fmtDate(p.end_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
        { text: fmtDate(p.completion_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
      ]);
    }

    if (sortedPlans.length > maxRows) {
      rows.push([
        { text: `... +${sortedPlans.length - maxRows} ações`, options: { fontSize: 7, color: MUTED_COLOR, fill: { color: "0f2847" }, colSpan: 8 } },
      ]);
    }

    slide.addTable(rows, {
      x: 0.4,
      y: 4.7,
      w: 12.5,
      colW: [0.6, 2.0, 3.0, 1.5, 1.8, 1.0, 1.0, 1.0],
      border: { type: "solid", color: "2a4a6b", pt: 0.5 },
      margin: [2, 4, 2, 4],
      autoPage: false,
    } as any);
  });

  pptx.writeFile({ fileName: `Dashboard_Action_Plans_${format(new Date(), "yyyy-MM-dd")}.pptx` });
}
