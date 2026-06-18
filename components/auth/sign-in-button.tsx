"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      size="lg"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        const { error } = await signIn.social({
          provider: "github",
          callbackURL: "/dashboard",
        });
        // On success the browser redirects to GitHub; only reset on failure.
        if (error) setLoading(false);
      }}
    >
      Continue with GitHub
    </Button>
  );
}
