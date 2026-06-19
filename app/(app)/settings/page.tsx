import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadOrgs, loadRepos } from "@/lib/repos";
import { DisconnectButton } from "@/components/app/disconnect-button";
import { RepoManager } from "@/components/app/repo-manager";
import { OrgManager } from "@/components/app/org-manager";
import { ConnectLinearButton } from "@/components/app/connect-linear-button";

const GITHUB_PATH =
  "M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.11-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.19.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z";

type Soon = { name: string; glyph: string; bg: string; fg: string };

const SOON: Soon[] = [
  { name: "Jira", glyph: "J", bg: "rgba(38,132,255,0.12)", fg: "#2684ff" },
  { name: "Asana", glyph: "A", bg: "rgba(244,86,98,0.12)", fg: "#f45662" },
];

export default async function SettingsPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const connection = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
    select: { handle: true },
  });
  const handle = connection?.handle ?? "you";

  const [repos, orgs, linearConn, linearAccount] = await Promise.all([
    loadRepos(userId),
    loadOrgs(userId),
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "linear" } },
      select: { handle: true },
    }),
    prisma.account.findFirst({ where: { userId, providerId: "linear" }, select: { id: true } }),
  ]);
  const linearConnected = linearAccount !== null;

  return (
    <div className="mx-auto max-w-[740px] animate-[screenIn_.4s_ease] px-[44px] pb-20 pt-12">
      <div className="mb-[34px] flex flex-col gap-[10px]">
        <h1 className="m-0 text-[27px] font-semibold tracking-[-0.02em] text-foreground">
          Settings
        </h1>
        <p className="m-0 max-w-[540px] text-[15px] leading-[1.55] text-muted-foreground">
          Manage your connected sources and choose which repositories and
          organizations we draw evidence from.
        </p>
      </div>

      <div className="flex flex-col gap-[22px]">
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
          </div>
        </div>

        {/* Linear */}
        <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-[18px] px-6 py-[22px]">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[11px]" style={{ background: "rgba(94,106,210,0.12)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#5e6ad2" aria-hidden>
                <path d="M2.2 13.6a9.8 9.8 0 0 0 8.2 8.2L2.2 13.6Zm-.2-2.4 10.8 10.8a9.9 9.9 0 0 0 2.6-.5L2.5 8.6a9.9 9.9 0 0 0-.5 2.6Zm1.4-4.7L17.5 20.6a10 10 0 0 0 1.9-1.3L4.7 4.6a10 10 0 0 0-1.3 1.9ZM6.4 3 21 17.6A9.97 9.97 0 0 0 6.4 3Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-[9px]">
                <span className="text-[15.5px] font-semibold text-foreground">Linear</span>
                {linearConnected ? (
                  <span className="inline-flex h-5 items-center gap-1 rounded-[6px] bg-[rgba(16,185,129,0.10)] px-[7px] text-[11.5px] font-semibold text-[#047857]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Connected
                  </span>
                ) : null}
              </div>
              <span className="text-[13.5px] text-muted-foreground">
                {linearConnected
                  ? `Connected${linearConn?.handle ? ` as ${linearConn.handle}` : " — issues, projects & cycles sync automatically"}`
                  : "Pull your issues, projects, and cycles into your résumé — synced continuously."}
              </span>
            </div>
            {linearConnected ? null : <ConnectLinearButton />}
          </div>
        </div>

        {/* coming soon */}
        <div className="grid grid-cols-3 gap-3">
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

        <RepoManager repos={repos} />

        <OrgManager orgs={orgs} />
      </div>
    </div>
  );
}
