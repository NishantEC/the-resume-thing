import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/app/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const userId = session.user.id;

  const [connection, activityCount, items] = await Promise.all([
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { handle: true },
    }),
    prisma.activity.count({ where: { userId } }),
    prisma.resumeItem.findMany({
      where: { resume: { userId } },
      select: { status: true },
    }),
  ]);
  const acceptedCount = items.filter((i) => i.status === "accepted").length;

  return (
    <div className="flex h-screen">
      <Sidebar
        name={session.user.name || session.user.email}
        handle={connection?.handle ?? null}
        // Auth is GitHub OAuth, so a signed-in user is always GitHub-connected.
        connected
        synced={activityCount > 0}
        activityCount={activityCount}
        synthesized={items.length > 0}
        acceptedCount={acceptedCount}
        totalItems={items.length}
      />
      <main className="h-screen min-w-0 flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
