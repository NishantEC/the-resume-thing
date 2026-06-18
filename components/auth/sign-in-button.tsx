"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export function SignInButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const { error } = await signIn.social({
          provider: "github",
          callbackURL: "/sources",
        });
        // On success the browser redirects to GitHub; only reset on failure.
        if (error) setLoading(false);
      }}
      className="inline-flex h-[46px] items-center justify-center gap-2.5 rounded-[11px] border border-primary bg-primary px-[22px] text-[15px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_3px_rgba(28,28,28,0.28)] hover:bg-primary/90 hover:border-primary disabled:opacity-70"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.11-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.19.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
      </svg>
      {loading ? "Connecting\u2026" : "Continue with GitHub"}
    </button>
  );
}
