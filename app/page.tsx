import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";

export default async function Home(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/sources");

  return (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,#ffffff_0%,#f6f6f5_100%)] p-8 text-[#262626]">
      <div className="flex w-full max-w-[452px] flex-col gap-[30px] [animation:screenIn_.5s_ease]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-[30px] items-center justify-center rounded-lg bg-[#1c1c1c] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.2)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </span>
          <span className="font-mono text-[13px] tracking-[0.01em] text-[#8a8a8a]">the resume thing</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <h1 className="text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#161616]">
            A resume that keeps itself current.
          </h1>
          <p className="text-pretty text-[17px] leading-[1.55] text-[#6b6b6b]">
            Connect the places you actually do the work. We turn your activity into
            accomplishments — each one linked back to its source.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3.5">
          <SignInButton />
          <p className="max-w-[380px] text-[13px] leading-[1.5] text-[#9a9a9a]">
            We read your public profile, email, and org membership. Nothing is posted
            on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
