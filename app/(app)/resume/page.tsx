import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { effectiveResumeTex } from "@/lib/latex/resume-tex";
import { LatexEditor } from "@/components/app/latex-editor";

export default async function ResumePage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const tex = await effectiveResumeTex(userId, session!.user.name || session!.user.email);

  if (!tex) {
    return (
      <div className="mx-auto flex max-w-[760px] flex-col gap-3.5 px-11 py-12">
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-[rgba(0,0,0,0.14)] bg-white p-[46px] text-center">
          <span className="text-[15px] text-[#6b6b6b]">No resume generated yet.</span>
          <Link
            href="/activity"
            className="inline-flex h-9 items-center rounded-[9px] border border-[rgba(0,0,0,0.12)] bg-white px-4 text-[13.5px] font-medium text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.03)]"
          >
            Go to activity
          </Link>
        </div>
      </div>
    );
  }

  return <LatexEditor initialTex={tex} />;
}
