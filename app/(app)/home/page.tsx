import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { loadActivity, countUnreflectedActivity } from "@/lib/activity/load";
import { loadConnections } from "@/lib/sources/connections";
import { SyncButton } from "@/components/app/sync-button";
import { GenerateButton } from "@/components/app/generate-button";
import { LiveRefresh } from "@/components/app/live-refresh";

function ago(date: Date | null): string {
  if (!date) return "never";
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SRC_TAG: Record<string, string> = { github: "gh", linear: "lin", jira: "jira", asana: "asana" };
const SRC_DOT: Record<string, string> = { github: "#22c55e", linear: "#5e6ad2", jira: "#2684ff", asana: "#f45662" };

export default async function HomePage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const [resume, activity, drift, connections] = await Promise.all([
    loadResume(userId),
    loadActivity(userId),
    countUnreflectedActivity(userId),
    loadConnections(userId),
  ]);

  const accepted = resume?.acceptedCount ?? 0;
  const total = resume?.totalItems ?? 0;
  const pending = total - accepted;
  const pct = resume?.pct ?? 0;
  const shipReady = total > 0 && pending === 0 && drift === 0;
  const status =
    total === 0 ? "no résumé yet" : pending > 0 ? `${pending} pending` : drift > 0 ? `${drift} behind` : "ready to ship";
  const hasLinear = connections.some((c) => c.provider === "linear");

  return (
    <div className="min-h-screen">
      <LiveRefresh />
      <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-10 py-10">
        {/* Command line */}
        <header className="flex items-center justify-between gap-4 [animation:screenIn_.4s_ease]">
          <div className="min-w-0 truncate font-mono text-[13px] text-muted-foreground">
            <span className="text-foreground">~/career</span>
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

        {/* Sources bar */}
        <section className="flex flex-wrap items-center gap-2 [animation:screenIn_.4s_ease_both] [animation-delay:40ms]">
          {connections.map((c) => (
            <div
              key={c.provider}
              className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 font-mono text-[11.5px]"
            >
              <span className="size-1.5 flex-none rounded-full" style={{ background: SRC_DOT[c.provider] ?? "#9ca3af" }} />
              <span className="text-foreground">{c.label}</span>
              {c.handle ? <span className="text-muted-foreground">@{c.handle}</span> : null}
              <span className="text-muted-foreground/70">· {ago(c.lastSyncAt)} · {c.count}</span>
            </div>
          ))}
          {!hasLinear ? (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-[10px] border border-dashed border-border px-3 py-2 font-mono text-[11.5px] text-muted-foreground hover:border-signal/50 hover:text-foreground"
            >
              <span className="text-signal">+</span> connect linear
            </Link>
          ) : null}
        </section>

        {activity.total === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border bg-card px-6 py-14 text-center [animation:screenIn_.4s_ease_both] [animation-delay:80ms]">
            <span className="font-mono text-[12px] text-muted-foreground">$ workspace empty — no activity</span>
            <span className="text-[15px] font-medium text-foreground">Sync your sources to start the engine</span>
            <span className="max-w-[440px] text-[13px] leading-[1.5] text-muted-foreground">
              Connect GitHub and Linear; a worker keeps pulling your real work and drafting evidence-backed bullets —
              each linked to its source.
            </span>
            <div className="mt-1">
              <SyncButton />
            </div>
          </section>
        ) : (
          <>
            {/* Build readout */}
            <section className="flex items-end justify-between gap-6 rounded-[14px] border border-border bg-card px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [animation:screenIn_.4s_ease_both] [animation-delay:80ms]">
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
              <div className="flex items-center gap-2 rounded-[10px] border border-warning/40 bg-warning/10 px-4 py-2.5 font-mono text-[12px] [animation:screenIn_.4s_ease_both] [animation-delay:120ms]">
                <span className="text-warning">⚠</span>
                <span className="text-foreground">
                  {drift} {drift === 1 ? "item" : "items"} of your work isn&apos;t reflected yet
                </span>
                <span className="text-muted-foreground">— run generate</span>
              </div>
            ) : null}

            {/* Review */}
            <section className="flex flex-col gap-3 [animation:screenIn_.4s_ease_both] [animation-delay:160ms]">
              <div className="flex items-baseline justify-between">
                <h2 className="m-0 font-mono text-[13px] font-semibold tracking-tight text-foreground">inbox</h2>
                <span className="font-mono text-[10.5px] text-muted-foreground">{pending} awaiting your decision</span>
              </div>
              {total === 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-card px-5 py-4">
                  <span className="font-mono text-[12.5px] text-muted-foreground">
                    activity ingested — synthesize to draft your first checks
                  </span>
                  <GenerateButton />
                </div>
              ) : pending === 0 ? (
                <div className="flex items-center gap-2 rounded-[14px] border border-border bg-card px-5 py-4 font-mono text-[12.5px] text-muted-foreground">
                  <span className="text-signal">✓</span> all checks reviewed — your résumé is current
                </div>
              ) : (
                <Link
                  href="/review"
                  className="group flex items-center justify-between gap-4 rounded-[14px] border border-border bg-card px-5 py-4 hover:border-signal/50 hover:bg-accent"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-foreground">
                      {pending} {pending === 1 ? "check" : "checks"} to review
                    </span>
                    <span className="font-mono text-[11.5px] text-muted-foreground">
                      apply or dismiss AI-drafted bullets beside a live résumé
                    </span>
                  </div>
                  <span className="inline-flex h-8 flex-none items-center gap-1.5 rounded-[7px] border border-signal/40 bg-signal/10 px-3 font-mono text-[12px] text-signal">
                    review
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </Link>
              )}
            </section>

            {/* Stream */}
            <section className="overflow-hidden rounded-[14px] border border-border bg-card [animation:screenIn_.4s_ease_both] [animation-delay:200ms]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                <span className="font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">stream</span>
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
                  <span className="w-[30px] flex-none text-muted-foreground/60">{SRC_TAG[a.provider] ?? a.provider}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground/80">{a.title}</span>
                  <span className="flex-none text-muted-foreground">{a.repo}</span>
                  <span className="w-[64px] flex-none text-right text-muted-foreground/70">{a.type}</span>
                </a>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
