import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadResume } from "@/lib/resume/load";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthYear(date: Date | null): string {
  if (!date) return "draft";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export default async function ResumePage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [view, connection] = await Promise.all([
    loadResume(userId),
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { handle: true, lastSyncAt: true },
    }),
  ]);

  if (!view) {
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


  return (
    <div className="min-h-screen [animation:screenIn_.4s_ease]">
      <div className="sticky top-0 z-[5] flex items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.07)] bg-[rgba(255,255,255,0.85)] px-7 py-3.5 backdrop-blur-[8px]">
        <Link
          href="/review"
          className="inline-flex h-[33px] items-center gap-1.5 rounded-lg border border-transparent px-3 text-[13px] font-medium text-[#525252] hover:bg-[rgba(0,0,0,0.05)] hover:text-[#262626]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to review
        </Link>
        <span className="font-mono text-[11.5px] text-[#a8a8a8]">
          resume.pdf · synced {monthYear(connection?.lastSyncAt ?? null)}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/resume/edit"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-[rgba(0,0,0,0.12)] bg-white px-3.5 text-[13px] font-semibold text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.03)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit LaTeX
          </Link>
          <a
            href="/api/resume/pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-[rgba(0,0,0,0.12)] bg-white px-3.5 text-[13px] font-semibold text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.03)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </a>
        </div>
      </div>

      <div className="min-h-[calc(100vh-62px)] bg-[#f3f3f2] px-7 py-10">
        <iframe
          src="/api/resume/pdf"
          title="Resume PDF"
          className="mx-auto block h-[calc(100vh-130px)] w-full max-w-[760px] rounded-md border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(0,0,0,0.16)]"
        />
      </div>
    </div>
  );
}
