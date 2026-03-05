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
  action_responsibles: { first_name: string; last_name: string } | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

const BG_COLOR = "FFFFFF";
const TEXT_COLOR = "222222";
const MUTED_COLOR = "555555";
const HEADER_BG = "2a4a6b";
const IDL_BLUE = "1a3a6b";
const IDL_CYAN = "00b4d8";

const STORAGE_BASE = "https://axxqmumoolqakbawbkdi.supabase.co/storage/v1/object/public/client-logos";
const COVER_IMG = `${STORAGE_BASE}/pptx-templates%2Fcover-warehouse.jpg`;
const FINAL_IMG = `${STORAGE_BASE}/pptx-templates%2Ffinal-team.jpg`;
const IDL_LOGO = `${STORAGE_BASE}/pptx-templates%2Fidl-logo.jpg`;

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

function addCoverSlide(pptx: PptxGenJS, clientName: string, clientLogoUrl?: string) {
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };

  // Right half - warehouse image
  slide.addImage({
    path: COVER_IMG,
    x: 6.0,
    y: 0,
    w: 7.33,
    h: 7.5,
  });

  // Semi-transparent overlay on right for blend effect
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.5,
    y: 0,
    w: 1.5,
    h: 7.5,
    fill: { color: BG_COLOR, transparency: 50 },
    line: { width: 0 },
  });

  // ID Logistics logo top-left
  slide.addImage({
    path: IDL_LOGO,
    x: 0.5,
    y: 0.4,
    w: 2.8,
    h: 0.7,
  });

  // Client logo if available
  if (clientLogoUrl) {
    try {
      slide.addImage({
        path: clientLogoUrl,
        x: 0.5,
        y: 1.4,
        w: 2.5,
        h: 1.0,
        sizing: { type: "contain", w: 2.5, h: 1.0 },
      });
    } catch {
      // skip
    }
  }

  // Title text
  slide.addText("CUSTOMER\nSATISFACTION\nSURVEY", {
    x: 0.5,
    y: 2.8,
    w: 5.0,
    h: 2.0,
    fontSize: 36,
    bold: true,
    color: TEXT_COLOR,
    lineSpacingMultiple: 1.1,
  });

  // Client name
  slide.addText(clientName, {
    x: 0.5,
    y: 4.8,
    w: 5.0,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: IDL_BLUE,
  });

  // Cyan accent line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 5.5,
    w: 1.2,
    h: 0.06,
    fill: { color: IDL_CYAN },
    line: { width: 0 },
  });

  // Date
  slide.addText(format(new Date(), "MMMM yyyy"), {
    x: 0.5,
    y: 5.8,
    w: 5.0,
    h: 0.4,
    fontSize: 14,
    color: MUTED_COLOR,
  });
}

function addFinalSlide(pptx: PptxGenJS) {
  const slide = pptx.addSlide();

  // Full background - team photo
  slide.addImage({
    path: FINAL_IMG,
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    sizing: { type: "cover", w: 13.33, h: 7.5 },
  });

  // White card overlay
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5,
    y: 2.0,
    w: 4.5,
    h: 4.0,
    fill: { color: "FFFFFF", transparency: 10 },
    line: { width: 0 },
    rectRadius: 0.15,
    shadow: { type: "outer", blur: 10, offset: 3, color: "000000", opacity: 0.3 },
  });

  // Logo inside card
  slide.addImage({
    path: IDL_LOGO,
    x: 2.2,
    y: 2.4,
    w: 2.8,
    h: 0.7,
  });

  // Address
  slide.addText("55, Chemin des Engranauds\nCS 20040\n13660 Orgon France", {
    x: 1.8,
    y: 3.5,
    w: 3.8,
    h: 1.2,
    fontSize: 13,
    color: IDL_BLUE,
    align: "center",
    lineSpacingMultiple: 1.3,
  });

  // Phone
  slide.addText("+33 (0)4 42 110 600", {
    x: 1.8,
    y: 5.0,
    w: 3.8,
    h: 0.4,
    fontSize: 13,
    color: IDL_BLUE,
    align: "center",
  });
}

function addContentSlide(pptx: PptxGenJS, clientName: string, clientPlans: ActionPlan[], statuses: Status[], logoUrl?: string) {
  const slide = pptx.addSlide();
  slide.background = { color: BG_COLOR };

  // Logo + Title
  let titleX = 0.4;
  if (logoUrl) {
    try {
      slide.addImage({
        path: logoUrl,
        x: 0.4,
        y: 0.1,
        w: 1.2,
        h: 0.6,
        sizing: { type: "contain", w: 1.2, h: 0.6 },
      });
      titleX = 1.8;
    } catch {
      // skip logo if it fails
    }
  }

  slide.addText(clientName, {
    x: titleX,
    y: 0.2,
    w: 12 - titleX,
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
    fill: { color: "e8eef5" },
    line: { color: "a0b4cc", width: 1 },
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
      fill: { color: "e8eef5" },
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
      fill: { color: "e8eef5" },
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
    { text: "Cliente", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG } } },
    { text: "Tema", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG } } },
    { text: "Ação", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG } } },
    { text: "Status", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG } } },
    { text: "Responsável", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG } } },
    { text: "Início", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG }, align: "center" as const } },
    { text: "Fim", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG }, align: "center" as const } },
    { text: "Novo Fim", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG }, align: "center" as const } },
    { text: "Conclusão", options: { bold: true, fontSize: 7, color: "FFFFFF", fill: { color: HEADER_BG }, align: "center" as const } },
  ];

  const rows: any[][] = [headers];

  const sortedPlans = [...clientPlans].sort((a, b) => (a.theme || "").localeCompare(b.theme || ""));
  const maxRows = Math.min(sortedPlans.length, 12);

  for (let i = 0; i < maxRows; i++) {
    const p = sortedPlans[i];
    const statusColor = hexFromCss((p.action_statuses as any)?.color || "#6b7280");
    const rowBg = i % 2 === 0 ? "FFFFFF" : "F5F5F5";
    const responsible = p.action_responsibles ? `${p.action_responsibles.first_name} ${p.action_responsibles.last_name}` : "—";
    rows.push([
      { text: (p.client_name || "—").substring(0, 20), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
      { text: (p.theme || "—").substring(0, 25), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
      { text: (p.action_name || "—").substring(0, 35), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
      { text: [
        { text: "● ", options: { fontSize: 7, color: statusColor, bold: true } },
        { text: (p.action_statuses as any)?.name || "—", options: { fontSize: 7, color: TEXT_COLOR, bold: false } },
      ], options: { fill: { color: rowBg } } },
      { text: responsible.substring(0, 20), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg } } },
      { text: fmtDate(p.start_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
      { text: fmtDate(p.end_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
      { text: fmtDate(p.new_end_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
      { text: fmtDate(p.completion_date), options: { fontSize: 7, color: TEXT_COLOR, fill: { color: rowBg }, align: "center" } },
    ]);
  }

  if (sortedPlans.length > maxRows) {
    rows.push([
      { text: `... +${sortedPlans.length - maxRows} ações`, options: { fontSize: 7, color: MUTED_COLOR, fill: { color: "f0f4f8" }, colSpan: 9 } },
    ]);
  }

  slide.addTable(rows, {
    x: 0.4,
    y: 4.7,
    w: 12.5,
    colW: [1.4, 1.8, 2.4, 1.2, 1.5, 0.9, 0.9, 0.9, 0.9],
    border: { type: "solid", color: "c0cfe0", pt: 0.5 },
    margin: [2, 4, 2, 4],
    autoPage: false,
  } as any);
}

/** Export one PPTX file per selected client, each with cover + content + final slide */
export async function exportDashboardPptx(plans: ActionPlan[], statuses: Status[], selectedClients?: string[]) {
  // Fetch client logos
  const { data: clientsDb } = await supabase.from("clients").select("name, logo_url");
  const logoMap: Record<string, string> = {};
  (clientsDb || []).forEach((c: any) => {
    if (c.logo_url) logoMap[c.name] = c.logo_url;
  });

  const allClients = [...new Set(plans.map((p) => p.client_name).filter(Boolean))].sort() as string[];
  const clients = selectedClients && selectedClients.length > 0
    ? allClients.filter((c) => selectedClients.includes(c))
    : allClients;

  for (const clientName of clients) {
    const clientPlans = plans.filter((p) => p.client_name === clientName);
    if (clientPlans.length === 0) continue;

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "IDL Dashboard";
    pptx.title = `Action Plans - ${clientName}`;

    // Cover slide
    addCoverSlide(pptx, clientName, logoMap[clientName]);

    // Content slide(s)
    addContentSlide(pptx, clientName, clientPlans, statuses, logoMap[clientName]);

    // Final slide
    addFinalSlide(pptx);

    const safeClientName = clientName.replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_");
    await pptx.writeFile({ fileName: `Action_Plans_${safeClientName}_${format(new Date(), "yyyy-MM-dd")}.pptx` });
  }
}
