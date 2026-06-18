import type { ReactElement } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { ResumeView } from "@/components/resume/resume-view";
import { buttonVariants } from "@/components/ui/button";

export default async function ResumePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const view = await loadResume(session.user.id);

  if (!view) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            No resume yet
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate your resume from the dashboard
          </p>
        </div>
        <a href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </a>
      </main>
    );
  }

  const name = session.user.name || session.user.email;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-end gap-2">
        <a
          href="/dashboard"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Dashboard
        </a>
        <a
          href="/api/resume/pdf"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Download PDF
        </a>
      </div>
      <ResumeView view={view} name={name} />
    </main>
  );
}
