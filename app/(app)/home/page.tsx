import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { loadActivity } from "@/lib/activity/load";
import { ReviewBoard } from "@/components/app/review-board";
import { SyncButton } from "@/components/app/sync-button";
import { GenerateButton } from "@/components/app/generate-button";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function syncedLabel(date: Date | null): string {
  if (!date) return "Not synced yet";
  return `Synced ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export default async function HomePage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const [resume, activity] = await Promise.all([loadResume(userId), loadActivity(userId)]);
  const { total, stats, recent, lastSyncAt } = activity;

  return (
    <div className="mx-auto max-w-[860px] animate-[screenIn_.4s_ease] px-[44px] pt-12 pb-24">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[27px] font-semibold tracking-[-0.02em] text-foreground">Home</h1>
          <p className="m-0 text-[14px] text-muted-foreground">
            {syncedLabel(lastSyncAt)} · your work, turned into an evidence-backed résumé.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          {total > 0 ? <GenerateButton /> : null}
          <SyncButton />
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-[14px] rounded-[16px] border border-dashed border-border bg-card p-[46px] text-center">
          <span className="text-[15px] font-medium text-foreground">Nothing synced yet</span>
          <span className="max-w-[420px] text-[13.5px] leading-[1.5] text-muted-foreground">
            Sync your GitHub to pull in your contributions — then we draft résumé bullets, each linked
            to its source.
          </span>
          <div className="mt-1">
            <SyncButton />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Résumé status */}
          {resume ? (
            <Link
              href="/resume"
              className="group flex items-center justify-between gap-4 rounded-[16px] border border-border bg-card px-[20px] py-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-accent"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[14.5px] font-semibold text-foreground">Your résumé</span>
                <span className="text-[13px] text-muted-foreground">
                  {resume.acceptedCount} of {resume.totalItems} bullets accepted · {resume.pct}% complete
                </span>
              </div>
              <span className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[9px] border border-border bg-background px-3.5 text-[13px] font-semibold text-foreground group-hover:bg-card">
                Open résumé
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-border bg-card px-[20px] py-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col gap-1">
                <span className="text-[14.5px] font-semibold text-foreground">Ready to synthesize</span>
                <span className="text-[13px] text-muted-foreground">
                  We&apos;ll draft accomplishments from your activity and link each to its source.
                </span>
              </div>
              <GenerateButton />
            </div>
          )}

          {/* Suggestions feed */}
          {resume ? (
            <section className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between">
                <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-foreground">Suggestions</h2>
                <span className="font-mono text-[11px] text-muted-foreground">apply or dismiss · each carries its evidence</span>
              </div>
              <ReviewBoard resume={resume} />
            </section>
          ) : null}

          {/* Recent activity */}
          <section className="flex flex-col gap-3.5">
            <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-foreground">Recent activity</h2>
            <div className="grid grid-cols-3 gap-[10px]">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-[5px] rounded-[12px] border border-border bg-card px-[14px] pt-[14px] pb-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <span className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-foreground">{s.n}</span>
                  <span className="text-[12px] leading-[1.2] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-border px-[18px] py-[13px]">
                <span className="text-[13.5px] font-semibold text-foreground">Latest</span>
                <span className="font-mono text-[11px] text-muted-foreground">most recent first</span>
              </div>
              {recent.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-[12px] border-b border-border px-[18px] py-[11px] no-underline last:border-b-0 hover:bg-accent"
                >
                  <span className="h-[7px] w-[7px] flex-none rounded-[2px]" style={{ background: a.dot }} />
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-foreground">
                    {a.title}
                  </span>
                  <span className="flex-none font-mono text-[11.5px] text-muted-foreground">{a.repo}</span>
                  <span className="w-[74px] flex-none text-right font-mono text-[10.5px] text-muted-foreground">{a.type}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
