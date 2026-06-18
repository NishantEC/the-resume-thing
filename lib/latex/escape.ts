// Escape user/content text for safe insertion into LaTeX source. Single pass
// over the original string so the replacements' own braces are never re-scanned.
export function escapeLatex(input: string): string {
  return input.replace(/[\\&%$#_{}~^]/g, (ch) => {
    switch (ch) {
      case "\\":
        return "\\textbackslash{}";
      case "~":
        return "\\textasciitilde{}";
      case "^":
        return "\\textasciicircum{}";
      default:
        return `\\${ch}`;
    }
  });
}
