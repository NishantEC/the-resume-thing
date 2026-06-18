"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncGithubAction } from "@/app/actions";

export function SyncButton(): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSync(): void {
    startTransition(async () => {
      await syncGithubAction();
      router.push("/home");
    });
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={pending}
      className="inline-flex h-[34px] items-center gap-[7px] rounded-[9px] border border-primary bg-primary px-[15px] text-[13px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(38,38,38,0.24)] hover:bg-primary/90 hover:border-primary disabled:opacity-70 disabled:cursor-default"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pending ? "animate-spin" : undefined}
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
      {pending ? "Syncing…" : "Sync now"}
    </button>
  );
}
