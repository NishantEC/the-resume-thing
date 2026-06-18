import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function Home(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-sm text-muted-foreground">the resume thing</p>
        <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight">
          A resume that keeps itself current.
        </h1>
        <p className="text-pretty text-lg text-muted-foreground">
          Connect the places you actually do the work. We turn your activity into
          accomplishments — each one linked back to its source.
        </p>
      </header>

      {session ? (
        <section className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex flex-col">
            <span className="font-medium">
              {session.user.name || session.user.email}
            </span>
            <span className="text-sm text-muted-foreground">
              Signed in with GitHub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Open dashboard
            </Link>
            <SignOutButton />
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-start gap-3">
          <SignInButton />
          <p className="text-sm text-muted-foreground">
            We read your public profile, email, and org membership. Nothing is
            posted on your behalf.
          </p>
        </section>
      )}
    </main>
  );
}
