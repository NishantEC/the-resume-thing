"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ConnectLinearButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        // Links Linear to the current (GitHub-authed) user, then returns here.
        const { error } = await authClient.oauth2.link({
          providerId: "linear",
          callbackURL: "/settings",
        });
        // On success the browser redirects to Linear; only reset on failure.
        if (error) setLoading(false);
      }}
      className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#5e6ad2]/40 bg-[#5e6ad2]/10 px-4 text-[13.5px] font-semibold text-[#5e6ad2] hover:bg-[#5e6ad2]/20 disabled:cursor-default disabled:opacity-70"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M2.2 13.6a9.8 9.8 0 0 0 8.2 8.2L2.2 13.6Zm-.2-2.4 10.8 10.8a9.9 9.9 0 0 0 2.6-.5L2.5 8.6a9.9 9.9 0 0 0-.5 2.6Zm1.4-4.7L17.5 20.6a10 10 0 0 0 1.9-1.3L4.7 4.6a10 10 0 0 0-1.3 1.9ZM6.4 3 21 17.6A9.97 9.97 0 0 0 6.4 3Z" />
      </svg>
      {loading ? "Connecting…" : "Connect Linear"}
    </button>
  );
}
