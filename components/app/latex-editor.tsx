"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/app/theme-toggle";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import {
  aiEditLatexAction,
  resetLatexAction,
  saveLatexAction,
} from "@/app/actions";

type ChatMsg = { role: "user" | "assistant"; text: string };
type Heading = { title: string; line: number };

const SECTION_RE = /\\(?:sub)?section\*?\{([^}]*)\}/;

export function LatexEditor({ initialTex }: { initialTex: string }): React.ReactElement {
  const [tex, setTex] = useState(initialTex);
  const [version, setVersion] = useState(0);
  const [log, setLog] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiOpen, setAiOpen] = useState(true);
  const [compiling, startCompile] = useTransition();
  const [aiPending, startAi] = useTransition();
  const [resetting, startReset] = useTransition();
  const viewRef = useRef<EditorView | null>(null);

  const busy = compiling || aiPending || resetting;

  const compile = () => {
    setLog(null);
    startCompile(async () => {
      const r = await saveLatexAction(tex);
      if (r.ok) setVersion((v) => v + 1);
      else setLog(r.log ?? "Compilation failed.");
    });
  };

  const reset = () => {
    startReset(async () => {
      const r = await resetLatexAction();
      if (r.tex != null) {
        setTex(r.tex);
        setLog(null);
        setVersion((v) => v + 1);
      }
    });
  };

  const sendAi = () => {
    const instruction = aiInput.trim();
    if (!instruction || busy) return;
    setAiInput("");
    setMessages((m) => [...m, { role: "user", text: instruction }]);
    startAi(async () => {
      const r = await aiEditLatexAction(instruction, tex);
      setTex(r.tex);
      if (r.ok) {
        setVersion((v) => v + 1);
        setLog(null);
        setMessages((m) => [...m, { role: "assistant", text: "Applied — preview updated." }]);
      } else {
        setLog(r.log ?? null);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Edited the source, but it didn't compile — see the log, tweak, and Recompile." },
        ]);
      }
    });
  };

  const goTo = (line: number) => {
    const view = viewRef.current;
    if (!view) return;
    const target = view.state.doc.line(Math.min(line, view.state.doc.lines));
    view.dispatch({
      selection: { anchor: target.from },
      effects: EditorView.scrollIntoView(target.from, { y: "start" }),
    });
    view.focus();
  };

  const outline = useMemo<Heading[]>(() => {
    const out: Heading[] = [];
    const lines = tex.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(SECTION_RE);
      if (m) out.push({ title: m[1], line: i + 1 });
    }
    return out;
  }, [tex]);

  // Keep the CodeMirror keymap stable while always calling the latest compile().
  const compileRef = useRef(compile);
  compileRef.current = compile;
  const extensions = useMemo(
    () => [
      StreamLanguage.define(stex),
      keymap.of([
        indentWithTab,
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            compileRef.current();
            return true;
          },
        },
      ]),
    ],
    [],
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-12 flex-none items-center justify-between gap-3 border-b border-border bg-card px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/review"
            title="Back to review"
            className="inline-flex size-8 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="flex size-6 flex-none items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </span>
          <span className="truncate text-[13px] font-medium text-foreground">The Resume Thing</span>
        </div>

        <div className="flex flex-none items-center gap-2">
          <ThemeToggle className="inline-flex size-8 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" />
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="hidden h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 sm:inline-flex"
          >
            {resetting ? "Resetting\u2026" : "Reset to generated"}
          </button>
          <button
            type="button"
            onClick={compile}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#138a07] px-3.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#0f7505] disabled:opacity-60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            {compiling ? "Compiling\u2026" : "Recompile"}
          </button>
          <a
            href={`/api/resume/pdf?v=${version}`}
            target="_blank"
            rel="noreferrer"
            title="Download PDF"
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        </div>
      </header>

      {/* Three panes */}
      <div className="flex min-h-0 flex-1">
        {/* Left: file tree + outline */}
        <aside className="flex w-[232px] flex-none flex-col border-r border-border bg-muted">
          <div className="flex-none px-3 pt-3 pb-1.5 font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">
            File tree
          </div>
          <div className="flex items-center gap-2 border-l-2 border-[#138a07] bg-accent px-3 py-1.5 text-[13px] font-medium text-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            resume.tex
          </div>

          <div className="flex-none px-3 pt-4 pb-1.5 font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">
            Outline
          </div>
          <nav className="min-h-0 flex-1 overflow-auto pb-3">
            {outline.length === 0 ? (
              <p className="px-3 text-[12px] text-muted-foreground">No sections yet.</p>
            ) : (
              outline.map((h) => (
                <button
                  key={`${h.line}-${h.title}`}
                  type="button"
                  onClick={() => goTo(h.line)}
                  className="block w-full truncate px-3 py-1 text-left text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {h.title}
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Center: code + log + AI */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-border">
          <div className="min-h-0 flex-1 overflow-auto">
            <CodeMirror
              value={tex}
              onChange={(v) => setTex(v)}
              onCreateEditor={(view) => {
                viewRef.current = view;
              }}
              extensions={extensions}
              height="100%"
              style={{ height: "100%", fontSize: "13px" }}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
            />
          </div>

          {log && (
            <pre className="max-h-[130px] flex-none overflow-auto border-t border-border bg-destructive/10 p-3 font-mono text-[11px] whitespace-pre-wrap text-destructive">
              {log}
            </pre>
          )}

          <div className="flex flex-none flex-col border-t border-border bg-card">
            <button
              type="button"
              onClick={() => setAiOpen((o) => !o)}
              className="flex flex-none items-center justify-between px-3.5 py-2 text-left font-mono text-[11px] text-muted-foreground hover:bg-accent"
            >
              <span>edit with AI</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
                className={aiOpen ? "" : "rotate-180"}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {aiOpen && (
              <div className="flex h-[210px] flex-col border-t border-border">
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  {messages.length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">
                      e.g. &ldquo;make the summary punchier&rdquo;, &ldquo;add a Publications section&rdquo;,
                      &ldquo;tighten the bullets to one line each&rdquo;.
                    </p>
                  ) : (
                    messages.map((m, i) => (
                      <div
                        key={`${i}-${m.role}`}
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                          m.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-accent text-foreground"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))
                  )}
                  {aiPending && <p className="text-[12.5px] text-muted-foreground">Editing…</p>}
                </div>
                <div className="flex flex-none items-center gap-2 border-t border-border p-2.5">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendAi();
                    }}
                    placeholder="Tell the AI how to change the resume…"
                    disabled={aiPending}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-ring"
                  />
                  <button
                    type="button"
                    onClick={sendAi}
                    disabled={aiPending || !aiInput.trim()}
                    className="inline-flex h-9 items-center rounded-lg border border-primary bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right: PDF preview */}
        <section className="flex min-w-0 flex-1 flex-col bg-muted">
          <iframe
            key={version}
            src={`/api/resume/pdf?v=${version}`}
            title="Resume preview"
            className="h-full w-full"
          />
        </section>
      </div>
    </div>
  );
}
