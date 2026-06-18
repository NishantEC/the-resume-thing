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

  const connection = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
    select: { handle: true },
  });

  return (
    <div className="flex h-screen">
      <Sidebar
        name={session.user.name || session.user.email}
        handle={connection?.handle ?? null}
      />
      <main className="h-screen min-w-0 flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
