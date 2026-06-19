"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateResumeAction } from "@/app/actions";

export function GenerateButton(): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onGenerate = (): void => {
    startTransition(async () => {
      await generateResumeAction();
      router.push("/home");
    });
  };

  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-signal/40 bg-signal/10 px-3 font-mono text-[12px] text-signal hover:bg-signal/20 disabled:cursor-default disabled:opacity-60"
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
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
      {pending ? "generating…" : "generate"}
    </button>
  );
}
