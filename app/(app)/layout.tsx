import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/app/sidebar";
import { activeResumeId } from "@/lib/resume/active";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const userId = session.user.id;

  const [connection, resumes, activeId] = await Promise.all([
    prisma.connection.findUnique({
      where: { userId_provider: { userId, provider: "github" } },
      select: { handle: true },
    }),
    prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, targetRole: true },
    }),
    activeResumeId(userId),
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar
        name={session.user.name || session.user.email}
        handle={connection?.handle ?? null}
        resumes={resumes}
        activeResumeId={activeId}
      />
      <main className="h-screen min-w-0 flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
