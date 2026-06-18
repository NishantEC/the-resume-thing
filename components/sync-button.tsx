"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { syncGithubAction } from "@/app/actions";

export function SyncButton(): React.ReactElement {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await syncGithubAction();
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sync failed");
            }
          });
        }}
      >
        Sync now
      </Button>
      {error && <p className="text-sm text-destructive-foreground">{error}</p>}
    </div>
  );
}
