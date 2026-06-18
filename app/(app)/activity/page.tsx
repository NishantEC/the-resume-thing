import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { loadActivity } from "@/lib/activity/load";
import { GenerateButton } from "@/components/app/generate-button";
import { loadOrgs, loadRepos } from "@/lib/repos";
import { RepoManager } from "@/components/app/repo-manager";
import { OrgManager } from "@/components/app/org-manager";

export default async function ActivityPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const { total, stats, recent } = await loadActivity(userId);
  const repos = await loadRepos(userId);
  const orgs = await loadOrgs(userId);

  return (
    <div className="mx-auto max-w-[740px] animate-[screenIn_.4s_ease] px-[44px] pb-20 pt-12">
      <div className="mb-[30px] flex flex-col gap-[10px]">
        <span className="font-mono text-[12px] text-[#a0a0a0]">step 2 — ingest</span>
        <h1 className="m-0 text-[27px] font-semibold tracking-[-0.02em] text-[#161616]">
          What we found
        </h1>
        <p className="m-0 max-w-[540px] text-[15px] leading-[1.55] text-[#6b6b6b]">
          Your GitHub history, normalized into evidence. Every record keeps a link to its source.
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-[14px] rounded-[16px] border border-dashed border-black/[0.14] bg-white p-[46px] text-center">
          <span className="text-[15px] text-[#6b6b6b]">Nothing ingested yet.</span>
          <Link
            href="/sources"
            className="inline-flex h-9 items-center rounded-[9px] border border-black/[0.12] bg-white px-4 text-[13.5px] font-medium text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.03]"
          >
            Connect a source
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[22px]">
          <div className="grid grid-cols-3 gap-[10px]">
            {stats.map((t) => (
              <div
                key={t.label}
                className="flex flex-col gap-[5px] rounded-[12px] border border-black/[0.08] bg-white px-[14px] pb-[13px] pt-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#161616]">
                  {t.n}
                </span>
                <span className="text-[12px] leading-[1.2] text-[#8a8a8a]">{t.label}</span>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-[18px] py-[13px]">
              <span className="text-[13.5px] font-semibold text-[#262626]">Recent activity</span>
              <span className="font-mono text-[11px] text-[#a0a0a0]">most recent first</span>
            </div>
            {recent.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-[12px] border-b border-black/[0.05] px-[18px] py-[11px] no-underline hover:bg-black/[0.018]"
              >
                <span
                  className="h-[7px] w-[7px] flex-none rounded-[2px]"
                  style={{ background: a.dot }}
                />
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-[#2a2a2a]">
                  {a.title}
                </span>
                <span className="flex-none font-mono text-[11.5px] text-[#9a9a9a]">{a.repo}</span>
                <span className="w-[74px] flex-none text-right font-mono text-[10.5px] text-[#b0b0b0]">
                  {a.type}
                </span>
              </a>
            ))}
          </div>

          <RepoManager repos={repos} />

          <OrgManager orgs={orgs} />

          <div className="flex items-center justify-between gap-[16px] rounded-[14px] border border-black/[0.08] bg-[linear-gradient(180deg,#fff,#fbfbfb)] px-[20px] py-[16px]">
            <div className="flex flex-col gap-[2px]">
              <span className="text-[14.5px] font-semibold text-[#1c1c1c]">
                Ready to synthesize
              </span>
              <span className="text-[13px] text-[#8a8a8a]">
                We&apos;ll draft accomplishments and link each to its source.
              </span>
            </div>
            <GenerateButton />
          </div>
        </div>
      )}
    </div>
  );
}
