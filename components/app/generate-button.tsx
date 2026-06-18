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
      router.push("/review");
    });
  };

  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={pending}
      className="inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-[9px] border border-[#262626] bg-[#262626] px-[17px] text-[13.5px] font-semibold text-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(38,38,38,0.24)] hover:border-[#333] hover:bg-[#333] disabled:cursor-default disabled:opacity-80"
    >
      {pending ? (
        <>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fafafa"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[spin_0.9s_linear_infinite]"
          >
            <path d="M21 12a9 9 0 1 1-6.22-8.56" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          Generate resume
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fafafa"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </>
      )}
    </button>
  );
}
