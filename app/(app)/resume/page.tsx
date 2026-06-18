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

  const name = session!.user.name || session!.user.email;
  const contact = connection?.handle ? `github.com/${connection.handle}` : null;

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

      <div className="min-h-[calc(100vh-62px)] bg-[#f3f3f2] px-7 pt-10 pb-20">
        <article className="mx-auto max-w-[716px] rounded-md border border-[rgba(0,0,0,0.07)] bg-white px-[60px] py-14 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(0,0,0,0.16)]">
          <header className="flex flex-col gap-1.5 border-b border-[rgba(0,0,0,0.09)] pb-5">
            <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[#141414]">{name}</h1>
            {view.headline ? <p className="text-[16px] text-[#5a5a5a]">{view.headline}</p> : null}
            {contact ? <p className="mt-1 font-mono text-[12px] text-[#9a9a9a]">{contact}</p> : null}
          </header>

          {view.summary ? (
            <section className="pt-[22px]">
              <p className="text-[14.5px] leading-[1.65] text-[#333]">{view.summary}</p>
            </section>
          ) : null}

          {view.skills.length > 0 ? (
            <section className="pt-[26px]">
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">Skills</h2>
              <div className="flex flex-col gap-2">
                {view.skills.map((sk) => (
                  <div key={sk.label} className="flex items-baseline gap-2.5">
                    <span className="w-[108px] flex-none text-[13px] font-semibold text-[#404040]">{sk.label}</span>
                    <span className="text-[13.5px] leading-[1.5] text-[#555]">{sk.list}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {view.groups.length > 0 ? (
            <section className="pt-[26px]">
              <h2 className="mb-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">Selected Work</h2>
              <div className="flex flex-col gap-5">
                {view.groups.map((group) => (
                  <div key={group.project} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-2.5">
                      <span className="text-[15px] font-semibold text-[#1c1c1c]">{group.project}</span>
                      {group.meta ? <span className="font-mono text-[11.5px] text-[#a0a0a0]">{group.meta}</span> : null}
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-[7px] p-0">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex gap-[9px] text-[13.5px] leading-[1.6] text-[#333]">
                          <span className="flex-none leading-[1.6] text-[#c0c0c0]">—</span>
                          <span>
                            {item.content}
                            {item.evidence.length > 0 ? (
                              <sup className="ml-[3px] whitespace-nowrap">
                                {item.evidence.map((ev) => (
                                  <a
                                    key={ev.url}
                                    href={ev.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-0.5 font-mono text-[9.5px] text-[#a0a0a0] no-underline hover:text-[#262626] hover:underline"
                                  >
                                    {ev.sourceLabel}
                                  </a>
                                ))}
                              </sup>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mt-[34px] flex items-center gap-[7px] border-t border-[rgba(0,0,0,0.07)] pt-4">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b8b8b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            <span className="font-mono text-[10.5px] text-[#b0b0b0]">generated by the resume thing · every claim links to its source</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
