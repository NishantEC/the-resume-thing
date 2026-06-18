import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Single-process cache of successful compiles keyed by the .tex hash so repeated
// previews/downloads don't recompile. (Dev: one process; prod wants a shared store.)
const cache = new Map<string, Buffer>();

export type CompileResult = { ok: true; pdf: Buffer } | { ok: false; log: string };

/**
 * Compile LaTeX to a PDF via Tectonic, returning the compiler log on failure
 * instead of throwing. First run downloads the package bundle (network).
 */
export async function tryCompileLatex(tex: string): Promise<CompileResult> {
  const key = createHash("sha256").update(tex).digest("hex");
  const cached = cache.get(key);
  if (cached) return { ok: true, pdf: cached };

  const dir = await mkdtemp(path.join(tmpdir(), "resume-tex-"));
  try {
    const texPath = path.join(dir, "resume.tex");
    await writeFile(texPath, tex, "utf8");
    try {
      await execFileAsync(
        "tectonic",
        ["--outdir", dir, "--chatter", "minimal", texPath],
        { timeout: 120_000 },
      );
    } catch (err) {
      const stderr =
        err && typeof err === "object" && "stderr" in err
          ? String((err as { stderr: unknown }).stderr)
          : String(err);
      // Keep the tail — Tectonic prints the relevant errors last.
      return { ok: false, log: stderr.slice(-4000).trim() || "LaTeX compilation failed." };
    }
    const pdf = await readFile(path.join(dir, "resume.pdf"));
    cache.set(key, pdf);
    return { ok: true, pdf };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Compile or throw — used where a failure should surface as an error response. */
export async function compileLatex(tex: string): Promise<Buffer> {
  const result = await tryCompileLatex(tex);
  if (!result.ok) throw new Error(`LaTeX compile failed:\n${result.log}`);
  return result.pdf;
}
