"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RepoRow } from "@/lib/repos";
import { toggleIgnoreRepoAction } from "@/app/actions";

export function RepoManager({ repos }: { repos: RepoRow[] }): React.ReactElement | null {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (repos.length === 0) return null;

  const toggle = (repo: string, ignored: boolean) => {
    startTransition(async () => {
      await toggleIgnoreRepoAction(repo, ignored);
      router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-[13px]">
        <span className="text-[13.5px] font-semibold text-foreground">Repositories</span>
        <span className="font-mono text-[11px] text-muted-foreground">ignore noise</span>
      </div>
      {repos.map((r) => (
        <div
          key={r.repo}
          className="flex items-center gap-3 border-b border-border px-[18px] py-[10px] last:border-b-0"
        >
          <span
            className={`flex-1 truncate font-mono text-[13px] ${r.ignored ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {r.repo}
          </span>
          <span className="flex-none font-mono text-[11.5px] text-muted-foreground">
            {[r.language, r.stars != null ? `${r.stars}\u2605` : null].filter(Boolean).join(" \u00b7 ")}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle(r.repo, !r.ignored)}
            className={`flex-none rounded-lg border px-2.5 py-1 text-[12px] font-medium disabled:opacity-50 ${
              r.ignored
                ? "border-border bg-card text-foreground hover:bg-accent"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {r.ignored ? "Include" : "Ignore"}
          </button>
        </div>
      ))}
    </div>
  );
}
