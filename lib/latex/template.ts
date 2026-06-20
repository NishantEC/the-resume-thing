import type { ResumeView } from "@/lib/resume/load";
import { escapeLatex } from "./escape";

export type TemplateName = "modern" | "classic" | "palatino" | "charter" | "compact" | "twocol";

/** Selectable templates with display labels — single source for the picker UI. */
export const TEMPLATES: { id: TemplateName; label: string; blurb: string }[] = [
  { id: "modern", label: "Modern", blurb: "Helvetica sans, clean" },
  { id: "classic", label: "Classic", blurb: "Serif, small-caps sections" },
  { id: "palatino", label: "Palatino", blurb: "Elegant serif" },
  { id: "charter", label: "Charter", blurb: "Crisp serif" },
  { id: "compact", label: "Compact", blurb: "Dense, one-page" },
  { id: "twocol", label: "Two-column", blurb: "Space-saving" },
];

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

const PREAMBLE: Record<TemplateName, string> = {
  modern: [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[margin=1.6cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{helvet}",
    "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\definecolor{accent}{HTML}{1C1C1C}",
    "\\definecolor{muted}{HTML}{6B6B6B}",
    "\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{14pt}{6pt}",
    "\\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=2pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
  classic: [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[margin=1.8cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\definecolor{muted}{HTML}{555555}",
    "\\titleformat{\\section}{\\large\\scshape}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{14pt}{6pt}",
    "\\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=2pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
  palatino: [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[margin=1.8cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{mathpazo}",
    "\\definecolor{accent}{HTML}{1C1C1C}",
    "\\definecolor{muted}{HTML}{555555}",
    "\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{14pt}{6pt}",
    "\\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=2pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
  charter: [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[margin=1.8cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage[charter]{mathdesign}",
    "\\definecolor{accent}{HTML}{1C1C1C}",
    "\\definecolor{muted}{HTML}{555555}",
    "\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{14pt}{6pt}",
    "\\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=2pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
  compact: [
    "\\documentclass[10pt,a4paper]{article}",
    "\\usepackage[margin=1.1cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{helvet}",
    "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\definecolor{accent}{HTML}{1C1C1C}",
    "\\definecolor{muted}{HTML}{6B6B6B}",
    "\\titleformat{\\section}{\\normalsize\\bfseries\\color{accent}}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{8pt}{3pt}",
    "\\setlist[itemize]{leftmargin=1em,itemsep=1pt,topsep=1pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
  twocol: [
    "\\documentclass[10pt,a4paper,twocolumn]{article}",
    "\\usepackage[margin=1.2cm,columnsep=1cm]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{helvet}",
    "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\definecolor{accent}{HTML}{1C1C1C}",
    "\\definecolor{muted}{HTML}{6B6B6B}",
    "\\titleformat{\\section}{\\normalsize\\bfseries\\color{accent}}{}{0em}{}[{\\titlerule}]",
    "\\titlespacing{\\section}{0pt}{10pt}{4pt}",
    "\\setlist[itemize]{leftmargin=1em,itemsep=1pt,topsep=1pt}",
    "\\pagestyle{empty}",
  ].join("\n"),
};

function header(name: string, headline: string | null, contact?: string): string {
  const lines = [`{\\huge\\bfseries ${esc(name)}}\\\\[3pt]`];
  if (headline) lines.push(`{\\large\\color{muted} ${esc(headline)}}\\\\[2pt]`);
  if (contact) lines.push(`{\\small\\color{muted} ${esc(contact)}}\\\\[6pt]`);
  lines.push("\\hrule");
  return lines.join("\n");
}

function evidenceTex(item: ResumeView["groups"][number]["items"][number]): string {
  if (item.evidence.length === 0) return "";
  const links = item.evidence
    .map((ev) => `\\href{${escUrl(ev.url)}}{\\textcolor{muted}{${esc(ev.sourceLabel)}}}`)
    .join(" ");
  return ` {\\footnotesize ${links}}`;
}

export function renderResumeTex(input: ResumeTexInput): string {
  const { view, name, contact } = input;
  const template = input.template ?? "modern";

  const blocks: string[] = [`% --- Header ---\n${header(name, view.headline, contact)}`];

  if (view.summary) {
    blocks.push(`% --- Summary ---\n\\vspace{10pt}\n\\noindent ${esc(view.summary)}`);
  }

  if (view.skills.length > 0) {
    const rows = view.skills
      .map((s) => `\\noindent\\textbf{${esc(s.label)}}\\quad{\\color{muted}${esc(s.list)}}`)
      .join(" \\\\[3pt]\n");
    blocks.push(`% --- Skills ---\n\\section*{Skills}\n${rows}`);
  }

  if (view.groups.length > 0) {
    const groups = view.groups.map((g) => {
      const meta = g.meta ? `\\hfill{\\small\\color{muted} ${esc(g.meta)}}` : "";
      const items = g.items
        .map((item) => `  \\item ${esc(item.content)}${evidenceTex(item)}`)
        .join("\n");
      return `\\noindent\\textbf{${esc(g.project)}}${meta}\\par\n\\begin{itemize}\n${items}\n\\end{itemize}`;
    });
    blocks.push(`% --- Selected Work ---\n\\section*{Selected Work}\n\n${groups.join("\n\n")}`);
  }

  blocks.push(
    "% --- Footer ---\n\\vfill\\noindent{\\footnotesize\\color{muted} generated by the resume thing --- every claim links to its source}",
  );

  return `${PREAMBLE[template]}\n\n\\begin{document}\n\n${blocks.join("\n\n")}\n\n\\end{document}\n`;
}
