import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default async function Home(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/sources");

  return (
    <div className="relative flex h-screen items-center justify-center bg-background p-8 text-foreground">
      <ThemeToggle className="absolute right-5 top-5 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" />
      <div className="flex w-full max-w-[452px] flex-col gap-[30px] [animation:screenIn_.5s_ease]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.2)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </span>
          <span className="font-mono text-[13px] tracking-[0.01em] text-muted-foreground">the resume thing</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <h1 className="text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            A resume that keeps itself current.
          </h1>
          <p className="text-pretty text-[17px] leading-[1.55] text-muted-foreground">
            Connect the places you actually do the work. We turn your activity into
            accomplishments — each one linked back to its source.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3.5">
          <SignInButton />
          <p className="max-w-[380px] text-[13px] leading-[1.5] text-muted-foreground">
            We read your public profile, email, and org membership. Nothing is posted
            on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
