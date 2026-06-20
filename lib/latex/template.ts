import type { ResumeView } from "@/lib/resume/load";
import { escapeLatex } from "./escape";

export type TemplateName =
  | "modern"
  | "classic"
  | "palatino"
  | "charter"
  | "compact"
  | "twocol"
  | "deedy"
  | "avenir"
  | "georgia"
  | "cobalt";

type SectionStyle = "rule" | "smallcaps" | "plain" | "bar";
type Layout = "single" | "twocol" | "sidebar";

interface TemplateSpec {
  label: string;
  blurb: string;
  /** Base point size for documentclass. */
  pt: number;
  /** geometry margin (e.g. "1.6cm"). */
  margin: string;
  /** fontspec system font for body text; null keeps Latin Modern. */
  font: string | null;
  /** Accent colour (hex, no leading #) for the name, rules and headings. */
  accent: string;
  /** Muted colour for secondary text. */
  muted: string;
  section: SectionStyle;
  layout: Layout;
  /** Render FontAwesome glyphs on the contact line. */
  icons: boolean;
  /** Sidebar panel colour (hex) — only used by the sidebar layout. */
  sidebarBg: string | null;
  /** Tighter list/section spacing for dense one-pagers. */
  tight: boolean;
}

/**
 * One spec per template. Tectonic resolves macOS system fonts through fontspec,
 * so these use real Helvetica Neue / Avenir / Palatino / Georgia / Charter etc.
 * FontAwesome (v4, Type1) supplies the contact glyphs.
 */
const SPECS: Record<TemplateName, TemplateSpec> = {
  modern: {
    label: "Modern", blurb: "Helvetica sans, clean rules",
    pt: 11, margin: "1.6cm", font: "Helvetica Neue", accent: "1C1C1C", muted: "6B6B6B",
    section: "rule", layout: "single", icons: true, sidebarBg: null, tight: false,
  },
  classic: {
    label: "Classic", blurb: "Times serif, small caps",
    pt: 11, margin: "1.8cm", font: "Times New Roman", accent: "1C1C1C", muted: "555555",
    section: "smallcaps", layout: "single", icons: false, sidebarBg: null, tight: false,
  },
  palatino: {
    label: "Palatino", blurb: "Elegant book serif",
    pt: 11, margin: "1.8cm", font: "Palatino", accent: "1C1C1C", muted: "555555",
    section: "rule", layout: "single", icons: false, sidebarBg: null, tight: false,
  },
  charter: {
    label: "Charter", blurb: "Crisp, readable serif",
    pt: 11, margin: "1.8cm", font: "Charter", accent: "1C1C1C", muted: "555555",
    section: "rule", layout: "single", icons: false, sidebarBg: null, tight: false,
  },
  compact: {
    label: "Compact", blurb: "Dense, fits one page",
    pt: 10, margin: "1.1cm", font: "Helvetica Neue", accent: "1C1C1C", muted: "6B6B6B",
    section: "plain", layout: "single", icons: true, sidebarBg: null, tight: true,
  },
  twocol: {
    label: "Two-column", blurb: "Skills rail, space-saving",
    pt: 10, margin: "1.3cm", font: "Helvetica Neue", accent: "1C1C1C", muted: "6B6B6B",
    section: "plain", layout: "twocol", icons: false, sidebarBg: null, tight: true,
  },
  deedy: {
    label: "Deedy", blurb: "Navy sidebar, bold name",
    pt: 10, margin: "1.4cm", font: "Avenir Next", accent: "1F2A44", muted: "6B6B6B",
    section: "smallcaps", layout: "sidebar", icons: true, sidebarBg: "1F2A44", tight: true,
  },
  avenir: {
    label: "Avenir", blurb: "Blue accents, modern sans",
    pt: 11, margin: "1.6cm", font: "Avenir Next", accent: "2563EB", muted: "6B6B6B",
    section: "bar", layout: "single", icons: true, sidebarBg: null, tight: false,
  },
  georgia: {
    label: "Georgia", blurb: "Warm editorial serif",
    pt: 11, margin: "1.7cm", font: "Georgia", accent: "7C2D12", muted: "6B5B53",
    section: "smallcaps", layout: "single", icons: false, sidebarBg: null, tight: false,
  },
  cobalt: {
    label: "Cobalt", blurb: "Bold cobalt, tech-forward",
    pt: 11, margin: "1.6cm", font: "Helvetica Neue", accent: "1D4ED8", muted: "64748B",
    section: "bar", layout: "single", icons: true, sidebarBg: null, tight: false,
  },
};

/** Selectable templates with display labels — single source for the picker UI. */
export const TEMPLATES: { id: TemplateName; label: string; blurb: string }[] = (
  Object.keys(SPECS) as TemplateName[]
).map((id) => ({ id, label: SPECS[id].label, blurb: SPECS[id].blurb }));

export interface ResumeTexInput {
  view: ResumeView;
  name: string;
  contact?: string;
  template?: TemplateName;
}

const esc = escapeLatex;
function escUrl(url: string): string {
  return url.replace(/[#%\\{}]/g, (c) => `\\${c}`);
}

function sectionFormat(spec: TemplateSpec): string {
  const head = spec.tight ? "\\normalsize" : "\\large";
  if (spec.section === "smallcaps") {
    return `\\titleformat{\\section}{${head}\\scshape\\color{accent}}{}{0em}{}[{\\color{accent}\\titlerule}]`;
  }
  if (spec.section === "bar") {
    return `\\titleformat{\\section}{${head}\\bfseries\\color{accent}}{}{0em}{\\color{accent}\\rule[-0.35ex]{3pt}{2.3ex}\\hspace{7pt}}`;
  }
  if (spec.section === "plain") {
    return `\\titleformat{\\section}{${head}\\bfseries\\color{accent}}{}{0em}{}`;
  }
  return `\\titleformat{\\section}{${head}\\bfseries\\color{accent}}{}{0em}{}[{\\color{accent}\\titlerule}]`;
}

function buildPreamble(spec: TemplateSpec): string {
  const lines: string[] = [`\\documentclass[${spec.pt}pt,a4paper]{article}`];
  const twoCol = spec.layout === "twocol" || spec.layout === "sidebar";
  lines.push(
    twoCol
      ? `\\usepackage[margin=${spec.margin},columnsep=0.9cm]{geometry}`
      : `\\usepackage[margin=${spec.margin}]{geometry}`,
  );
  if (twoCol) {
    lines.push("\\usepackage{paracol}");
    lines.push(`\\columnratio{${spec.layout === "sidebar" ? "0.32" : "0.34"}}`);
  }
  lines.push("\\usepackage{enumitem}");
  lines.push("\\usepackage{titlesec}");
  lines.push("\\usepackage[hidelinks]{hyperref}");
  lines.push("\\usepackage{xcolor}");
  lines.push("\\usepackage{fontspec}");
  if (spec.font) lines.push(`\\setmainfont{${spec.font}}`);
  if (spec.icons) lines.push("\\usepackage{fontawesome}");
  lines.push(`\\definecolor{accent}{HTML}{${spec.accent}}`);
  lines.push(`\\definecolor{muted}{HTML}{${spec.muted}}`);
  if (spec.sidebarBg) {
    lines.push(`\\definecolor{sidebar}{HTML}{${spec.sidebarBg}}`);
    lines.push("\\definecolor{sidebarsoft}{HTML}{AEB7C9}");
  }
  lines.push(sectionFormat(spec));
  lines.push(`\\titlespacing{\\section}${spec.tight ? "{0pt}{9pt}{3pt}" : "{0pt}{14pt}{6pt}"}`);
  lines.push(
    `\\setlist[itemize]{${spec.tight ? "leftmargin=1em,itemsep=1pt,topsep=1pt" : "leftmargin=1.2em,itemsep=2pt,topsep=2pt"}}`,
  );
  lines.push("\\pagestyle{empty}");
  return lines.join("\n");
}

function contactTex(contact: string, icons: boolean): string {
  return icons ? `\\faGithub\\ ${esc(contact)}` : esc(contact);
}

function header(name: string, headline: string | null, contact: string | undefined, spec: TemplateSpec): string {
  const lines = [`{\\huge\\bfseries\\color{accent} ${esc(name)}}\\\\[3pt]`];
  if (headline) lines.push(`{\\large\\color{muted} ${esc(headline)}}\\\\[2pt]`);
  if (contact) lines.push(`{\\small\\color{muted} ${contactTex(contact, spec.icons)}}\\\\[6pt]`);
  lines.push("{\\color{accent}\\hrule height 0.6pt}");
  return lines.join("\n");
}

function evidenceTex(item: ResumeView["groups"][number]["items"][number]): string {
  if (item.evidence.length === 0) return "";
  const links = item.evidence
    .map((ev) => `\\href{${escUrl(ev.url)}}{\\textcolor{muted}{${esc(ev.sourceLabel)}}}`)
    .join(" ");
  return ` {\\footnotesize ${links}}`;
}

function summaryTex(view: ResumeView): string | null {
  return view.summary ? `\\noindent ${esc(view.summary)}` : null;
}

function skillsTex(view: ResumeView): string | null {
  if (view.skills.length === 0) return null;
  const rows = view.skills
    .map((s) => `\\noindent\\textbf{${esc(s.label)}}\\quad{\\color{muted}${esc(s.list)}}`)
    .join(" \\\\[3pt]\n");
  return `\\section*{Skills}\n${rows}`;
}

function groupsTex(view: ResumeView): string | null {
  if (view.groups.length === 0) return null;
  const groups = view.groups.map((g) => {
    const meta = g.meta ? `\\hfill{\\small\\color{muted} ${esc(g.meta)}}` : "";
    const items = g.items.map((item) => `  \\item ${esc(item.content)}${evidenceTex(item)}`).join("\n");
    return `\\noindent\\textbf{${esc(g.project)}}${meta}\\par\n\\begin{itemize}\n${items}\n\\end{itemize}`;
  });
  return `\\section*{Selected Work}\n\n${groups.join("\n\n")}`;
}

const FOOTER =
  "\\vfill\\noindent{\\footnotesize\\color{muted} generated by the resume thing --- every claim links to its source}";

function sidebarBody(view: ResumeView, name: string, headline: string | null, contact: string | undefined, spec: TemplateSpec): string {
  const left: string[] = [
    "\\color{white}",
    `{\\LARGE\\bfseries ${esc(name)}}\\\\[3pt]`,
  ];
  if (headline) left.push(`{\\normalsize\\color{sidebarsoft} ${esc(headline)}}\\\\[10pt]`);
  if (contact) left.push(`{\\footnotesize ${contactTex(contact, spec.icons)}}\\\\[14pt]`);
  if (view.skills.length > 0) {
    left.push("{\\large\\scshape Skills}\\par\\smallskip");
    const rows = view.skills
      .map((s) => `\\textbf{${esc(s.label)}}\\\\{\\footnotesize\\color{sidebarsoft} ${esc(s.list)}}`)
      .join("\\\\[6pt]\n");
    left.push(rows);
  }

  const right: string[] = ["\\color{black}"];
  const summary = summaryTex(view);
  if (summary) right.push(`${summary}\\par\\medskip`);
  const groups = groupsTex(view);
  if (groups) right.push(groups);
  right.push(FOOTER);

  return [
    "\\backgroundcolor{c[0]}{sidebar}",
    "\\begin{paracol}{2}",
    left.join("\n"),
    "\\switchcolumn",
    right.join("\n\n"),
    "\\end{paracol}",
  ].join("\n");
}

function twocolBody(view: ResumeView, name: string, headline: string | null, contact: string | undefined, spec: TemplateSpec): string {
  const headerBlock = header(name, headline, contact, spec);
  const leftBlocks = [skillsTex(view), summaryTex(view)].filter((b): b is string => b !== null);
  const rightBlock = groupsTex(view) ?? "";
  const paracol = [
    "\\vspace{8pt}",
    "\\begin{paracol}{2}",
    leftBlocks.join("\n\n"),
    "\\switchcolumn",
    rightBlock,
    "\\end{paracol}",
  ].join("\n");
  return [headerBlock, paracol, FOOTER].join("\n\n");
}

function singleBody(view: ResumeView, name: string, headline: string | null, contact: string | undefined, spec: TemplateSpec): string {
  const blocks = [
    header(name, headline, contact, spec),
    summaryTex(view) ? `\\vspace{10pt}\n${summaryTex(view)}` : null,
    skillsTex(view),
    groupsTex(view),
    FOOTER,
  ].filter((b): b is string => b !== null);
  return blocks.join("\n\n");
}

export function renderResumeTex(input: ResumeTexInput): string {
  const spec = SPECS[input.template ?? "modern"];
  const { view, name, contact } = input;
  const headline = view.headline;

  let body: string;
  if (spec.layout === "sidebar") body = sidebarBody(view, name, headline, contact, spec);
  else if (spec.layout === "twocol") body = twocolBody(view, name, headline, contact, spec);
  else body = singleBody(view, name, headline, contact, spec);

  return `${buildPreamble(spec)}\n\n\\begin{document}\n\n${body}\n\n\\end{document}\n`;
}
