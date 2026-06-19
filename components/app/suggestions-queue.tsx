"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceChip, ProjectGroup } from "@/lib/resume/load";
import {
  acceptItemAction,
  dismissItemAction,
  editItemAction,
  regenerateItemAction,
  undoItemAction,
} from "@/app/actions";

type Check = {
  id: string;
  group: string;
  meta: string;
  content: string;
  regenerated: boolean;
  evidence: EvidenceChip[];
};

type Job = { name: string; meta: string; items: Check[] };

function pendingChecks(groups: ProjectGroup[]): Check[] {
  const out: Check[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      if (item.accepted) continue;
      out.push({
        id: item.id,
        group: g.project,
        meta: g.meta,
        content: item.content,
        regenerated: item.regenerated,
        evidence: item.evidence,
      });
    }
  }
  return out;
}

function intoJobs(checks: Check[]): Job[] {
  const jobs: Job[] = [];
  const byName = new Map<string, Job>();
  for (const c of checks) {
    let job = byName.get(c.group);
    if (!job) {
      job = { name: c.group, meta: c.meta, items: [] };
      byName.set(c.group, job);
      jobs.push(job);
    }
    job.items.push(c);
  }
  return jobs;
}

export function SuggestionsQueue({ groups }: { groups: ProjectGroup[] }): React.ReactElement {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  // Optimistic: ids acted-on leave the queue instantly. `all` comes from fresh
  // server props after each router.refresh(), so resolved ids simply aren't here.
  const all = useMemo(() => pendingChecks(groups), [groups]);
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const checks = all.filter((c) => !gone.has(c.id));
  const jobs = useMemo(() => intoJobs(checks), [checks]);

  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [regen, setRegen] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: string; content: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const drop = (id: string) => setGone((s) => new Set(s).add(id));
  const revive = (id: string) =>
    setGone((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const apply = (c: Check) => {
    setFlash(c.id);
    window.setTimeout(() => {
      setFlash(null);
      drop(c.id);
    }, 260);
    startTransition(async () => {
      await acceptItemAction(c.id);
      router.refresh();
    });
  };
  const dismiss = (c: Check) => {
    setUndo({ id: c.id, content: c.content });
    drop(c.id);
    startTransition(async () => {
      await dismissItemAction(c.id);
      router.refresh();
    });
  };
  const runUndo = () => {
    if (!undo) return;
    const { id } = undo;
    setUndo(null);
    revive(id);
    startTransition(async () => {
      await undoItemAction(id);
      router.refresh();
    });
  };
  const openEdit = (c: Check) => {
    setEditing(c.id);
    setDraft(c.content);
    setOpen(c.id);
  };
  const saveEdit = (id: string) => {
    const text = draft.trim();
    if (!text) return;
    setEditing(null);
    startTransition(async () => {
      await editItemAction(id, text);
      router.refresh();
    });
  };
  const regenerate = (c: Check) => {
    setRegen(c.id);
    startTransition(async () => {
      await regenerateItemAction(c.id);
      setRegen(null);
      router.refresh();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (editing) return;
    const c = checks[sel];
    switch (e.key) {
      case "j":
      case "ArrowDown":
        e.preventDefault();
        setSel((s) => Math.min(checks.length - 1, s + 1));
        break;
      case "k":
      case "ArrowUp":
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
        break;
      case "a":
        if (c) { e.preventDefault(); apply(c); }
        break;
      case "x":
        if (c) { e.preventDefault(); dismiss(c); }
        break;
      case "e":
        if (c) { e.preventDefault(); openEdit(c); }
        break;
      case "r":
        if (c) { e.preventDefault(); regenerate(c); }
        break;
      case "u":
        e.preventDefault();
        runUndo();
        break;
      case "Enter":
        if (c) { e.preventDefault(); setOpen((o) => (o === c.id ? null : c.id)); }
        break;
      case "Escape":
        setOpen(null);
        break;
      default:
        break;
    }
  };

  if (checks.length === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-card px-5 py-9 text-center">
        <p className="font-mono text-[12.5px] text-muted-foreground">
          <span className="text-signal">✓</span> all caught up — no checks pending
        </p>
        {undo ? <UndoBar content={undo.content} onUndo={runUndo} /> : null}
      </div>
    );
  }

  let flat = -1;
  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
    >
      {jobs.map((job) => (
        <div key={job.name} className="border-b border-border last:border-b-0">
          <div className="flex items-baseline justify-between gap-3 bg-accent/40 px-4 py-2">
            <span className="truncate font-mono text-[12px] font-semibold text-foreground">{job.name}</span>
            <span className="flex-none font-mono text-[10.5px] text-muted-foreground">
              {job.items.length} {job.items.length === 1 ? "check" : "checks"}
              {job.meta ? <span className="text-muted-foreground/70"> · {job.meta}</span> : null}
            </span>
          </div>
          {job.items.map((c) => {
            flat += 1;
            const i = flat;
            return (
              <CheckRow
                key={c.id}
                check={c}
                selected={i === sel}
                expanded={open === c.id}
                editing={editing === c.id}
                flashing={flash === c.id}
                regenerating={regen === c.id}
                busy={busy}
                draft={draft}
                onSelect={() => setSel(i)}
                onToggle={() => setOpen((o) => (o === c.id ? null : c.id))}
                onApply={() => apply(c)}
                onDismiss={() => dismiss(c)}
                onEdit={() => openEdit(c)}
                onRegen={() => regenerate(c)}
                onDraft={setDraft}
                onSave={() => saveEdit(c.id)}
                onCancel={() => setEditing(null)}
              />
            );
          })}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
        <span className="font-mono text-[10.5px] text-muted-foreground">
          <Key>j</Key> <Key>k</Key> move · <Key>a</Key> apply · <Key>x</Key> dismiss · <Key>e</Key> edit ·{" "}
          <Key>r</Key> regen · <Key>↵</Key> evidence
        </span>
        {undo ? <UndoBar content={undo.content} onUndo={runUndo} inline /> : null}
      </div>
    </div>
  );
}

function CheckRow({
  check,
  selected,
  expanded,
  editing,
  flashing,
  regenerating,
  busy,
  draft,
  onSelect,
  onToggle,
  onApply,
  onDismiss,
  onEdit,
  onRegen,
  onDraft,
  onSave,
  onCancel,
}: {
  check: Check;
  selected: boolean;
  expanded: boolean;
  editing: boolean;
  flashing: boolean;
  regenerating: boolean;
  busy: boolean;
  draft: string;
  onSelect: () => void;
  onToggle: () => void;
  onApply: () => void;
  onDismiss: () => void;
  onEdit: () => void;
  onRegen: () => void;
  onDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div
      onMouseEnter={onSelect}
      className={`border-l-2 transition-colors ${
        flashing ? "border-signal bg-signal/10" : selected ? "border-signal/60 bg-accent/50" : "border-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-2">
        <span className={`flex-none font-mono text-[12px] ${flashing ? "text-signal" : "text-muted-foreground"}`}>
          {flashing ? "✓" : regenerating ? "◐" : "○"}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-left text-[13.5px] text-foreground"
        >
          {check.content}
        </button>
        <span className="flex-none font-mono text-[10.5px] text-muted-foreground">
          {check.evidence.length} {check.evidence.length === 1 ? "source" : "sources"}
        </span>
        <div className="flex flex-none items-center gap-1">
          <RowBtn label="apply" primary disabled={busy} onClick={onApply} />
          <RowBtn label="dismiss" disabled={busy} onClick={onDismiss} />
        </div>
      </div>

      {expanded && !editing ? (
        <div className="flex flex-col gap-2.5 px-4 pb-3 pl-[34px]">
          <div className="flex flex-wrap gap-1.5">
            {check.evidence.length === 0 ? (
              <span className="font-mono text-[11px] text-warning">⚠ no source — unverifiable</span>
            ) : (
              check.evidence.map((ev, i) => <Chip key={`${ev.url}-${i}`} ev={ev} />)
            )}
          </div>
          <div className="flex items-center gap-2">
            <RowBtn label={regenerating ? "regenerating…" : "regenerate"} disabled={busy} onClick={onRegen} />
            <RowBtn label="edit" disabled={busy} onClick={onEdit} />
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-2 px-4 pb-3 pl-[34px]">
          <textarea
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-[8px] border border-border bg-background px-3 py-2 text-[13.5px] leading-[1.5] text-foreground outline-none focus:border-signal"
          />
          <div className="flex items-center gap-1.5">
            <RowBtn label="save" primary disabled={busy} onClick={onSave} />
            <RowBtn label="cancel" disabled={busy} onClick={onCancel} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chip({ ev }: { ev: EvidenceChip }): React.ReactElement {
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground no-underline hover:border-signal/50 hover:text-foreground"
    >
      <span className="rounded-[3px] bg-accent px-1 text-[9px] font-semibold tracking-[0.04em] text-muted-foreground">
        {ev.kind}
      </span>
      <span className="text-foreground/80">{ev.repoRef}</span>
      {ev.hasStat ? (
        <>
          <span className="text-emerald-600 dark:text-emerald-400">+{ev.add}</span>
          <span className="text-red-600 dark:text-red-400">−{ev.del}</span>
        </>
      ) : null}
      <span className="text-muted-foreground/70">{ev.date}</span>
    </a>
  );
}

function RowBtn({
  label,
  primary,
  disabled,
  onClick,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 items-center rounded-[7px] px-2.5 font-mono text-[11.5px] disabled:opacity-50 ${
        primary
          ? "border border-signal/40 bg-signal/10 text-signal hover:bg-signal/20"
          : "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Key({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <kbd className="rounded-[4px] border border-border bg-background px-1 text-[10px] text-foreground">{children}</kbd>
  );
}

function UndoBar({
  content,
  onUndo,
  inline,
}: {
  content: string;
  onUndo: () => void;
  inline?: boolean;
}): React.ReactElement {
  return (
    <span className={`flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground ${inline ? "" : "mt-3 justify-center"}`}>
      dismissed “{content.slice(0, 28)}{content.length > 28 ? "…" : ""}”
      <button type="button" onClick={onUndo} className="text-signal hover:underline">
        undo
      </button>
    </span>
  );
}
