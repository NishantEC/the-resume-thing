"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  aiEditLatexAction,
  resetLatexAction,
  saveLatexAction,
} from "@/app/actions";

type ChatMsg = { role: "user" | "assistant"; text: string };

export function LatexEditor({ initialTex }: { initialTex: string }): React.ReactElement {
  const [tex, setTex] = useState(initialTex);
  const [version, setVersion] = useState(0);
  const [log, setLog] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [compiling, startCompile] = useTransition();
  const [aiPending, startAi] = useTransition();
  const [resetting, startReset] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);

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
          { role: "assistant", text: "Edited the source, but it didn't compile — see the log, tweak, and Compile." },
        ]);
      }
    });
  };

  const onTexKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      compile();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = el;
      const next = `${tex.slice(0, s)}  ${tex.slice(en)}`;
      setTex(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
      });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.08)] bg-white px-5 py-3">
        <Link
          href="/resume"
          className="inline-flex h-[33px] items-center gap-1.5 rounded-lg border border-transparent px-3 text-[13px] font-medium text-[#525252] hover:bg-[rgba(0,0,0,0.05)] hover:text-[#262626]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Resume
        </Link>
        <span className="font-mono text-[11.5px] text-[#a8a8a8]">resume.tex</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex h-[33px] items-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-white px-3 text-[13px] font-medium text-[#262626] hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-50"
          >
            {resetting ? "Resetting\u2026" : "Reset to generated"}
          </button>
          <button
            type="button"
            onClick={compile}
            disabled={busy}
            className="inline-flex h-[33px] items-center gap-1.5 rounded-lg border border-[#262626] bg-[#262626] px-3.5 text-[13px] font-semibold text-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#333] disabled:opacity-50"
          >
            {compiling ? "Compiling\u2026" : "Compile"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-1/2 min-w-0 flex-col border-r border-[rgba(0,0,0,0.08)]">
          <textarea
            ref={taRef}
            value={tex}
            spellCheck={false}
            onChange={(e) => setTex(e.target.value)}
            onKeyDown={onTexKeyDown}
            className="min-h-0 flex-1 resize-none bg-[#fbfbfa] p-4 font-mono text-[12.5px] leading-[1.55] text-[#1c1c1c] outline-none"
          />
          {log && (
            <pre className="max-h-[140px] flex-none overflow-auto border-t border-[rgba(0,0,0,0.08)] bg-[#fff5f5] p-3 font-mono text-[11px] whitespace-pre-wrap text-[#b42318]">
              {log}
            </pre>
          )}

          <div className="flex h-[240px] flex-none flex-col border-t border-[rgba(0,0,0,0.08)] bg-white">
            <div className="flex-none border-b border-[rgba(0,0,0,0.06)] px-4 py-2 font-mono text-[11px] text-[#a0a0a0]">
              edit with AI
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
              {messages.length === 0 ? (
                <p className="text-[12.5px] text-[#9a9a9a]">
                  e.g. &ldquo;make the summary punchier&rdquo;, &ldquo;add a Publications section&rdquo;,
                  &ldquo;tighten the bullets to one line each&rdquo;.
                </p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={`${i}-${m.role}`}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                      m.role === "user"
                        ? "ml-auto bg-[#262626] text-[#fafafa]"
                        : "bg-[rgba(0,0,0,0.05)] text-[#2a2a2a]"
                    }`}
                  >
                    {m.text}
                  </div>
                ))
              )}
              {aiPending && <p className="text-[12.5px] text-[#9a9a9a]">Editing…</p>}
            </div>
            <div className="flex flex-none items-center gap-2 border-t border-[rgba(0,0,0,0.06)] p-2.5">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAi();
                }}
                placeholder="Tell the AI how to change the resume…"
                disabled={aiPending}
                className="h-9 min-w-0 flex-1 rounded-lg border border-[rgba(0,0,0,0.12)] px-3 text-[13px] outline-none focus:border-[rgba(0,0,0,0.28)]"
              />
              <button
                type="button"
                onClick={sendAi}
                disabled={aiPending || !aiInput.trim()}
                className="inline-flex h-9 items-center rounded-lg border border-[#262626] bg-[#262626] px-3.5 text-[13px] font-semibold text-[#fafafa] hover:bg-[#333] disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 min-w-0 bg-[#f3f3f2]">
          <iframe
            key={version}
            src={`/api/resume/pdf?v=${version}`}
            title="Resume preview"
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
