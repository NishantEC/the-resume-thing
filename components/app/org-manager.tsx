"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrgRow } from "@/lib/repos";
import { toggleIgnoreOrgAction } from "@/app/actions";

export function OrgManager({ orgs }: { orgs: OrgRow[] }): React.ReactElement | null {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (orgs.length === 0) return null;

  const toggle = (org: string, ignored: boolean) => {
    startTransition(async () => {
      await toggleIgnoreOrgAction(org, ignored);
      router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-[13px]">
        <span className="text-[13.5px] font-semibold text-foreground">Organizations</span>
        <span className="font-mono text-[11px] text-muted-foreground">ignore a whole org</span>
      </div>
      {orgs.map((o) => (
        <div
          key={o.org}
          className="flex items-center gap-3 border-b border-border px-[18px] py-[10px] last:border-b-0"
        >
          <span
            className={`flex-1 truncate font-mono text-[13px] ${o.ignored ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {o.org}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle(o.org, !o.ignored)}
            className={`flex-none rounded-lg border px-2.5 py-1 text-[12px] font-medium disabled:opacity-50 ${
              o.ignored
                ? "border-border bg-card text-foreground hover:bg-accent"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {o.ignored ? "Include" : "Ignore"}
          </button>
        </div>
      ))}
    </div>
  );
}
