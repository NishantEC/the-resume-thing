"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EvidenceChip, ItemView, ResumeView } from "@/lib/resume/load";
import {
  acceptAllAction,
  acceptItemAction,
  dismissItemAction,
  editItemAction,
  regenerateItemAction,
  undoItemAction,
} from "@/app/actions";

const EditIcon = (): React.ReactElement => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const Spinner = (): React.ReactElement => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-[spin_0.9s_linear_infinite]"
  >
    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
  </svg>
);

const RegenIcon = (): React.ReactElement => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);

function Chip({ ev }: { ev: EvidenceChip }): React.ReactElement {
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-[25px] items-center gap-[7px] rounded-[7px] border border-border bg-card pr-[9px] pl-1.5 no-underline shadow-[0_1px_1px_rgba(0,0,0,0.02)] hover:border-border hover:bg-accent"
    >
      <span
        className="inline-flex h-[15px] items-center rounded-[4px] px-[5px] font-mono text-[9px] font-semibold tracking-[0.05em]"
        style={{ background: ev.tagBg, color: ev.tagColor }}
      >
        {ev.kind}
      </span>
      <span className="font-mono text-[11.5px] text-muted-foreground">{ev.repoRef}</span>
      {ev.hasStat ? (
        <>
          <span className="font-mono text-[11px] text-[#16a34a]">{ev.add}</span>
          <span className="font-mono text-[11px] text-[#dc2626]">{ev.del}</span>
        </>
      ) : null}
      <span className="font-mono text-[11px] text-muted-foreground">{ev.date}</span>
    </a>
  );
}

function ItemCard({
  item,
  editing,
  regenerating,
  busy,
  draft,
  onDraftChange,
  onAccept,
  onUndo,
  onRegen,
  onDismiss,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  item: ItemView;
  editing: boolean;
  regenerating: boolean;
  busy: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onAccept: () => void;
  onUndo: () => void;
  onRegen: () => void;
  onDismiss: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}): React.ReactElement {
  return (
    <div className="flex overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        className={`w-[3px] flex-none ${item.accepted ? "bg-[#16a34a]" : "bg-border"}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[13px] px-[18px] py-4">
        {editing ? (
          <div className="flex flex-col gap-2.5">
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              className="min-h-[74px] w-full resize-y rounded-[10px] border border-border bg-card px-[13px] py-[11px] text-[15px] leading-[1.55] text-foreground outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-transparent bg-transparent px-3 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={busy}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] border border-primary bg-primary px-[13px] text-[13px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(38,38,38,0.24)] hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="m-0 text-[15px] leading-[1.58] text-foreground">{item.content}</p>

            <div className="flex flex-wrap items-center gap-[7px]">
              {item.evidence.map((ev, i) => (
                <Chip key={`${ev.url}-${i}`} ev={ev} />
              ))}
              {item.regenerated ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7" />
                    <path d="M21 4v5h-5" />
                  </svg>
                  regenerated
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-[3px]">
              {item.accepted ? (
                <>
                  <span className="inline-flex items-center gap-[5px] text-[12.5px] font-semibold text-[#047857]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#047857"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Accepted
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Edit"
                      onClick={onStartEdit}
                      className="inline-flex h-[30px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-transparent bg-transparent px-[11px] text-[12.5px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      type="button"
                      title="Undo accept"
                      onClick={onUndo}
                      disabled={busy}
                      className="inline-flex h-[30px] cursor-pointer items-center rounded-[8px] border border-transparent bg-transparent px-[11px] text-[12.5px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Undo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[12.5px] text-muted-foreground">Pending review</span>
                  <div className="flex gap-[5px]">
                    <button
                      type="button"
                      title="Dismiss"
                      onClick={onDismiss}
                      disabled={busy}
                      className="inline-flex h-[31px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-transparent bg-transparent px-[11px] text-[12.5px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      title="Regenerate"
                      onClick={onRegen}
                      disabled={busy}
                      className="inline-flex h-[31px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-transparent bg-transparent px-[11px] text-[12.5px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {regenerating ? <Spinner /> : <RegenIcon />}
                      Regenerate
                    </button>
                    <button
                      type="button"
                      title="Edit"
                      onClick={onStartEdit}
                      className="inline-flex h-[31px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-card px-[11px] text-[12.5px] font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-accent"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={onAccept}
                      disabled={busy}
                      className="inline-flex h-[31px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-primary bg-primary px-[13px] text-[12.5px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(38,38,38,0.24)] hover:bg-primary/90"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Accept
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ReviewBoard({ resume }: { resume: ResumeView }): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const run = (fn: () => Promise<unknown>): void => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const onAcceptAll = (): void => run(() => acceptAllAction());

  const startEdit = (item: ItemView): void => {
    setEditingId(item.id);
    setEditDraft(item.content);
  };

  const onSave = (id: string): void => {
    startTransition(async () => {
      await editItemAction(id, editDraft);
      setEditingId(null);
      router.refresh();
    });
  };

  const onRegen = (id: string): void => {
    setRegenId(id);
    startTransition(async () => {
      await regenerateItemAction(id);
      router.refresh();
      setRegenId(null);
    });
  };

  return (
    <div>
      {/* progress toolbar */}
      <div className="sticky top-0 z-[5] mb-[22px] flex items-center gap-4 rounded-[13px] border border-border bg-card/[0.86] px-4 py-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-[8px]">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-foreground">
              {resume.acceptedCount} of {resume.totalItems} accepted
            </span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-accent">
            <div
              className="h-full rounded-[3px] bg-[#16a34a] transition-[width] duration-[350ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ width: `${resume.pct}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onAcceptAll}
          disabled={pending}
          className="inline-flex h-[33px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-border bg-card px-[13px] text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-accent"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => router.push("/resume")}
          className="inline-flex h-[33px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-primary bg-primary px-[14px] text-[13px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(38,38,38,0.24)] hover:border-primary hover:bg-primary/90"
        >
          View resume
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* summary card */}
      <div className="mb-[26px]">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="font-mono text-[11.5px] tracking-[0.04em] text-muted-foreground uppercase">
            Summary
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="rounded-[14px] border border-border bg-card px-5 py-[18px] text-[15px] leading-[1.6] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {resume.summary}
        </div>
      </div>

      {/* groups */}
      {resume.groups.map((group, gi) => (
        <div key={`${group.project}-${gi}`} className="mb-7">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[15px] font-semibold text-foreground">{group.project}</span>
            <span className="font-mono text-[11.5px] text-muted-foreground">{group.meta}</span>
            <div className="h-px flex-1 bg-border" />
            <a
              href={group.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11.5px] text-muted-foreground no-underline hover:text-foreground"
            >
              repo
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>

          <div className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                editing={editingId === item.id}
                regenerating={regenId === item.id}
                busy={pending}
                draft={editDraft}
                onDraftChange={setEditDraft}
                onAccept={() => run(() => acceptItemAction(item.id))}
                onUndo={() => run(() => undoItemAction(item.id))}
                onRegen={() => onRegen(item.id)}
                onDismiss={() => run(() => dismissItemAction(item.id))}
                onStartEdit={() => startEdit(item)}
                onCancelEdit={() => setEditingId(null)}
                onSave={() => onSave(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
