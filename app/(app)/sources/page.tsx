import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncButton } from "@/components/app/sync-button";
import { DisconnectButton } from "@/components/app/disconnect-button";

const GITHUB_PATH =
  "M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.11-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.19.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z";

type Soon = { name: string; glyph: string; bg: string; fg: string };

const SOON: Soon[] = [
  { name: "Linear", glyph: "L", bg: "rgba(94,106,210,0.12)", fg: "#5e6ad2" },
  { name: "Jira", glyph: "J", bg: "rgba(38,132,255,0.12)", fg: "#2684ff" },
  { name: "Asana", glyph: "A", bg: "rgba(244,86,98,0.12)", fg: "#f45662" },
];

export default async function SourcesPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const connection = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
    select: { handle: true },
  });
  const handle = connection?.handle ?? "you";

  return (
    <div className="mx-auto max-w-[740px] px-[44px] pb-[80px] pt-[48px]">
      <div className="mb-[34px] flex flex-col gap-[10px]">
        <span className="font-mono text-[12px] text-muted-foreground">step 1 — connect</span>
        <h1 className="text-[27px] font-semibold tracking-[-0.02em] text-foreground">
          Connect your work
        </h1>
        <p className="max-w-[540px] text-[15px] leading-[1.55] text-muted-foreground">
          We read what you actually shipped. Connect a source and we ingest the
          evidence — nothing is posted on your behalf.
        </p>
      </div>

      {/* GitHub: connected */}
      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-[18px] px-6 py-[22px]">
          <div className="relative flex h-11 w-11 flex-none items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d={GITHUB_PATH} />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-[9px]">
              <span className="text-[15.5px] font-semibold text-foreground">GitHub</span>
              <span className="inline-flex h-5 items-center gap-1 rounded-[6px] bg-[rgba(16,185,129,0.10)] px-[7px] text-[11.5px] font-semibold text-[#047857]">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#047857"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Connected
              </span>
            </div>
            <span className="text-[13.5px] text-muted-foreground">
              Connected as{" "}
              <span className="font-mono text-[12.5px] text-muted-foreground">@{handle}</span>
            </span>
          </div>
          <DisconnectButton />
        </div>
        <div className="flex flex-wrap items-center gap-[10px] border-t border-border bg-accent px-6 py-[14px]">
          <span className="font-mono text-[11px] text-muted-foreground">scopes</span>
          <span className="rounded-[6px] border border-border bg-card px-2 py-[3px] font-mono text-[11.5px] text-muted-foreground">
            read:user
          </span>
          <span className="rounded-[6px] border border-border bg-card px-2 py-[3px] font-mono text-[11.5px] text-muted-foreground">
            user:email
          </span>
          <span className="rounded-[6px] border border-border bg-card px-2 py-[3px] font-mono text-[11.5px] text-muted-foreground">
            read:org
          </span>
          <div className="flex-1" />
          <SyncButton />
        </div>
      </div>

      {/* coming soon */}
      <div className="mt-[14px] grid grid-cols-3 gap-3">
        {SOON.map((s) => (
          <div
            key={s.name}
            className="flex flex-col gap-[11px] rounded-[13px] border border-border bg-card p-4 opacity-70"
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[13px] font-bold"
                style={{ background: s.bg, color: s.fg }}
              >
                {s.glyph}
              </div>
              <span className="font-mono text-[10px] tracking-[0.03em] text-muted-foreground">
                soon
              </span>
            </div>
            <span className="text-[13.5px] font-semibold text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
