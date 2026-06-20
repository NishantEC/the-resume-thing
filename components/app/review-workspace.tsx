"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { EvidenceChip, ItemView, ProjectGroup, ResumeView } from "@/lib/resume/load";
import {
  acceptItemAction,
  dismissItemAction,
  editItemAction,
  regenerateVariantsAction,
  reorderItemAction,
  undoItemAction,
} from "@/app/actions";
import { ResumePreview } from "@/components/app/resume-preview";

type PendingRef = { id: string; content: string; evidence: EvidenceChip[]; project: string };

function recount(view: ResumeView): ResumeView {
  let total = 0;
  let accepted = 0;
  for (const g of view.groups) {
    for (const it of g.items) {
      total += 1;
      if (it.accepted) accepted += 1;
    }
  }
  return {
    ...view,
    totalItems: total,
    acceptedCount: accepted,
    pct: total === 0 ? 0 : Math.round((accepted / total) * 100),
  };
}

export function ReviewWorkspace({
  initialView,
  name,
}: {
  initialView: ResumeView;
  name: string;
}): React.ReactElement {
  const [view, setView] = useState<ResumeView>(initialView);
  const [, startTransition] = useTransition();
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [variantsFor, setVariantsFor] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const pending = useMemo<PendingRef[]>(() => {
    const out: PendingRef[] = [];
    for (const g of view.groups) {
      for (const it of g.items) {
        if (!it.accepted) out.push({ id: it.id, content: it.content, evidence: it.evidence, project: g.project });
      }
    }
    return out;
  }, [view]);

  const persist = (op: () => Promise<unknown>): void => {
    startTransition(async () => {
      try {
        await op();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const mutate = (id: string, fn: (it: ItemView) => ItemView | null): void => {
    setView((v) => {
      const groups: ProjectGroup[] = v.groups.map((g) => {
        const items: ItemView[] = [];
        for (const it of g.items) {
          if (it.id !== id) {
            items.push(it);
            continue;
          }
          const next = fn(it);
          if (next) items.push(next);
        }
        return { ...g, items };
      });
      return recount({ ...v, groups });
    });
  };

  const apply = (id: string): void => {
    mutate(id, (it) => ({ ...it, accepted: true }));
    persist(() => acceptItemAction(id));
  };
  const undo = (id: string): void => {
    mutate(id, (it) => ({ ...it, accepted: false }));
    persist(() => undoItemAction(id));
  };
  const dismiss = (id: string): void => {
    if (open === id) setOpen(null);
    mutate(id, () => null);
    persist(() => dismissItemAction(id));
  };
  const startEdit = (it: ItemView | PendingRef): void => {
    setEditing(it.id);
    setDraft(it.content);
    setOpen(it.id);
  };
  const saveEdit = (id: string): void => {
    const t = draft.trim();
    if (!t) return;
    mutate(id, (it) => ({ ...it, content: t }));
    setEditing(null);
    persist(() => editItemAction(id, t));
  };
  const regen = (id: string): void => {
    setVariantsFor(id);
    setVariants([]);
    setLoadingVariants(true);
    setOpen(id);
    startTransition(async () => {
      try {
        const r = await regenerateVariantsAction(id);
        setVariants(r.variants);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVariants(false);
      }
    });
  };
  const pickVariant = (id: string, text: string): void => {
    mutate(id, (it) => ({ ...it, content: text }));
    setVariantsFor(null);
    setVariants([]);
    persist(() => editItemAction(id, text));
  };
  const reorder = (id: string, dir: "up" | "down"): void => {
    setView((v) => {
      const groups = v.groups.map((g) => {
        const idx = g.items.findIndex((it) => it.id === id);
        if (idx === -1) return g;
        const target = dir === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= g.items.length) return g;
        const items = [...g.items];
        [items[idx], items[target]] = [items[target], items[idx]];
        return { ...g, items };
      });
      return { ...v, groups };
    });
    persist(() => reorderItemAction(id, dir));
  };
  const applyGroup = (project: string): void => {
    const ids = view.groups
      .filter((g) => g.project === project)
      .flatMap((g) => g.items.filter((it) => !it.accepted).map((it) => it.id));
    setView((v) =>
      recount({
        ...v,
        groups: v.groups.map((g) =>
          g.project === project ? { ...g, items: g.items.map((it) => ({ ...it, accepted: true })) } : g,
        ),
      }),
    );
    persist(async () => {
      for (const id of ids) await acceptItemAction(id);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (editing) return;
    const cur = pending[sel];
    switch (e.key) {
      case "j":
      case "ArrowDown":
        e.preventDefault();
        setSel((s) => Math.min(pending.length - 1, s + 1));
        break;
      case "k":
      case "ArrowUp":
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
        break;
      case "a":
        if (cur) { e.preventDefault(); apply(cur.id); }
        break;
      case "x":
        if (cur) { e.preventDefault(); dismiss(cur.id); }
        break;
      case "e":
        if (cur) { e.preventDefault(); startEdit(cur); }
        break;
      case "Enter":
        if (cur) { e.preventDefault(); setOpen((o) => (o === cur.id ? null : cur.id)); }
        break;
      default:
        break;
    }
  };

  const selId = pending[sel]?.id;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-40 flex flex-col bg-background text-foreground outline-none"
    >
      {/* Header */}
      <header className="flex h-12 flex-none items-center justify-between gap-3 border-b border-border bg-card px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/home"
            title="Back to home"
            className="inline-flex size-8 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="font-mono text-[13px] font-semibold text-foreground">review</span>
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {view.acceptedCount}/{view.totalItems} · {pending.length} pending
          </span>
        </div>
        <Link
          href="/resume"
          className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-border bg-background px-3 font-mono text-[12px] text-foreground hover:border-signal/50 hover:bg-accent"
        >
          open résumé
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: checks */}
        <section className="flex w-1/2 min-w-0 flex-col overflow-auto border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">checks</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">
              <Key>j</Key>/<Key>k</Key> move · <Key>a</Key> apply · <Key>x</Key> dismiss · <Key>e</Key> edit
            </span>
          </div>

          {pending.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[12.5px] text-muted-foreground">
              <span className="text-signal">✓</span> all caught up — your résumé is current
            </div>
          ) : null}

          {view.groups.map((g) => {
            const groupPending = g.items.filter((it) => !it.accepted);
            const groupAccepted = g.items.filter((it) => it.accepted);
            if (groupPending.length === 0 && groupAccepted.length === 0) return null;
            return (
              <div key={g.project} className="border-b border-border last:border-b-0">
                <div className="flex items-center justify-between gap-3 bg-accent/40 px-4 py-2">
                  <span className="truncate font-mono text-[12px] font-semibold text-foreground">{g.project}</span>
                  {groupPending.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => applyGroup(g.project)}
                      className="flex-none font-mono text-[10.5px] text-signal hover:underline"
                    >
                      apply all ({groupPending.length})
                    </button>
                  ) : null}
                </div>

                {groupPending.map((it) => (
                  <div
                    key={it.id}
                    onMouseEnter={() => setSel(pending.findIndex((p) => p.id === it.id))}
                    className={`border-l-2 px-4 py-2 transition-colors ${it.id === selId ? "border-signal/60 bg-accent/50" : "border-transparent"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-[3px] flex-none font-mono text-[12px] text-muted-foreground">○</span>
                      <button type="button" onClick={() => setOpen((o) => (o === it.id ? null : it.id))} className="min-w-0 flex-1 text-left text-[13.5px] text-foreground">
                        {it.content}
                      </button>
                    </div>

                    {open === it.id ? (
                      <div className="flex flex-col gap-2.5 pt-2 pl-[26px]">
                        <div className="flex flex-wrap gap-1.5">
                          {it.evidence.length === 0 ? (
                            <span className="font-mono text-[11px] text-warning">⚠ no source</span>
                          ) : (
                            it.evidence.map((ev, i) => <Chip key={`${ev.url}-${i}`} ev={ev} />)
                          )}
                        </div>
                        {editing === it.id ? (
                          <div className="flex flex-col gap-1.5">
                            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="w-full resize-y rounded-[8px] border border-border bg-background px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-signal" />
                            <div className="flex gap-1.5">
                              <Btn primary onClick={() => saveEdit(it.id)}>save</Btn>
                              <Btn onClick={() => setEditing(null)}>cancel</Btn>
                            </div>
                          </div>
                        ) : variantsFor === it.id ? (
                          <div className="flex flex-col gap-1.5">
                            {loadingVariants ? (
                              <span className="font-mono text-[11.5px] text-muted-foreground">generating variants…</span>
                            ) : (
                              variants.map((vr, i) => (
                                <button key={i} type="button" onClick={() => pickVariant(it.id, vr)} className="rounded-[8px] border border-border bg-card px-3 py-2 text-left text-[13px] text-foreground hover:border-signal/50 hover:bg-accent">
                                  {vr}
                                </button>
                              ))
                            )}
                            <Btn onClick={() => { setVariantsFor(null); setVariants([]); }}>cancel</Btn>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <Btn primary onClick={() => apply(it.id)}>apply</Btn>
                            <Btn onClick={() => regen(it.id)}>variants</Btn>
                            <Btn onClick={() => startEdit(it)}>edit</Btn>
                            <Btn onClick={() => dismiss(it.id)}>dismiss</Btn>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

                {groupAccepted.length > 0 ? (
                  <div className="px-4 py-1.5">
                    <span className="font-mono text-[10px] tracking-wide text-muted-foreground/70 uppercase">in résumé</span>
                    {groupAccepted.map((it) => (
                      <div key={it.id} className="flex items-center gap-2 py-1">
                        <span className="flex-none font-mono text-[11px] text-signal">✓</span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">{it.content}</span>
                        <div className="flex flex-none items-center gap-0.5">
                          <IconBtn label="up" onClick={() => reorder(it.id, "up")}>↑</IconBtn>
                          <IconBtn label="down" onClick={() => reorder(it.id, "down")}>↓</IconBtn>
                          <IconBtn label="undo" onClick={() => undo(it.id)}>↺</IconBtn>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* Right: live résumé */}
        <section className="w-1/2 min-w-0 overflow-auto bg-muted p-6">
          <ResumePreview view={view} name={name} />
        </section>
      </div>
    </div>
  );
}

function Chip({ ev }: { ev: EvidenceChip }): React.ReactElement {
  return (
    <a href={ev.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground no-underline hover:border-signal/50 hover:text-foreground">
      <span className="rounded-[3px] bg-accent px-1 text-[9px] font-semibold text-muted-foreground">{ev.kind}</span>
      <span className="text-foreground/80">{ev.repoRef}</span>
      {ev.hasStat ? (
        <>
          <span className="text-emerald-600 dark:text-emerald-400">+{ev.add}</span>
          <span className="text-red-600 dark:text-red-400">−{ev.del}</span>
        </>
      ) : null}
    </a>
  );
}

function Btn({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center rounded-[7px] px-2.5 font-mono text-[11.5px] ${primary ? "border border-signal/40 bg-signal/10 text-signal hover:bg-signal/20" : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }): React.ReactElement {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex size-6 items-center justify-center rounded-[5px] font-mono text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground">
      {children}
    </button>
  );
}

function Key({ children }: { children: React.ReactNode }): React.ReactElement {
  return <kbd className="rounded-[4px] border border-border bg-background px-1 text-[10px] text-foreground">{children}</kbd>;
}
