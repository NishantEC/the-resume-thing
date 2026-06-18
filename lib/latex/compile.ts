import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Single-process cache keyed by the .tex hash so repeated /resume views and the
// download don't recompile. (Dev: one process; prod would want a shared store.)
const cache = new Map<string, Buffer>();

/**
 * Compile LaTeX source to a PDF via Tectonic. First run downloads the package
 * bundle (network); subsequent runs use Tectonic's on-disk cache.
 */
export async function compileLatex(tex: string): Promise<Buffer> {
  const key = createHash("sha256").update(tex).digest("hex");
  const cached = cache.get(key);
  if (cached) return cached;

  const dir = await mkdtemp(path.join(tmpdir(), "resume-tex-"));
  try {
    const texPath = path.join(dir, "resume.tex");
    await writeFile(texPath, tex, "utf8");
    await execFileAsync(
      "tectonic",
      ["--outdir", dir, "--chatter", "minimal", "--keep-logs", texPath],
      { timeout: 120_000 },
    );
    const pdf = await readFile(path.join(dir, "resume.pdf"));
    cache.set(key, pdf);
    return pdf;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
