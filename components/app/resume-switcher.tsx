"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createResumeAction, setActiveResumeAction } from "@/app/actions";

export type ResumeOption = { id: string; title: string; targetRole: string | null };

export function ResumeSwitcher({
  resumes,
  activeId,
}: {
  resumes: ResumeOption[];
  activeId: string | null;
}): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [pending, start] = useTransition();

  const active = resumes.find((r) => r.id === activeId) ?? resumes[0] ?? null;

  const select = (id: string): void => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    start(async () => {
      await setActiveResumeAction(id);
      setOpen(false);
      router.refresh();
    });
  };

  const create = (): void => {
    const t = title.trim();
    if (!t || pending) return;
    start(async () => {
      await createResumeAction({ title: t, targetRole: role.trim() || undefined });
      setCreating(false);
      setTitle("");
      setRole("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="relative pb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-[9px] border border-sidebar-border bg-card px-2.5 py-2 text-left hover:bg-sidebar-accent"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
            {active ? active.title : "No résumé yet"}
          </span>
          {active?.targetRole ? (
            <span className="block truncate font-mono text-[10.5px] text-muted-foreground">{active.targetRole}</span>
          ) : null}
        </span>
        <svg className="flex-none text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-[10px] border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="max-h-[240px] overflow-auto p-1">
            {resumes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => select(r.id)}
                className="flex w-full items-center justify-between gap-2 rounded-[7px] px-2.5 py-1.5 text-left hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-foreground">{r.title}</span>
                  {r.targetRole ? (
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{r.targetRole}</span>
                  ) : null}
                </span>
                {r.id === activeId ? (
                  <svg className="flex-none text-signal" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </button>
            ))}
          </div>

          {creating ? (
            <div className="flex flex-col gap-1.5 border-t border-border p-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title — e.g. Backend Engineer"
                className="h-8 rounded-[7px] border border-border bg-background px-2 text-[12.5px] text-foreground outline-none focus:border-signal"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Target role / JD (optional)"
                className="h-8 rounded-[7px] border border-border bg-background px-2 text-[12.5px] text-foreground outline-none focus:border-signal"
              />
              <button
                type="button"
                onClick={create}
                disabled={pending || !title.trim()}
                className="inline-flex h-8 items-center justify-center rounded-[7px] border border-signal/40 bg-signal/10 text-[12.5px] font-semibold text-signal hover:bg-signal/20 disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create + generate"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-1.5 border-t border-border px-2.5 py-2 text-left text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="text-signal">+</span> New résumé
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
