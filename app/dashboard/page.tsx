import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncButton } from "@/components/sync-button";
import { SignOutButton } from "@/components/auth/sign-out-button";

function timeAgo(date: Date | null): string {
  if (!date) return "never";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function Dashboard(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const userId = session.user.id;

  const [total, connection, recent, byType] = await Promise.all([
    prisma.activity.count({ where: { userId } }),
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: [{ occurredAt: "desc" }],
      take: 10,
    }),
    prisma.activity.groupBy({
      by: ["type"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name || session.user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex flex-col">
          <span className="font-medium">GitHub</span>
          <span className="text-sm text-muted-foreground">
            {total} activities · last synced {timeAgo(connection?.lastSyncAt ?? null)}
          </span>
        </div>
        <SyncButton />
      </section>

      {byType.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {byType.map((g) => (
            <li
              key={g.type}
              className="rounded-md border bg-muted/40 px-2.5 py-1 text-sm text-muted-foreground"
            >
              {g._count._all} {g.type.replace("_", " ")}
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet — hit “Sync now” to pull your GitHub history.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {recent.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 p-3">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-medium hover:underline"
                >
                  {a.title}
                </a>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {a.type.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
