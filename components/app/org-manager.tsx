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
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] px-[18px] py-[13px]">
        <span className="text-[13.5px] font-semibold text-[#262626]">Organizations</span>
        <span className="font-mono text-[11px] text-[#a0a0a0]">ignore a whole org</span>
      </div>
      {orgs.map((o) => (
        <div
          key={o.org}
          className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.05)] px-[18px] py-[10px] last:border-b-0"
        >
          <span
            className={`flex-1 truncate font-mono text-[13px] ${o.ignored ? "text-[#b0b0b0] line-through" : "text-[#2a2a2a]"}`}
          >
            {o.org}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle(o.org, !o.ignored)}
            className={`flex-none rounded-lg border px-2.5 py-1 text-[12px] font-medium disabled:opacity-50 ${
              o.ignored
                ? "border-[rgba(0,0,0,0.12)] bg-white text-[#262626] hover:bg-[rgba(0,0,0,0.03)]"
                : "border-transparent text-[#8a8a8a] hover:bg-[rgba(0,0,0,0.05)] hover:text-[#262626]"
            }`}
          >
            {o.ignored ? "Include" : "Ignore"}
          </button>
        </div>
      ))}
    </div>
  );
}
