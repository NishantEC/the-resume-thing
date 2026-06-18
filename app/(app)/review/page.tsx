import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { ReviewBoard } from "@/components/app/review-board";

export default async function ReviewPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const resume = session ? await loadResume(session.user.id) : null;

  return (
    <div className="mx-auto max-w-[760px] animate-[screenIn_.4s_ease] px-[44px] pt-12 pb-24">
      <div className="mb-6 flex flex-col gap-2.5">
        <span className="font-mono text-[12px] text-[#a0a0a0]">step 3 — review</span>
        <h1 className="m-0 text-[27px] font-semibold tracking-[-0.02em] text-[#161616]">
          Review &amp; accept
        </h1>
        <p className="m-0 max-w-[560px] text-[15px] leading-[1.55] text-[#6b6b6b]">
          Every bullet is generated from your activity and carries its evidence. Accept, tweak, or
          regenerate.
        </p>
      </div>

      {resume ? (
        <ReviewBoard resume={resume} />
      ) : (
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-black/[0.14] bg-white p-[46px] text-center">
          <span className="text-[15px] text-[#6b6b6b]">No resume generated yet.</span>
          <Link
            href="/activity"
            className="inline-flex h-9 items-center rounded-[9px] border border-black/[0.12] bg-white px-4 text-[13.5px] font-medium text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.03]"
          >
            Go to activity
          </Link>
        </div>
      )}
    </div>
  );
}
