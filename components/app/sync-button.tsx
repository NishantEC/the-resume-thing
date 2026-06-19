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
      className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-border bg-transparent px-3 font-mono text-[12px] text-foreground hover:border-signal/50 hover:bg-accent disabled:cursor-default disabled:opacity-60"
    >
      <svg
        width="13"
        height="13"
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
      {pending ? "syncing…" : "sync"}
    </button>
  );
}
