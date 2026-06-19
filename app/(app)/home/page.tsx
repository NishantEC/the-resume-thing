import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { loadActivity, countUnreflectedActivity } from "@/lib/activity/load";
import { SuggestionsQueue } from "@/components/app/suggestions-queue";
import { SyncButton } from "@/components/app/sync-button";
import { GenerateButton } from "@/components/app/generate-button";

function ago(date: Date | null): string {
  if (!date) return "never";
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const GRID = {
  backgroundImage:
    "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};

export default async function HomePage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const [resume, activity, drift] = await Promise.all([
    loadResume(userId),
    loadActivity(userId),
    countUnreflectedActivity(userId),
  ]);

  const accepted = resume?.acceptedCount ?? 0;
  const total = resume?.totalItems ?? 0;
  const pending = total - accepted;
  const pct = resume?.pct ?? 0;
  const status =
    total === 0 ? "no résumé yet" : pending > 0 ? `${pending} pending` : drift > 0 ? `${drift} behind` : "ready to ship";
  const shipReady = total > 0 && pending === 0 && drift === 0;

  return (
    <div className="min-h-screen" style={GRID}>
      <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-10 py-10">
        {/* Command line */}
        <header className="flex items-center justify-between gap-4 [animation:screenIn_.4s_ease]">
          <div className="min-w-0 truncate font-mono text-[13px] text-muted-foreground">
            <span className="text-foreground">~/career</span>
            <span className="px-2 text-border">·</span>synced {ago(activity.lastSyncAt)}
            {total > 0 ? (
              <>
                <span className="px-2 text-border">·</span>
                <span className="text-foreground">
                  {accepted}/{total}
                </span>
                <span className="px-2 text-border">·</span>
                {pct}%
              </>
            ) : null}
            <span className="ml-1 inline-block text-signal [animation:caret-blink_1s_ease-out_infinite]">▍</span>
          </div>
          <div className="flex flex-none items-center gap-2">
            {activity.total > 0 ? <GenerateButton /> : null}
            <SyncButton />
          </div>
        </header>

        {activity.total === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border bg-card px-6 py-14 text-center [animation:screenIn_.4s_ease_both] [animation-delay:60ms]">
            <span className="font-mono text-[12px] text-muted-foreground">$ workspace empty — no activity</span>
            <span className="text-[15px] font-medium text-foreground">Sync your GitHub to start the engine</span>
            <span className="max-w-[440px] text-[13px] leading-[1.5] text-muted-foreground">
              We read your real contributions and draft evidence-backed bullets — each one linked back to its source.
            </span>
            <div className="mt-1">
              <SyncButton />
            </div>
          </section>
        ) : (
          <>
            {/* Build readout */}
            <section className="flex items-end justify-between gap-6 rounded-[14px] border border-border bg-card px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [animation:screenIn_.4s_ease_both] [animation-delay:60ms]">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">résumé build</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[34px] font-semibold leading-none tracking-tight text-foreground">
                    {accepted}
                    <span className="text-muted-foreground">/{total}</span>
                  </span>
                  <span className="font-mono text-[12.5px] text-muted-foreground">accepted</span>
                </div>
                <div className="mt-1 h-[3px] w-[260px] max-w-full overflow-hidden rounded-full bg-accent">
                  <div className="h-full rounded-full bg-signal transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <span className={`font-mono text-[12px] ${shipReady ? "text-signal" : "text-muted-foreground"}`}>
                  {shipReady ? "● " : ""}
                  {status}
                </span>
                <Link
                  href="/resume"
                  className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-border bg-background px-3 font-mono text-[12px] text-foreground hover:border-signal/50 hover:bg-accent"
                >
                  open résumé
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </section>

            {/* Drift */}
            {drift > 0 ? (
              <div className="flex items-center gap-2 rounded-[10px] border border-warning/40 bg-warning/10 px-4 py-2.5 font-mono text-[12px] [animation:screenIn_.4s_ease_both] [animation-delay:100ms]">
                <span className="text-warning">⚠</span>
                <span className="text-foreground">
                  {drift} {drift === 1 ? "item" : "items"} of your work isn&apos;t reflected yet
                </span>
                <span className="text-muted-foreground">— run generate</span>
              </div>
            ) : null}

            {/* Checks */}
            <section className="flex flex-col gap-3 [animation:screenIn_.4s_ease_both] [animation-delay:140ms]">
              <div className="flex items-baseline justify-between">
                <h2 className="m-0 font-mono text-[13px] font-semibold tracking-tight text-foreground">checks</h2>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {pending} awaiting your decision
                </span>
              </div>
              {total === 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-card px-5 py-4">
                  <span className="font-mono text-[12.5px] text-muted-foreground">
                    activity ingested — synthesize to draft your first checks
                  </span>
                  <GenerateButton />
                </div>
              ) : (
                <SuggestionsQueue groups={resume!.groups} />
              )}
            </section>

            {/* Activity log */}
            <section className="overflow-hidden rounded-[14px] border border-border bg-card [animation:screenIn_.4s_ease_both] [animation-delay:180ms]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">activity.log</span>
                <span className="truncate font-mono text-[10.5px] text-muted-foreground/80">
                  {activity.stats.filter((s) => s.n !== "0").map((s) => `${s.n} ${s.label}`).join(" · ")}
                </span>
              </div>
              {activity.recent.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 border-b border-border px-4 py-1.5 font-mono text-[11.5px] no-underline last:border-b-0 hover:bg-accent"
                >
                  <span className="h-[6px] w-[6px] flex-none rounded-full" style={{ background: a.dot }} />
                  <span className="min-w-0 flex-1 truncate text-foreground/80">{a.title}</span>
                  <span className="flex-none text-muted-foreground">{a.repo}</span>
                  <span className="w-[68px] flex-none text-right text-muted-foreground/70">{a.type}</span>
                </a>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
